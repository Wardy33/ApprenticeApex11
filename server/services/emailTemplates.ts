// Email Templates for ApprenticeApex
// Comprehensive email templates for user communications

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Helper function to create responsive email wrapper
function createEmailWrapper(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ApprenticeApex</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
        }

        /* Base styles */
        body {
            margin: 0;
            padding: 0;
            width: 100% !important;
            min-width: 100%;
            background-color: #f8fafc;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
        }
        
        .logo {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            text-decoration: none;
            display: inline-block;
        }
        
        .content {
            padding: 40px 20px;
            line-height: 1.6;
            color: #374151;
        }
        
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #0080FF, #0066CC);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        
        .button:hover {
            background: linear-gradient(135deg, #0066CC, #0052A3);
        }
        
        .info-box {
            background-color: #f3f4f6;
            border-left: 4px solid #0080FF;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .warning-box {
            background-color: #fef3cd;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .footer {
            background-color: #f9fafb;
            padding: 30px 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
        }
        
        .social-links {
            margin: 20px 0;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #6b7280;
            text-decoration: none;
        }
        
        @media only screen and (max-width: 480px) {
            .content {
                padding: 20px 15px;
            }
            .header {
                padding: 30px 15px;
            }
            .footer {
                padding: 20px 15px;
            }
        }
    </style>
</head>
<body>
    ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
    <div class="email-container">
        <div class="header">
            <a href="https://apprenticeapex.com" class="logo">
                <span style="background: linear-gradient(45deg, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Apprentice</span><span style="background: linear-gradient(45deg, #3b82f6, #1d4ed8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Apex</span>
            </a>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>
                <strong>ApprenticeApex</strong><br>
                The UK's Premier Apprenticeship Platform
            </p>
            <div class="social-links">
                <a href="https://apprenticeapex.com/about">About</a> |
                <a href="https://apprenticeapex.com/contact">Contact</a> |
                <a href="https://apprenticeapex.com/privacy-policy">Privacy</a> |
                <a href="https://apprenticeapex.com/terms-of-service">Terms</a>
            </div>
            <p style="font-size: 12px; color: #9ca3af;">
                This email was sent to you because you have an account with ApprenticeApex.<br>
                If you no longer wish to receive these emails, you can <a href="{unsubscribe_url}" style="color: #9ca3af;">unsubscribe here</a>.
            </p>
        </div>
    </div>
</body>
</html>`;
}

// Helper function to format date and time
function formatDateTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  return date.toLocaleDateString('en-GB', options);
}

// Helper function to format date only
function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-GB', options);
}

// Helper function to format time only
function formatTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  return date.toLocaleTimeString('en-GB', options);
}

export interface InterviewInvitationData {
  employerName: string;
  studentName: string;
  apprenticeshipTitle: string;
  scheduledAt: Date;
  meetingUrl: string;
  duration: number;
}

// Interview invitation for employers
export function createInterviewInvitationEmployer(data: InterviewInvitationData): EmailTemplate {
  const { employerName, studentName, apprenticeshipTitle, scheduledAt, meetingUrl, duration } = data;
  
  const subject = `Video Interview Scheduled: ${studentName} for ${apprenticeshipTitle}`;
  const preheader = `Your interview with ${studentName} is scheduled for ${formatDate(scheduledAt)}`;
  
  const html = createEmailWrapper(`
    <h1 style="color: #1f2937; margin-bottom: 20px;">Video Interview Scheduled</h1>
    
    <p>Dear ${employerName},</p>
    
    <p>Your video interview has been successfully scheduled! Here are the details:</p>
    
    <div class="info-box">
        <h3 style="margin: 0 0 15px 0; color: #1f2937;">Interview Details</h3>
        <p style="margin: 5px 0;"><strong>Candidate:</strong> ${studentName}</p>
        <p style="margin: 5px 0;"><strong>Position:</strong> ${apprenticeshipTitle}</p>
        <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formatDateTime(scheduledAt)}</p>
        <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration} minutes</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="${meetingUrl}" class="button" style="color: #ffffff;">Join Video Interview</a>
    </div>
    
    <div class="warning-box">
        <h3 style="margin: 0 0 10px 0; color: #d97706;">Important Reminders</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Test your camera and microphone before the interview</li>
            <li>Ensure you have a stable internet connection</li>
            <li>Find a quiet, well-lit location for the interview</li>
            <li>Have the candidate's CV and application ready for reference</li>
            <li>The interview room will be available 15 minutes before the scheduled time</li>
        </ul>
    </div>
    
    <h3 style="color: #1f2937;">Technical Requirements</h3>
    <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Modern web browser (Chrome, Firefox, Safari, or Edge)</li>
        <li>Webcam and microphone</li>
        <li>Stable internet connection (minimum 1 Mbps upload/download)</li>
        <li>No software installation required - works directly in your browser</li>
    </ul>
    
    <h3 style="color: #1f2937;">Need Help?</h3>
    <p>If you experience any technical difficulties during the interview, please:</p>
    <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Use the "Report Issue" button in the video interface</li>
        <li>Contact our support team at <a href="mailto:support@apprenticeapex.com">support@apprenticeapex.com</a></li>
        <li>Call our support line at 0800 123 4567</li>
    </ul>
    
    <p>Good luck with your interview! We're here to support you in finding the perfect apprentice.</p>
    
    <p>Best regards,<br>
    The ApprenticeApex Team</p>
  `, preheader);
  
  const text = `
