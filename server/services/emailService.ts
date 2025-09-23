import nodemailer, { Transporter } from 'nodemailer';
import { getEnvConfig, requireEnvVar } from '../config/env.js';
import { User } from '../models/User.js';
import { Payment } from '../models/Payment.js';
import { Application } from '../models/Application.js';
import { Apprenticeship } from '../models/Apprenticeship.js';
import {
  emailTemplates,
  InterviewInvitationData,
  InterviewCancellationData,
  InterviewReminderData
} from './emailTemplates';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailQueueItem {
  id: string;
  options: EmailOptions;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledAt: Date;
  lastAttemptAt?: Date;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  error?: string;
  metadata?: Record<string, any>;
}

class EmailService {
  private static instance: EmailService;
  private transporter: Transporter | null = null;
  private emailQueue: EmailQueueItem[] = [];
  private isProcessingQueue = false;
  private connectionRetries = 0;
  private maxConnectionRetries = 3;
  private isConnected = false;

  private constructor() {
    this.initializeTransporter();
    this.startQueueProcessor();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async initializeTransporter(): Promise<void> {
    try {
      const env = getEnvConfig();

      if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
        console.warn('���️  SMTP credentials not configured - emails will be queued but not sent');
        return;
      }

      // Create transporter with Hostinger SMTP settings
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE, // true for 465, false for other ports
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
        pool: true, // Enable connection pooling
        maxConnections: 5, // Max simultaneous connections
        maxMessages: 100, // Max messages per connection
        rateLimit: 14, // Max 14 messages per second (avoid rate limiting)
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
        debug: env.NODE_ENV === 'development',
        logger: env.NODE_ENV === 'development',
      });

