import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth';
import { videoService } from '../services/videoService';
import VideoCall from '../models/VideoCall';
import { Application } from '../models/Application';
import { Apprenticeship } from '../models/Apprenticeship';
import { User } from '../models/User';
import EmailService from '../services/emailService';
import { sendSuccess, sendError } from '../utils/apiResponse';

const router = express.Router();

// Validation middleware
const validateScheduleInterview = [
  body('applicationId').isMongoId().withMessage('Valid application ID required'),
  body('scheduledAt').isISO8601().withMessage('Valid date/time required'),
  body('duration').optional().isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes')
];

const validateInterviewId = [
  param('interviewId').notEmpty().withMessage('Interview ID required')
];

/**
 * Schedule a new video interview
 * POST /api/video-interview/schedule
 */
router.post('/schedule', authenticateToken, requireRole(['company']), validateScheduleInterview, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400);
    }

    const { applicationId, scheduledAt, duration = 60 } = req.body;
    const employerId = req.user.id;

    // Get application details
    const application = await Application.findById(applicationId)
      .populate('studentId')
      .populate('apprenticeshipId');

    if (!application) {
      return sendError(res, 'Application not found', 404);
    }

    // Verify employer owns the apprenticeship
    const apprenticeship = await Apprenticeship.findById(application.apprenticeshipId);
    if (!apprenticeship || apprenticeship.companyId.toString() !== employerId) {
      return sendError(res, 'Unauthorized to schedule interview for this application', 403);
    }

    // Check if interview already exists
    const existingInterview = await VideoCall.findOne({ applicationId });
    if (existingInterview && existingInterview.status !== 'cancelled') {
      return res.status(400).json(createResponse(null, 'Interview already scheduled for this application'));
    }

    // Get participant details
    const employer = await User.findById(employerId);
    const student = await User.findById(application.studentId);

    if (!employer || !student) {
      return res.status(404).json(createResponse(null, 'Participant not found'));
    }

    // Generate unique interview ID
    const interviewId = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create Daily.co room and tokens
    const videoSession = await videoService.createInterviewSession(
      interviewId,
      employer.fullName || employer.email,
      student.fullName || student.email
    );

    // Create video call record
    const videoCall = new VideoCall({
      interviewId,
      applicationId,
      apprenticeshipId: application.apprenticeshipId,
      employerId,
      studentId: application.studentId,
      employerName: employer.fullName || employer.email,
      studentName: student.fullName || student.email,
      roomName: videoSession.room.name,
      roomUrl: videoSession.roomUrl,
      roomId: videoSession.room.id,
      scheduledAt: new Date(scheduledAt),
      status: 'scheduled',
      consentRecorded: true // Assume consent given during scheduling
    });

    await videoCall.save();

    // Update application status
    application.status = 'interview_scheduled';
    application.interviewScheduledAt = new Date(scheduledAt);
    await application.save();

    // Send interview invitation emails
    await Promise.all([
      emailService.sendInterviewInvitation(
        employer.email,
        {
          employerName: employer.fullName || employer.email,
          studentName: student.fullName || student.email,
          apprenticeshipTitle: apprenticeship.title,
          scheduledAt: new Date(scheduledAt),
          meetingUrl: videoSession.roomUrl,
          duration
        },
        true // isEmployer
      ),
      emailService.sendInterviewInvitation(
        student.email,
        {
          employerName: employer.fullName || employer.email,
          studentName: student.fullName || student.email,
          apprenticeshipTitle: apprenticeship.title,
          scheduledAt: new Date(scheduledAt),
          meetingUrl: videoSession.roomUrl,
          duration
        },
        false // isEmployer
      )
    ]);

    // Return interview details (without sensitive tokens)
    const response = {
      interviewId: videoCall.interviewId,
      scheduledAt: videoCall.scheduledAt,
      duration,
      roomUrl: videoSession.roomUrl,
      status: videoCall.status,
      employer: {
        name: employer.fullName || employer.email,
        email: employer.email
      },
      student: {
        name: student.fullName || student.email,
        email: student.email
      },
      apprenticeship: {
        title: apprenticeship.title,
        company: apprenticeship.companyName
      }
    };

    res.json(createResponse(response, 'Interview scheduled successfully'));

  } catch (error) {
    console.error('[VideoInterview] Schedule error:', error);
    res.status(500).json(createResponse(null, 'Failed to schedule interview'));
  }
});