Video Interview Scheduled

Dear ${employerName},

Your video interview has been successfully scheduled!

Interview Details:
- Candidate: ${studentName}
- Position: ${apprenticeshipTitle}
- Date & Time: ${formatDateTime(scheduledAt)}
- Duration: ${duration} minutes

Join the interview: ${meetingUrl}

Important Reminders:
- Test your camera and microphone before the interview
- Ensure you have a stable internet connection
- Find a quiet, well-lit location for the interview
- Have the candidate's CV and application ready for reference
- The interview room will be available 15 minutes before the scheduled time

Technical Requirements:
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Webcam and microphone
- Stable internet connection (minimum 1 Mbps upload/download)
- No software installation required

Need help? Contact support@apprenticeapex.com or call 0800 123 4567

Best regards,
The ApprenticeApex Team
  `;
  
  return { subject, html, text };
}

// Interview invitation for students
export function createInterviewInvitationStudent(data: InterviewInvitationData): EmailTemplate {
  const { employerName, studentName, apprenticeshipTitle, scheduledAt, meetingUrl, duration } = data;
  
  const subject = `🎉 Interview Invitation: ${apprenticeshipTitle}`;
  const preheader = `You've been invited to interview for ${apprenticeshipTitle} on ${formatDate(scheduledAt)}`;
  
  const html = createEmailWrapper(`
    <h1 style="color: #1f2937; margin-bottom: 20px;">🎉 Interview Invitation</h1>
    
    <p>Dear ${studentName},</p>
    
    <p><strong>Congratulations!</strong> You've been invited to a video interview for an exciting apprenticeship opportunity!</p>
    
    <div class="info-box">
        <h3 style="margin: 0 0 15px 0; color: #1f2937;">Interview Details</h3>
        <p style="margin: 5px 0;"><strong>Position:</strong> ${apprenticeshipTitle}</p>
        <p style="margin: 5px 0;"><strong>Employer:</strong> ${employerName}</p>
        <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formatDateTime(scheduledAt)}</p>
        <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration} minutes</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="${meetingUrl}" class="button" style="color: #ffffff;">Join Video Interview</a>
    </div>
    
    <div class="warning-box">
        <h3 style="margin: 0 0 10px 0; color: #d97706;">Interview Preparation Tips</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Research the company and the role thoroughly</li>
            <li>Prepare examples of your achievements and experiences</li>
            <li>Test your camera and microphone beforehand</li>
            <li>Dress professionally (at least from the waist up!)</li>
            <li>Find a quiet, well-lit space for the interview</li>
            <li>Have a copy of your CV and application ready</li>
            <li>Prepare thoughtful questions about the apprenticeship</li>
        </ul>
    </div>
    
    <h3 style="color: #1f2937;">What to Expect</h3>
    <ul style="margin: 10px 0; padding-left: 20px;">
        <li>The interview will last approximately ${duration} minutes</li>
        <li>You'll discuss your background, interests, and career goals</li>
        <li>The employer will explain the role and company culture</li>
        <li>There will be time for you to ask questions</li>
        <li>The video call will be recorded for quality and training purposes</li>
    </ul>
    
    <h3 style="color: #1f2937;">Technical Requirements</h3>
    <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Modern web browser (Chrome, Firefox, Safari, or Edge recommended)</li>
        <li>Webcam and microphone</li>
        <li>Stable internet connection</li>
        <li>No software downloads required - everything works in your browser</li>
    </ul>
    
    <h3 style="color: #1f2937;">Need Support?</h3>
    <p>We're here to help you succeed! If you need any assistance:</p>
    <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Check out our <a href="https://apprenticeapex.com/interview-guide">Interview Preparation Guide</a></li>
        <li>Contact our student support team at <a href="mailto:students@apprenticeapex.com">students@apprenticeapex.com</a></li>
        <li>Join our community forum for peer support and tips</li>
    </ul>
    
    <p><strong>Good luck!</strong> We're rooting for you and excited to see you take this next step in your career journey.</p>
    
    <p>Best regards,<br>
    The ApprenticeApex Team</p>
  `, preheader);
  
  const text = `
🎉 Interview Invitation: ${apprenticeshipTitle}

Dear ${studentName},

Congratulations! You've been invited to a video interview for an exciting apprenticeship opportunity!

Interview Details:
- Position: ${apprenticeshipTitle}
- Employer: ${employerName}
- Date & Time: ${formatDateTime(scheduledAt)}
- Duration: ${duration} minutes

Join the interview: ${meetingUrl}

Interview Preparation Tips:
- Research the company and the role thoroughly
- Prepare examples of your achievements and experiences
- Test your camera and microphone beforehand
- Dress professionally
- Find a quiet, well-lit space for the interview
- Have a copy of your CV ready
- Prepare thoughtful questions about the apprenticeship

Technical Requirements:
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Webcam and microphone
- Stable internet connection
- No software downloads required

Need support? Contact students@apprenticeapex.com

Good luck!
The ApprenticeApex Team
  `;
  
  return { subject, html, text };
}

