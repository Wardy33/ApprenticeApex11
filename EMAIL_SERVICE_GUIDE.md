# ApprenticeApex Email Service Integration Guide

## Overview

The ApprenticeApex email service provides comprehensive email functionality using Hostinger SMTP with enterprise-grade features including:

- ✅ **Production-ready Hostinger SMTP integration** with connection pooling
- ✅ **Professional email templates** for all user interactions
- ✅ **Automated email triggers** from database and Stripe events
- ✅ **Email queue system** with retry logic and delivery tracking
- ✅ **Rate limiting and security** for all email endpoints
- ✅ **Email verification and preferences** management

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Hostinger SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=sportdrip3@gmail.com
SMTP_PASSWORD=@BeauWard1337
EMAIL_FROM=sportdrip3@gmail.com
EMAIL_FROM_NAME=ApprenticeApex
```

### SMTP Features

- **Connection Pooling**: Up to 5 simultaneous connections
- **Rate Limiting**: Max 14 messages per second
- **Retry Logic**: Exponential backoff on failures
- **SSL Encryption**: Secure 465 port with SSL
- **Connection Monitoring**: Automatic reconnection on failures

## Email Templates

### 1. Welcome Emails

**Student Welcome Email**
- Sent automatically on student registration
- Includes profile completion guidance
- Call-to-action to complete profile
- Branded with ApprenticeApex design

**Employer Welcome Email**
- Sent automatically on company registration
- Highlights 60-day risk-free trial
- Details trial benefits (unlimited postings, £399 per hire)
- Call-to-action to post first job

### 2. Application Emails

**Application Submitted**
- Triggered when student submits application
- Includes job details and timeline expectations
- Links to application tracking dashboard
- Automatic employer notification (if enabled)

**Application Status Updates**
- Triggered on status changes (shortlisted, interview, etc.)
- Interview scheduling with reminder system
- Rejection with constructive feedback
- Offer notifications and next steps

### 3. Payment Emails

**Payment Confirmation**
- Triggered from Stripe webhook events
- Includes payment details and invoice information
- Support contact information
- Receipt and transaction ID

**Subscription Confirmation**
- Plan details and billing cycle
- Feature access information
- Billing management links
- Upgrade/downgrade options

### 4. System Emails

**Email Verification**
- Secure token-based verification
- 1-hour expiration for security
- Branded template with clear instructions
- Automatic resend capability

**Password Reset**
- Secure token with 1-hour expiration
- Rate limited (3 attempts per hour)
- Clear security instructions
- Direct reset link

**Interview Reminders**
- 24-hour advance notification
- Interview details and preparation tips
- Calendar integration support
- Contact information for rescheduling

## API Endpoints

### Email Management (`/api/emails/`)

#### Send Email Verification
```http
POST /api/emails/verification/send
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Verify Email
```http
POST /api/emails/verification/verify
Content-Type: application/json

{
  "token": "verification_token_here"
}
```

#### Send Password Reset
```http
POST /api/emails/password-reset/send
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Update Email Preferences
```http
PATCH /api/emails/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "applicationNotifications": true,
  "paymentNotifications": true,
  "marketingEmails": false,
  "weeklyDigest": true,
  "interviewReminders": true
}
```

#### Get Email Preferences
```http
GET /api/emails/preferences
Authorization: Bearer <token>
```

#### Unsubscribe
```http
POST /api/emails/unsubscribe
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "unsubscribe_token" // Optional for better security
}
```

### Admin Endpoints

#### Email Queue Status
```http
GET /api/emails/queue/status
Authorization: Bearer <admin_token>
```

#### Send Test Email
```http
POST /api/emails/test
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "to": "test@example.com",
  "type": "welcome_student" // welcome_student, welcome_employer, notification
}
```

## Security Features

### Rate Limiting

**General Email Endpoints**
- 10 emails per 15 minutes per user
- Based on user ID or IP address
- Includes retry-after headers

**Password Reset**
- 3 attempts per hour per email
- Stricter limits for security
- Prevents abuse and brute force

### Token Security

**Email Verification**
- Cryptographically secure tokens
- 1-hour expiration
- Single-use tokens
- Database indexing for performance

**Password Reset**
- Secure random token generation
- Time-limited validity
- Automatic cleanup

**Unsubscribe**
- Optional secure token
- Prevents unauthorized unsubscribing
- Graceful degradation without token

## Email Queue System

### Features

**Queue Management**
- Automatic queuing of all emails
- Priority handling for urgent emails
- Batch processing every 10 seconds
- Failed email retry with exponential backoff

**Delivery Tracking**
- Real-time status monitoring
- Delivery success/failure logging
- Queue statistics for admin dashboard
- Failed email analysis

**Automatic Cleanup**
- 24-hour retention for completed emails
- Failed email debugging retention
- Automatic queue optimization
- Memory usage management

### Queue Statuses

- `pending`: Waiting to be sent
- `processing`: Currently being sent
- `sent`: Successfully delivered
- `failed`: Permanently failed after retries

## Integration Points

### Database Integration

**User Registration**
```javascript
// Automatic welcome email on user creation
const user = new User(userData);
await user.save();