      // Verify connection
      await this.verifyConnection();
      console.log('✅ Email service initialized with Hostinger SMTP');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.handleConnectionError();
    }
  }

  private async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      await this.transporter.verify();
      this.isConnected = true;
      this.connectionRetries = 0;
      return true;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  private async handleConnectionError(): Promise<void> {
    this.connectionRetries++;
    
    if (this.connectionRetries <= this.maxConnectionRetries) {
      const retryDelay = Math.pow(2, this.connectionRetries) * 1000; // Exponential backoff
      console.log(`⏳ Retrying email connection in ${retryDelay}ms (attempt ${this.connectionRetries}/${this.maxConnectionRetries})`);
      
      setTimeout(() => {
        this.initializeTransporter();
      }, retryDelay);
    } else {
      console.error('❌ Max email connection retries exceeded. Email service disabled.');
    }
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Add email to queue
      const queueItem: EmailQueueItem = {
        id: this.generateId(),
        options: {
          ...options,
          from: `${getEnvConfig().EMAIL_FROM_NAME} <${getEnvConfig().EMAIL_FROM}>`,
        },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        scheduledAt: new Date(),
        status: 'pending',
      };

      this.emailQueue.push(queueItem);
      console.log(`📧 Email queued: ${queueItem.id} - ${options.subject}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to queue email:', error);
      return false;
    }
  }

  private async sendQueuedEmail(queueItem: EmailQueueItem): Promise<boolean> {
    if (!this.transporter || !this.isConnected) {
      throw new Error('Email service not available');
    }

    try {
      queueItem.status = 'processing';
      queueItem.attempts++;
      queueItem.lastAttemptAt = new Date();

      const result = await this.transporter.sendMail(queueItem.options);
      
      queueItem.status = 'sent';
      console.log(`✅ Email sent successfully: ${queueItem.id} - ${result.messageId}`);
      
      return true;
    } catch (error) {
      queueItem.error = error instanceof Error ? error.message : 'Unknown error';
      
      if (queueItem.attempts >= queueItem.maxAttempts) {
        queueItem.status = 'failed';
        console.error(`❌ Email failed permanently: ${queueItem.id} - ${queueItem.error}`);
      } else {
        queueItem.status = 'pending';
        queueItem.scheduledAt = new Date(Date.now() + Math.pow(2, queueItem.attempts) * 60000); // Exponential backoff
        console.warn(`⚠️  Email failed, will retry: ${queueItem.id} - ${queueItem.error}`);
      }
      
      return false;
    }
  }

  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.isProcessingQueue || !this.transporter || !this.isConnected) {
        return;
      }

      this.isProcessingQueue = true;

      try {
        const now = new Date();
        const pendingEmails = this.emailQueue.filter(
          item => item.status === 'pending' && item.scheduledAt <= now
        );

        for (const email of pendingEmails) {
          await this.sendQueuedEmail(email);
        }

        // Clean up old completed/failed emails (keep for 24 hours)
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.emailQueue = this.emailQueue.filter(
          item => item.status === 'pending' || item.createdAt > cutoff
        );

      } catch (error) {
        console.error('❌ Email queue processing error:', error);
      } finally {
        this.isProcessingQueue = false;
      }
    }, 10000); // Process queue every 10 seconds
  }

  public getQueueStatus(): {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    isConnected: boolean;
  } {
    const pending = this.emailQueue.filter(item => item.status === 'pending').length;
    const processing = this.emailQueue.filter(item => item.status === 'processing').length;
    const sent = this.emailQueue.filter(item => item.status === 'sent').length;
    const failed = this.emailQueue.filter(item => item.status === 'failed').length;

    return {
      pending,
      processing,
      sent,
      failed,
      isConnected: this.isConnected,
    };
  }

  private generateId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Template-specific methods
  public async sendWelcomeEmailStudent(user: any): Promise<boolean> {
    const template = this.getWelcomeStudentTemplate(user);
    return await this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  public async sendWelcomeEmailEmployer(user: any): Promise<boolean> {
    const template = this.getWelcomeEmployerTemplate(user);
    return await this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  public async sendPaymentConfirmation(user: any, payment: any): Promise<boolean> {
    const template = this.getPaymentConfirmationTemplate(user, payment);
    return await this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  public async sendApplicationSubmitted(user: any, application: any, apprenticeship: any): Promise<boolean> {
    const template = this.getApplicationSubmittedTemplate(user, application, apprenticeship);
    return await this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  public async sendApplicationStatusUpdate(user: any, application: any, apprenticeship: any): Promise<boolean> {
    const template = this.getApplicationStatusTemplate(user, application, apprenticeship);
    return await this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Template generation methods (will be implemented in next step)
  private getWelcomeStudentTemplate(user: any): EmailTemplate {
    const env = getEnvConfig();
    const subject = 'Welcome to ApprenticeApex - Your apprenticeship journey starts now! ���';
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ApprenticeApex</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #00D4FF 0%, #0080FF 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to ApprenticeApex!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your apprenticeship journey starts now 🚀</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #0A0E27; margin: 0 0 20px 0; font-size: 24px;">Hi ${user.firstName || user.name || 'there'},</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Welcome to the future of apprenticeship recruitment! We're excited to have you join thousands of Gen Z apprentices who've found their dream careers through our platform.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0080FF; margin: 0 0 15px 0; font-size: 18px;">What's next?</h3>
                <ul style="color: #333; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li>Complete your profile with skills and preferences</li>
                    <li>Browse apprenticeships tailored to your interests</li>
                    <li>Apply to opportunities with one-click applications</li>
                    <li>Get matched with employers looking for talent like you</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${env.FRONTEND_URL}/profile" style="background: #0080FF; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Complete Your Profile</a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Need help getting started? Reply to this email or visit our <a href="${env.FRONTEND_URL}/contact" style="color: #0080FF;">help center</a>.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #0A0E27; padding: 30px; text-align: center;">
            <p style="color: white; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">ApprenticeApex</p>
            <p style="color: #B3B3B3; margin: 0; font-size: 14px;">The Gen Z apprenticeship platform</p>
            <div style="margin: 20px 0;">
                <a href="${env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(user.email)}" style="color: #00D4FF; font-size: 12px; text-decoration: none;">Unsubscribe</a>
            </div>
        </div>
    </div>
</body>
</html>`;

    const text = `Welcome to ApprenticeApex!

Hi ${user.firstName || user.name || 'there'},

Welcome to the future of apprenticeship recruitment! We're excited to have you join thousands of Gen Z apprentices who've found their dream careers through our platform.

What's next?
- Complete your profile with skills and preferences
- Browse apprenticeships tailored to your interests
- Apply to opportunities with one-click applications
- Get matched with employers looking for talent like you

Complete your profile: ${env.FRONTEND_URL}/profile

Need help? Visit: ${env.FRONTEND_URL}/contact

ApprenticeApex - The Gen Z apprenticeship platform`;

    return { subject, html, text };
  }

  private getWelcomeEmployerTemplate(user: any): EmailTemplate {
    const env = getEnvConfig();
    const subject = 'Welcome to ApprenticeApex - Start hiring Gen Z talent today! 💼';
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ApprenticeApex</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #00D4FF 0%, #0080FF 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to ApprenticeApex!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Start hiring Gen Z talent today ���</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #0A0E27; margin: 0 0 20px 0; font-size: 24px;">Hi ${user.companyName || user.name || 'there'},</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for joining ApprenticeApex! You're now part of a revolutionary platform that connects forward-thinking employers with the most motivated Gen Z apprentices.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0080FF; margin: 0 0 15px 0; font-size: 18px;">Your 60-day risk-free trial includes:</h3>
                <ul style="color: #333; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li>Unlimited job postings</li>
                    <li>AI-powered candidate matching</li>
                    <li>Pay only £399 per successful hire</li>
                    <li>No monthly fees during trial</li>
                    <li>Access to 25,000+ Gen Z candidates</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${env.FRONTEND_URL}/employer/dashboard" style="background: #0080FF; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Post Your First Job</a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Questions? Our team is here to help. Reply to this email or book a <a href="${env.FRONTEND_URL}/demo" style="color: #0080FF;">15-minute demo call</a>.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #0A0E27; padding: 30px; text-align: center;">
            <p style="color: white; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">ApprenticeApex</p>
            <p style="color: #B3B3B3; margin: 0; font-size: 14px;">Where Gen Z talent meets opportunity</p>
            <div style="margin: 20px 0;">
                <a href="${env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(user.email)}" style="color: #00D4FF; font-size: 12px; text-decoration: none;">Unsubscribe</a>
            </div>
        </div>
    </div>
</body>
</html>`;

    const text = `Welcome to ApprenticeApex!

Hi ${user.companyName || user.name || 'there'},

Thank you for joining ApprenticeApex! You're now part of a revolutionary platform that connects forward-thinking employers with the most motivated Gen Z apprentices.

Your 60-day risk-free trial includes:
- Unlimited job postings
- AI-powered candidate matching
- Pay only £399 per successful hire
- No monthly fees during trial
- Access to 25,000+ Gen Z candidates

Post your first job: ${env.FRONTEND_URL}/employer/dashboard

Questions? Visit: ${env.FRONTEND_URL}/demo

ApprenticeApex - Where Gen Z talent meets opportunity`;

    return { subject, html, text };
  }

  private getPaymentConfirmationTemplate(user: any, payment: any): EmailTemplate {
    const subject = `Payment Confirmation - £${payment.amount} - ApprenticeApex`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Payment Confirmed ✅</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Thank you for your payment</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #0A0E27; margin: 0 0 20px 0; font-size: 24px;">Hi ${user.firstName || user.companyName || 'there'},</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Your payment has been successfully processed. Here are the details:
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #666; font-weight: bold;">Amount:</td>
                        <td style="padding: 10px 0; color: #333;">£${payment.amount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666; font-weight: bold;">Payment Type:</td>
                        <td style="padding: 10px 0; color: #333;">${payment.type === 'trial_placement' ? 'Trial Placement Fee' : payment.type === 'subscription' ? 'Monthly Subscription' : 'Success Fee'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666; font-weight: bold;">Payment ID:</td>
                        <td style="padding: 10px 0; color: #333; font-family: monospace;">${payment.stripePaymentIntentId || payment._id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #666; font-weight: bold;">Date:</td>
                        <td style="padding: 10px 0; color: #333;">${new Date(payment.createdAt).toLocaleDateString('en-GB')}</td>
                    </tr>
                </table>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If you have any questions about this payment, please contact our support team.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #0A0E27; padding: 30px; text-align: center;">
            <p style="color: white; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">ApprenticeApex</p>
            <p style="color: #B3B3B3; margin: 0; font-size: 14px;">Payment confirmed and processed securely</p>
        </div>
    </div>
</body>
</html>`;

    const text = `Payment Confirmation - ApprenticeApex

Hi ${user.firstName || user.companyName || 'there'},

Your payment has been successfully processed.

Payment Details:
Amount: £${payment.amount}
Type: ${payment.type === 'trial_placement' ? 'Trial Placement Fee' : payment.type === 'subscription' ? 'Monthly Subscription' : 'Success Fee'}
Payment ID: ${payment.stripePaymentIntentId || payment._id}
Date: ${new Date(payment.createdAt).toLocaleDateString('en-GB')}

If you have any questions, please contact our support team.

ApprenticeApex`;

    return { subject, html, text };
  }

  private getApplicationSubmittedTemplate(user: any, application: any, apprenticeship: any): EmailTemplate {
    const subject = `Application Submitted - ${apprenticeship.title} at ${apprenticeship.companyName}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Submitted</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0080FF 0%, #00D4FF 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Application Submitted! 📝</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">We're reviewing your application</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #0A0E27; margin: 0 0 20px 0; font-size: 24px;">Hi ${user.firstName || 'there'},</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Great news! Your application has been successfully submitted for the following apprenticeship:
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0080FF; margin: 0 0 15px 0; font-size: 18px;">${apprenticeship.title}</h3>
                <p style="color: #333; margin: 0 0 10px 0;"><strong>Company:</strong> ${apprenticeship.companyName}</p>
                <p style="color: #333; margin: 0 0 10px 0;"><strong>Location:</strong> ${apprenticeship.location}</p>
                <p style="color: #333; margin: 0 0 10px 0;"><strong>Salary:</strong> £${apprenticeship.salaryMin} - £${apprenticeship.salaryMax} per year</p>
                <p style="color: #333; margin: 0;"><strong>Application Date:</strong> ${new Date(application.submittedAt).toLocaleDateString('en-GB')}</p>
            </div>
            
            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #0080FF; margin: 0 0 10px 0;">What happens next?</h4>
                <ul style="color: #333; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li>The employer will review your application</li>
                    <li>If shortlisted, you'll be invited for an interview</li>
                    <li>We'll keep you updated via email and in your dashboard</li>
                    <li>Average response time is 3-5 business days</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${getEnvConfig().FRONTEND_URL}/applications" style="background: #0080FF; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Track Your Application</a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Good luck! In the meantime, continue browsing for more opportunities that match your interests.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #0A0E27; padding: 30px; text-align: center;">
            <p style="color: white; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">ApprenticeApex</p>
            <p style="color: #B3B3B3; margin: 0; font-size: 14px;">Connecting Gen Z with their future careers</p>
        </div>
    </div>
</body>
</html>`;

    const text = `Application Submitted - ApprenticeApex

Hi ${user.firstName || 'there'},

Your application has been successfully submitted for:

${apprenticeship.title} at ${apprenticeship.companyName}
Location: ${apprenticeship.location}
Salary: £${apprenticeship.salaryMin} - £${apprenticeship.salaryMax} per year
Application Date: ${new Date(application.submittedAt).toLocaleDateString('en-GB')}

What happens next?
- The employer will review your application
- If shortlisted, you'll be invited for an interview
- We'll keep you updated via email and in your dashboard
- Average response time is 3-5 business days

Track your application: ${getEnvConfig().FRONTEND_URL}/applications

Good luck!

ApprenticeApex`;

    return { subject, html, text };
  }

  private getApplicationStatusTemplate(user: any, application: any, apprenticeship: any): EmailTemplate {
    const statusMessages = {
      'under_review': 'Your application is under review',
      'shortlisted': 'Congratulations! You\'ve been shortlisted',
      'interview_scheduled': 'Interview scheduled - prepare for success',
      'offer_made': 'Congratulations! You have an offer',
      'hired': 'Welcome to your new apprenticeship! 🎉',
      'rejected': 'Application update'
    };

    const subject = `${statusMessages[application.status as keyof typeof statusMessages]} - ${apprenticeship.title}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${application.status === 'hired' || application.status === 'offer_made' ? '#28a745' : application.status === 'rejected' ? '#dc3545' : '#0080FF'} 0%, ${application.status === 'hired' || application.status === 'offer_made' ? '#20c997' : application.status === 'rejected' ? '#fd7e14' : '#00D4FF'} 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${statusMessages[application.status as keyof typeof statusMessages]}</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">${apprenticeship.title} at ${apprenticeship.companyName}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #0A0E27; margin: 0 0 20px 0; font-size: 24px;">Hi ${user.firstName || 'there'},</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                ${this.getStatusMessage(application.status)}
            </p>
            
            ${application.status === 'interview_scheduled' && application.interviewDate ? `
            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0080FF; margin: 0 0 15px 0; font-size: 18px;">Interview Details</h3>
                <p style="color: #333; margin: 0 0 10px 0;"><strong>Date:</strong> ${new Date(application.interviewDate).toLocaleDateString('en-GB')}</p>
                <p style="color: #333; margin: 0 0 10px 0;"><strong>Time:</strong> ${new Date(application.interviewDate).toLocaleTimeString('en-GB')}</p>
                ${application.interviewLocation ? `<p style="color: #333; margin: 0;"><strong>Location:</strong> ${application.interviewLocation}</p>` : ''}
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${getEnvConfig().FRONTEND_URL}/applications/${application._id}" style="background: ${application.status === 'rejected' ? '#6c757d' : '#0080FF'}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Application Details</a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #0A0E27; padding: 30px; text-align: center;">
            <p style="color: white; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">ApprenticeApex</p>
            <p style="color: #B3B3B3; margin: 0; font-size: 14px;">Your apprenticeship journey continues</p>
        </div>
    </div>
</body>
</html>`;

    const text = `Application Update - ApprenticeApex

Hi ${user.firstName || 'there'},

${this.getStatusMessage(application.status)}

${apprenticeship.title} at ${apprenticeship.companyName}

${application.status === 'interview_scheduled' && application.interviewDate ? `
Interview Details:
Date: ${new Date(application.interviewDate).toLocaleDateString('en-GB')}
Time: ${new Date(application.interviewDate).toLocaleTimeString('en-GB')}
${application.interviewLocation ? `Location: ${application.interviewLocation}` : ''}
` : ''}

View application details: ${getEnvConfig().FRONTEND_URL}/applications/${application._id}

ApprenticeApex`;

    return { subject, html, text };
  }

  private getStatusMessage(status: string): string {
    const messages = {
      'under_review': 'Your application is currently being reviewed by the employer. We\'ll notify you as soon as there\'s an update.',
      'shortlisted': 'Excellent news! You\'ve been shortlisted for this position. The employer is impressed with your application and wants to learn more about you.',
      'interview_scheduled': 'Your interview has been scheduled! This is a great opportunity to showcase your skills and learn more about the role.',
      'offer_made': 'Congratulations! The employer has made you an offer for this apprenticeship. Please review the details carefully.',
      'hired': 'Amazing news! You\'ve been selected for this apprenticeship. Welcome to your new career journey!',
      'rejected': 'Unfortunately, you weren\'t selected for this particular role. Don\'t let this discourage you - keep applying to find the perfect match for your skills.',
    };

    return messages[status as keyof typeof messages] || 'Your application status has been updated.';
  }

  /**
   * Send video interview invitation email
   */
  public async sendInterviewInvitation(
    recipientEmail: string,
    data: InterviewInvitationData,
    isEmployer: boolean
  ): Promise<boolean> {
    try {
      const template = isEmployer
        ? emailTemplates.interviewInvitationEmployer(data)
        : emailTemplates.interviewInvitationStudent(data);

      const emailOptions: EmailOptions = {
        to: recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      return await this.sendEmail(emailOptions);
    } catch (error) {
      console.error('[EmailService] Error sending interview invitation:', error);
      return false;
    }
  }

  /**
   * Send interview cancellation email
   */
  public async sendInterviewCancellation(
    recipientEmail: string,
    data: InterviewCancellationData,
    isEmployer: boolean
  ): Promise<boolean> {
    try {
      const template = isEmployer
        ? emailTemplates.interviewCancellationEmployer(data)
        : emailTemplates.interviewCancellationStudent(data);

      const emailOptions: EmailOptions = {
        to: recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      return await this.sendEmail(emailOptions);
    } catch (error) {
      console.error('[EmailService] Error sending interview cancellation:', error);
      return false;
    }
  }

  /**
   * Send interview reminder email
   */
  public async sendInterviewReminder(
    recipientEmail: string,
    data: InterviewReminderData,
    isEmployer: boolean
  ): Promise<boolean> {
    try {
      const template = emailTemplates.interviewReminder(data, isEmployer);

      const emailOptions: EmailOptions = {
        to: recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      return await this.sendEmail(emailOptions);
    } catch (error) {
      console.error('[EmailService] Error sending interview reminder:', error);
      return false;
    }
  }

  /**
   * Send batch interview reminders (for scheduled jobs)
   */
  public async sendInterviewReminders(
    reminders: Array<{
      recipientEmail: string;
      data: InterviewReminderData;
      isEmployer: boolean;
    }>
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const reminder of reminders) {
      try {
        const success = await this.sendInterviewReminder(
          reminder.recipientEmail,
          reminder.data,
          reminder.isEmployer
        );

        if (success) {
          sent++;
        } else {
          failed++;
        }

        // Add small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('[EmailService] Error in batch reminder:', error);
        failed++;
      }
    }

    console.log(`[EmailService] Interview reminders sent: ${sent} successful, ${failed} failed`);
    return { sent, failed };
  }

  public async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      console.log('📧 Email service closed');
    }
  }
}

export default EmailService;