export interface InterviewCancellationData {
  employerName: string;
  studentName: string;
  apprenticeshipTitle: string;
  scheduledAt: Date;
}

// Interview cancellation notification for employers
export function createInterviewCancellationEmployer(data: InterviewCancellationData): EmailTemplate {
  const { employerName, studentName, apprenticeshipTitle, scheduledAt } = data;
  
  const subject = `Interview Cancelled: ${studentName} for ${apprenticeshipTitle}`;
  const preheader = `Your interview with ${studentName} scheduled for ${formatDate(scheduledAt)} has been cancelled`;
  
  const html = createEmailWrapper(`
    <h1 style="color: #dc2626; margin-bottom: 20px;">Interview Cancelled</h1>
    
    <p>Dear ${employerName},</p>
    
    <p>We're writing to inform you that your video interview has been cancelled.</p>
    
    <div class="info-box">
        <h3 style="margin: 0 0 15px 0; color: #1f2937;">Cancelled Interview Details</h3>
        <p style="margin: 5px 0;"><strong>Candidate:</strong> ${studentName}</p>
        <p style="margin: 5px 0;"><strong>Position:</strong> ${apprenticeshipTitle}</p>
        <p style="margin: 5px 0;"><strong>Original Date & Time:</strong> ${formatDateTime(scheduledAt)}</p>
    </div>
    
    <p>The application status has been updated and you can reschedule the interview at any time through your employer dashboard.</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://apprenticeapex.com/company" class="button" style="color: #ffffff;">Go to Dashboard</a>
    </div>
    
    <p>If you have any questions or need assistance with rescheduling, please don't hesitate to contact our support team.</p>
    
    <p>Best regards,<br>
    The ApprenticeApex Team</p>
  `, preheader);
  
  const text = `
Interview Cancelled

Dear ${employerName},

Your video interview has been cancelled.

Cancelled Interview Details:
- Candidate: ${studentName}
- Position: ${apprenticeshipTitle}
- Original Date & Time: ${formatDateTime(scheduledAt)}

You can reschedule the interview through your dashboard: https://apprenticeapex.com/company

Contact us if you need assistance.

Best regards,
The ApprenticeApex Team
  `;
  
  return { subject, html, text };
}