// Welcome email sent automatically based on role
if (user.role === 'student') {
  await emailService.sendWelcomeEmailStudent(user);
} else if (user.role === 'company') {
  await emailService.sendWelcomeEmailEmployer(user);
}
```

**Application Submissions**
```javascript
// Application confirmation + employer notification
await emailService.sendApplicationSubmitted(user, application, apprenticeship);

// Status updates with interview reminders
await emailService.sendApplicationStatusUpdate(user, application, apprenticeship);
```

### Stripe Integration

**Payment Confirmations**
```javascript
// Automatic email from webhook events
payment_intent.succeeded -> Payment confirmation email
customer.subscription.created -> Subscription confirmation email
invoice.payment_failed -> Payment failure notification
```

**Success Fee Processing**
```javascript
// Automated success fee invoice generation
await emailService.sendSuccessFeeInvoice(employer, payment, apprenticeship, candidateData);
```

## Email Templates Design

### Responsive Design
- Mobile-first responsive templates
- Consistent brand colors and fonts
- Dark mode considerations
- Accessibility compliance

### Brand Guidelines
- ApprenticeApex logo and colors
- Gradient headers (#00D4FF to #0080FF)
- Professional typography
- Consistent footer with unsubscribe

### Content Strategy
- Clear, actionable subject lines
- Personalized content with user data
- Call-to-action buttons
- Support contact information

## Usage Examples

### Basic Email Sending
```javascript
import emailService from './services/emailService';

// Send custom email
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  html: '<h1>Custom HTML Content</h1>',
  text: 'Custom text content'
});
```

### Template-based Emails
```javascript
import emailTemplates from './services/emailTemplates';

// Generate template
const template = emailTemplates.getWelcomeStudentTemplate({ user });

// Send using template
await emailService.sendEmail({
  to: user.email,
  subject: template.subject,
  html: template.html,
  text: template.text
});
```

### Queue Status Monitoring
```javascript
// Check queue health
const status = emailService.getQueueStatus();
console.log(`Pending: ${status.pending}, Sent: ${status.sent}, Failed: ${status.failed}`);
```

## Monitoring and Maintenance

### Health Checks
- SMTP connection monitoring
- Queue processing verification
- Email delivery success rates
- Error rate tracking

### Logging
- All email events logged with timestamps
- Failed delivery debugging information
- Queue processing statistics
- Security event logging

### Maintenance Tasks
- Regular queue cleanup
- Failed email analysis
- Performance optimization
- Template updates

## Troubleshooting

### Common Issues

**SMTP Connection Failures**
```bash
# Check environment variables
echo $SMTP_USER $SMTP_PASSWORD

# Verify Hostinger SMTP settings
telnet smtp.hostinger.com 465
```

**Email Delivery Issues**
```javascript
// Check queue status
const status = emailService.getQueueStatus();

// Monitor failed emails
console.log('Failed emails:', status.failed);
```

**Rate Limiting**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 900

{
  "error": "Too many email requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development

# Check email service logs
# Look for: ✅ Email sent, ❌ Email failed, ⚠️ Email warning
```

## Production Deployment

### Environment Setup
1. Configure Hostinger SMTP credentials
2. Set production environment variables
3. Test email delivery in staging
4. Monitor initial production emails

### Performance Optimization
- Connection pooling configured for production load
- Queue processing optimized for high volume
- Rate limiting prevents abuse
- Automatic retry logic ensures delivery

### Security Considerations
- SMTP credentials stored securely
- Email content sanitization
- Token-based security for sensitive operations
- Rate limiting prevents abuse

## Support and Documentation

For technical support with email delivery issues:
- Check the admin queue status endpoint
- Review email service logs
- Verify SMTP configuration
- Contact Hostinger support if needed

The email service is designed to be reliable, secure, and scalable for ApprenticeApex's growing user base.