/**
 * Get interview details
 * GET /api/video-interview/:interviewId
 */
router.get('/:interviewId', authenticateToken, validateInterviewId, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;

    const videoCall = await VideoCall.findOne({ interviewId })
      .populate('applicationId')
      .populate('apprenticeshipId');

    if (!videoCall) {
      return res.status(404).json(createResponse(null, 'Interview not found'));
    }

    // Check if user is authorized to view this interview
    const isEmployer = videoCall.employerId.toString() === userId;
    const isStudent = videoCall.studentId.toString() === userId;

    if (!isEmployer && !isStudent) {
      return res.status(403).json(createResponse(null, 'Unauthorized to view this interview'));
    }

    // Generate fresh meeting token for the current user
    let meetingToken;
    try {
      meetingToken = await videoService.createMeetingToken(
        videoCall.roomName,
        isEmployer ? videoCall.employerName : videoCall.studentName,
        isEmployer
      );
    } catch (error) {
      console.error('[VideoInterview] Token generation failed:', error);
      meetingToken = null;
    }

    const response = {
      interviewId: videoCall.interviewId,
      scheduledAt: videoCall.scheduledAt,
      startedAt: videoCall.startedAt,
      endedAt: videoCall.endedAt,
      duration: videoCall.duration,
      status: videoCall.status,
      roomUrl: videoCall.roomUrl,
      meetingToken,
      isEmployer,
      employer: {
        name: videoCall.employerName,
        joined: videoCall.employerJoined,
        left: videoCall.employerLeft
      },
      student: {
        name: videoCall.studentName,
        joined: videoCall.studentJoined,
        left: videoCall.studentLeft
      },
      apprenticeship: videoCall.apprenticeshipId,
      application: videoCall.applicationId,
      technicalIssues: {
        connection: videoCall.connectionIssues,
        quality: videoCall.qualityIssues,
        notes: videoCall.technicalNotes
      }
    };

    res.json(createResponse(response, 'Interview details retrieved'));

  } catch (error) {
    console.error('[VideoInterview] Get details error:', error);
    res.status(500).json(createResponse(null, 'Failed to get interview details'));
  }
});

/**
 * Join interview (track participant joining)
 * POST /api/video-interview/:interviewId/join
 */
router.post('/:interviewId/join', authenticateToken, validateInterviewId, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;

    const videoCall = await VideoCall.findOne({ interviewId });

    if (!videoCall) {
      return res.status(404).json(createResponse(null, 'Interview not found'));
    }

    const isEmployer = videoCall.employerId.toString() === userId;
    const isStudent = videoCall.studentId.toString() === userId;

    if (!isEmployer && !isStudent) {
      return res.status(403).json(createResponse(null, 'Unauthorized to join this interview'));
    }

    // Mark participant as joined
    await videoCall.markParticipantJoined(isEmployer);

    res.json(createResponse({ joined: true }, 'Successfully joined interview'));

  } catch (error) {
    console.error('[VideoInterview] Join error:', error);
    res.status(500).json(createResponse(null, 'Failed to join interview'));
  }
});

/**
 * Leave interview (track participant leaving)
 * POST /api/video-interview/:interviewId/leave
 */
router.post('/:interviewId/leave', authenticateToken, validateInterviewId, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;

    const videoCall = await VideoCall.findOne({ interviewId });

    if (!videoCall) {
      return res.status(404).json(createResponse(null, 'Interview not found'));
    }

    const isEmployer = videoCall.employerId.toString() === userId;
    const isStudent = videoCall.studentId.toString() === userId;

    if (!isEmployer && !isStudent) {
      return res.status(403).json(createResponse(null, 'Unauthorized'));
    }

    // Mark participant as left
    await videoCall.markParticipantLeft(isEmployer);

    res.json(createResponse({ left: true }, 'Successfully left interview'));

  } catch (error) {
    console.error('[VideoInterview] Leave error:', error);
    res.status(500).json(createResponse(null, 'Failed to leave interview'));
  }
});

/**
 * Cancel interview
 * DELETE /api/video-interview/:interviewId
 */