// Interview cancellation notification for students
export function createInterviewCancellationStudent(data: InterviewCancellationData): EmailTemplate {
  const { employerName, studentName, apprenticeshipTitle, scheduledAt } = data;
  
  const subject = `Interview Update: ${apprenticeshipTitle}`;
  const preheader = `Your interview for ${apprenticeshipTitle} scheduled for ${formatDate(scheduledAt)} has been cancelled`;
  
  const html = createEmailWrapper(`
    <h1 style="color: #dc2626; margin-bottom: 20px;">Interview Update</h1>
    
    <p>Dear ${studentName},</p>
    
    <p>We're writing to inform you that your scheduled video interview has been cancelled by the employer.</p>
    
    <div class="info-box">
        <h3 style="margin: 0 0 15px 0; color: #1f2937;">Cancelled Interview Details</h3>
        <p style="margin: 5px 0;"><strong>Position:</strong> ${apprenticeshipTitle}</p>
        <p style="margin: 5px 0;"><strong>Employer:</strong> ${employerName}</p>
        <p style="margin: 5px 0;"><strong>Original Date & Time:</strong> ${formatDateTime(scheduledAt)}</p>
    </div>
    
    <p><strong>Please don't be discouraged!</strong> Interview cancellations can happen for various reasons, and this doesn't reflect on your application quality.</p>
    
    <div class="warning-box">
        <h3 style="margin: 0 0 10px 0; color: #d97706;">What Happens Next?</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Your application remains active and under review</li>
            <li>The employer may reschedule the interview for a later date</li>
            <li>You may be contacted for alternative interview arrangements</li>
            <li>Continue exploring other opportunities on our platform</li>
        </ul>
    </div>
    
    <p>While you wait for updates on this opportunity, we encourage you to:</p>
    <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Continue applying to other relevant apprenticeships</li>
        <li>Update your profile with any new skills or experiences</li>
        <li>Practice your interview skills with our online tools</li>
        <li>Connect with other students in our community forum</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://apprenticeapex.com/student" class="button" style="color: #ffffff;">View More Opportunities</a>
    </div>
    
    <p>Remember, the right opportunity is out there waiting for you. Keep pushing forward!</p>
    
    <p>Best regards,<br>
    The ApprenticeApex Team</p>
  `, preheader);
  
  const text = `
Interview Update

Dear ${studentName},

Your scheduled video interview has been cancelled by the employer.

Cancelled Interview Details:
- Position: ${apprenticeshipTitle}
- Employer: ${employerName}
- Original Date & Time: ${formatDateTime(scheduledAt)}

Please don't be discouraged! Your application remains active and the employer may reschedule.

What to do next:
- Continue applying to other apprenticeships
- Update your profile
- Practice interview skills
- Explore more opportunities: https://apprenticeapex.com/student

Keep pushing forward!

Best regards,
The ApprenticeApex Team
  `;
  
  return { subject, html, text };
}

