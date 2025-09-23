import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoCall extends Document {
  // Core identification
  interviewId: string;
  applicationId: mongoose.Types.ObjectId;
  apprenticeshipId: mongoose.Types.ObjectId;
  
  // Participants
  employerId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  employerName: string;
  studentName: string;
  
  // Daily.co room details
  roomName: string;
  roomUrl: string;
  roomId: string;
  
  // Access tokens (encrypted/hashed for security)
  employerToken?: string; // Store encrypted or generate fresh
  studentToken?: string;  // Store encrypted or generate fresh
  
  // Scheduling
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // in minutes
  
  // Status tracking
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  
  // Participant tracking
  employerJoined?: Date;
  studentJoined?: Date;
  employerLeft?: Date;
  studentLeft?: Date;
  
  // Recording and notes
  recordingUrl?: string;
  recordingId?: string;
  interviewNotes?: string;
  employerFeedback?: string;
  studentFeedback?: string;
  
  // Technical details
  connectionIssues?: boolean;
  qualityIssues?: boolean;
  technicalNotes?: string;
  
  // Compliance and audit
  consentRecorded: boolean;
  dataRetentionDate: Date; // When to delete recording/data
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const VideoCallSchema = new Schema<IVideoCall>({
  // Core identification
  interviewId: {
    type: String,
    required: true,
    unique: true
  },
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: 'Application',
    required: true,

  },
  apprenticeshipId: {
    type: Schema.Types.ObjectId,
    ref: 'Apprenticeship',
    required: true,

  },
  
  // Participants
  employerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,

  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,

  },
  employerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Daily.co room details
  roomName: {
    type: String,
    required: true,
    unique: true,

  },
  roomUrl: {
    type: String,
    required: true
  },
  roomId: {
    type: String,
    required: true,

  },
  
  // Access tokens (store hashed versions for security)
  employerToken: {
    type: String,
    select: false // Don't include in regular queries
  },
  studentToken: {
    type: String,
    select: false // Don't include in regular queries
  },
  
  // Scheduling
  scheduledAt: {
    type: Date,
    required: true,

  },
  startedAt: {
    type: Date,

  },
  endedAt: {
    type: Date,

  },
  duration: {
    type: Number,
    min: 0,
    max: 180 // Max 3 hours
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled',
    required: true,

  },
  
  // Participant tracking
  employerJoined: Date,
  studentJoined: Date,
  employerLeft: Date,
  studentLeft: Date,
  
  // Recording and notes
  recordingUrl: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Recording URL must be a valid URL'
    }
  },
  recordingId: String,
  interviewNotes: {
    type: String,
    maxlength: 2000
  },
  employerFeedback: {
    type: String,
    maxlength: 1000
  },
  studentFeedback: {
    type: String,
    maxlength: 1000
  },
  
  // Technical details
  connectionIssues: {
    type: Boolean,
    default: false
  },
  qualityIssues: {
    type: Boolean,
    default: false
  },
  technicalNotes: {
    type: String,
    maxlength: 500
  },
  
  // Compliance and audit
  consentRecorded: {
    type: Boolean,
    required: true,
    default: false
  },
  dataRetentionDate: {
    type: Date,
    required: true,

  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,

  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes are managed centrally in server/config/indexes.ts

// Virtual for calculated fields
VideoCallSchema.virtual('isActive').get(function() {
  return this.status === 'in_progress';
});

VideoCallSchema.virtual('isUpcoming').get(function() {
  return this.status === 'scheduled' && this.scheduledAt > new Date();
});

VideoCallSchema.virtual('isPast').get(function() {
  return ['completed', 'cancelled', 'no_show'].includes(this.status);
});

VideoCallSchema.virtual('actualDuration').get(function() {
  if (this.startedAt && this.endedAt) {
    return Math.round((this.endedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
  }
  return null;
});

// Pre-save middleware
VideoCallSchema.pre('save', function(next) {
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  // Set data retention date (30 days after interview completion)
  if (!this.dataRetentionDate) {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() + 30);
    this.dataRetentionDate = retentionDate;
  }
  
  // Calculate duration if both start and end times are present
  if (this.startedAt && this.endedAt && !this.duration) {
    this.duration = Math.round((this.endedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
  }
  
  next();
});

// Static methods
VideoCallSchema.statics.findUpcomingInterviews = function(userId: string, isEmployer = false) {
  const userField = isEmployer ? 'employerId' : 'studentId';
  return this.find({
    [userField]: userId,
    status: 'scheduled',
    scheduledAt: { $gte: new Date() }
  }).sort({ scheduledAt: 1 });
};

VideoCallSchema.statics.findActiveInterview = function(userId: string, isEmployer = false) {
  const userField = isEmployer ? 'employerId' : 'studentId';
  return this.findOne({
    [userField]: userId,
    status: 'in_progress'
  });
};

VideoCallSchema.statics.findInterviewHistory = function(userId: string, isEmployer = false, limit = 10) {
  const userField = isEmployer ? 'employerId' : 'studentId';
  return this.find({
    [userField]: userId,
    status: { $in: ['completed', 'cancelled', 'no_show'] }
  })
  .sort({ scheduledAt: -1 })
  .limit(limit)
  .populate('applicationId')
  .populate('apprenticeshipId');
};

VideoCallSchema.statics.cleanupExpiredData = async function() {
  const expiredCalls = await this.find({
    dataRetentionDate: { $lt: new Date() }
  });
  
  console.log(`[VideoCall] Found ${expiredCalls.length} expired video calls for cleanup`);
  
  // Here you would also delete associated recordings from Daily.co
  // and any other cleanup tasks
  
  const result = await this.deleteMany({
    dataRetentionDate: { $lt: new Date() }
  });
  
  console.log(`[VideoCall] Cleaned up ${result.deletedCount} expired video calls`);
  return result;
};

// Instance methods
VideoCallSchema.methods.markAsStarted = function() {
  this.status = 'in_progress';
  this.startedAt = new Date();
  return this.save();
};

VideoCallSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.endedAt = new Date();
  if (this.startedAt) {
    this.duration = Math.round((this.endedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
  }
  return this.save();
};

VideoCallSchema.methods.markParticipantJoined = function(isEmployer = false) {
  if (isEmployer) {
    this.employerJoined = new Date();
  } else {
    this.studentJoined = new Date();
  }
  
  // If this is the first participant, mark interview as started
  if (!this.startedAt) {
    this.status = 'in_progress';
    this.startedAt = new Date();
  }
  
  return this.save();
};

VideoCallSchema.methods.markParticipantLeft = function(isEmployer = false) {
  if (isEmployer) {
    this.employerLeft = new Date();
  } else {
    this.studentLeft = new Date();
  }
  
  // If both participants have left, mark as completed
  if (this.employerLeft && this.studentLeft && this.status === 'in_progress') {
    this.status = 'completed';
    this.endedAt = new Date();
    if (this.startedAt) {
      this.duration = Math.round((this.endedAt.getTime() - this.startedAt.getTime()) / (1000 * 60));
    }
  }
  
  return this.save();
};

// Create and export the model
const VideoCall = mongoose.model<IVideoCall>('VideoCall', VideoCallSchema);

export default VideoCall;
export { VideoCallSchema };