router.delete('/:interviewId', authenticateToken, validateInterviewId, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;

    const videoCall = await VideoCall.findOne({ interviewId })
      .populate('applicationId')
      .populate('apprenticeshipId');

    if (!videoCall) {
      return res.status(404).json(createResponse(null, 'Interview not found'));
    }

    // Only employer can cancel (or admin)
    const isEmployer = videoCall.employerId.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isEmployer && !isAdmin) {
      return res.status(403).json(createResponse(null, 'Only employers can cancel interviews'));
    }

    // Can't cancel if interview is in progress or completed
    if (['in_progress', 'completed'].includes(videoCall.status)) {
      return res.status(400).json(createResponse(null, 'Cannot cancel interview that is in progress or completed'));
    }

    // Update status
    videoCall.status = 'cancelled';
    await videoCall.save();

    // Update application status
    const application = await Application.findById(videoCall.applicationId);
    if (application) {
      application.status = 'under_review';
      application.interviewScheduledAt = undefined;
      await application.save();
    }

    // Delete Daily.co room
    try {
      await videoService.deleteRoom(videoCall.roomName);
    } catch (error) {
      console.error('[VideoInterview] Failed to delete Daily.co room:', error);
    }

    // Send cancellation emails
    const employer = await User.findById(videoCall.employerId);
    const student = await User.findById(videoCall.studentId);

    if (employer && student) {
      await Promise.all([
        emailService.sendInterviewCancellation(employer.email, {
          employerName: videoCall.employerName,
          studentName: videoCall.studentName,
          apprenticeshipTitle: videoCall.apprenticeshipId.title,
          scheduledAt: videoCall.scheduledAt
        }, true),
        emailService.sendInterviewCancellation(student.email, {
          employerName: videoCall.employerName,
          studentName: videoCall.studentName,
          apprenticeshipTitle: videoCall.apprenticeshipId.title,
          scheduledAt: videoCall.scheduledAt
        }, false)
      ]);
    }

    res.json(createResponse(null, 'Interview cancelled successfully'));

  } catch (error) {
    console.error('[VideoInterview] Cancel error:', error);
    res.status(500).json(createResponse(null, 'Failed to cancel interview'));
  }
});

/**
 * Get user's interviews (upcoming and past)
 * GET /api/video-interview/my-interviews
 */
router.get('/my-interviews', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const isEmployer = req.user.role === 'company';

    const [upcoming, past] = await Promise.all([
      VideoCall.findUpcomingInterviews(userId, isEmployer),
      VideoCall.findInterviewHistory(userId, isEmployer, 20)
    ]);

    res.json(createResponse({
      upcoming,
      past,
      total: upcoming.length + past.length
    }, 'Interviews retrieved successfully'));

  } catch (error) {
    console.error('[VideoInterview] Get my interviews error:', error);
    res.status(500).json(createResponse(null, 'Failed to get interviews'));
  }
});

/**
 * Report technical issues
 * POST /api/video-interview/:interviewId/report-issue
 */
router.post('/:interviewId/report-issue', authenticateToken, validateInterviewId, [
  body('issueType').isIn(['connection', 'quality', 'other']).withMessage('Valid issue type required'),
  body('description').isLength({ min: 10, max: 500 }).withMessage('Description must be 10-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(createResponse(null, 'Validation failed', errors.array()));
    }

    const { interviewId } = req.params;
    const { issueType, description } = req.body;
    const userId = req.user.id;

    const videoCall = await VideoCall.findOne({ interviewId });

    if (!videoCall) {
      return res.status(404).json(createResponse(null, 'Interview not found'));
    }

    const isEmployer = videoCall.employerId.toString() === userId;
    const isStudent = videoCall.studentId.toString() === userId;

    if (!isEmployer && !isStudent) {
      return res.status(403).json(createResponse(null, 'Unauthorized'));
    }

    // Update technical issue flags
    if (issueType === 'connection') {
      videoCall.connectionIssues = true;
    } else if (issueType === 'quality') {
      videoCall.qualityIssues = true;
    }

    const existingNotes = videoCall.technicalNotes || '';
    const newNote = `${isEmployer ? 'Employer' : 'Student'} reported ${issueType} issue: ${description}`;
    videoCall.technicalNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

    await videoCall.save();

    res.json(createResponse(null, 'Technical issue reported successfully'));

  } catch (error) {
    console.error('[VideoInterview] Report issue error:', error);
    res.status(500).json(createResponse(null, 'Failed to report issue'));
  }
});

export default router;