export interface InterviewReminderData {
  employerName: string;
  studentName: string;
  apprenticeshipTitle: string;
  scheduledAt: Date;
  meetingUrl: string;
  timeUntil: string; // e.g., "24 hours", "1 hour"
}

// Interview reminder for both employers and students
export function createInterviewReminder(data: InterviewReminderData, isEmployer: boolean): EmailTemplate {
  const { employerName, studentName, apprenticeshipTitle, scheduledAt, meetingUrl, timeUntil } = data;
  
  const recipientName = isEmployer ? employerName : studentName;
  const otherParty = isEmployer ? studentName : employerName;
  const subject = `⏰ Interview Reminder: ${apprenticeshipTitle} in ${timeUntil}`;
  const preheader = `Your interview ${isEmployer ? 'with ' + studentName : 'for ' + apprenticeshipTitle} is coming up in ${timeUntil}`;
  
  const html = createEmailWrapper(`
    <h1 style="color: #0080FF; margin-bottom: 20px;">⏰ Interview Reminder</h1>
    
    <p>Dear ${recipientName},</p>
    
    <p>This is a friendly reminder that your video interview is coming up in <strong>${timeUntil}</strong>!</p>
    
    <div class="info-box">
        <h3 style="margin: 0 0 15px 0; color: #1f2937;">Interview Details</h3>
        <p style="margin: 5px 0;"><strong>${isEmployer ? 'Candidate' : 'Position'}:</strong> ${isEmployer ? studentName : apprenticeshipTitle}</p>
        <p style="margin: 5px 0;"><strong>${isEmployer ? 'Position' : 'Employer'}:</strong> ${isEmployer ? apprenticeshipTitle : employerName}</p>
        <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formatDateTime(scheduledAt)}</p>
        <p style="margin: 5px 0;"><strong>Starting in:</strong> ${timeUntil}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="${meetingUrl}" class="button" style="color: #ffffff;">Join Video Interview</a>
    </div>
    
    <div class="warning-box">
        <h3 style="margin: 0 0 10px 0; color: #d97706;">Quick Checklist</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>✅ Test your camera and microphone</li>
            <li>✅ Check your internet connection</li>
            <li>✅ Find a quiet, well-lit space</li>
            <li>✅ Have your notes and questions ready</li>
            <li>✅ Arrive 5-10 minutes early</li>
        </ul>
    </div>
    
    <p>The interview room will be available 15 minutes before the scheduled time. We recommend joining early to test your setup.</p>
    
    <p>Need technical support? Contact us at <a href="mailto:support@apprenticeapex.com">support@apprenticeapex.com</a> or call 0800 123 4567.</p>
    
    <p>Best of luck!</p>
    
    <p>Best regards,<br>
    The ApprenticeApex Team</p>
  `, preheader);
  
  const text = `
⏰ Interview Reminder

Dear ${recipientName},

Your video interview is coming up in ${timeUntil}!

Interview Details:
- ${isEmployer ? 'Candidate' : 'Position'}: ${isEmployer ? studentName : apprenticeshipTitle}
- ${isEmployer ? 'Position' : 'Employer'}: ${isEmployer ? apprenticeshipTitle : employerName}
- Date & Time: ${formatDateTime(scheduledAt)}
- Starting in: ${timeUntil}

Join the interview: ${meetingUrl}

Quick Checklist:
- Test your camera and microphone
- Check your internet connection
- Find a quiet, well-lit space
- Have your notes ready
- Arrive 5-10 minutes early

Need support? Contact support@apprenticeapex.com or call 0800 123 4567

Best of luck!

The ApprenticeApex Team
  `;
  
  return { subject, html, text };
}

// Export all template functions
export const emailTemplates = {
  interviewInvitationEmployer: createInterviewInvitationEmployer,
  interviewInvitationStudent: createInterviewInvitationStudent,
  interviewCancellationEmployer: createInterviewCancellationEmployer,
  interviewCancellationStudent: createInterviewCancellationStudent,
  interviewReminder: createInterviewReminder
};
