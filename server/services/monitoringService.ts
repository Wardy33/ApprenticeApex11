import { EmployerAccess } from '../models/EmployerAccess';
import { User } from '../models/User';

export interface SuspiciousActivityFlag {
  employerId: string;
  studentId: string;
  activityType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: any;
  timestamp: Date;
  status: 'flagged' | 'reviewed' | 'resolved' | 'escalated';
}

export interface ActivityPattern {
  employerId: string;
  patternType: string;
  frequency: number;
  timeWindow: string;
  riskScore: number;
  details: any;
}

export class MonitoringService {
  
  /**
   * Track user activity and detect suspicious patterns
   */
  static async trackActivity(
    employerId: string,
    studentId: string,
    activityType: string,
    metadata: any
  ): Promise<void> {
    // Record the activity
    await EmployerAccess.recordActivity(employerId, studentId, activityType, {
      ...metadata,
      timestamp: new Date(),
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      sessionId: metadata.sessionId
    });

    // Analyze for suspicious patterns
    await this.analyzeActivityPatterns(employerId, studentId, activityType, metadata);
  }

  /**
   * Analyze activity patterns for suspicious behavior
   */
  static async analyzeActivityPatterns(
    employerId: string,
    studentId: string,
    activityType: string,
    metadata: any
  ): Promise<void> {
    const recentActivity = await this.getRecentActivity(employerId, studentId, '24h');
    
    // Pattern 1: Rapid profile access without engagement
    if (activityType === 'PROFILE_VIEWED') {
      const profileViews = recentActivity.filter(a => a.action === 'PROFILE_VIEWED').length;
      const messagesSent = recentActivity.filter(a => a.action === 'MESSAGE_SENT').length;
      
      if (profileViews > 10 && messagesSent === 0) {
        await this.flagSuspiciousActivity(
          employerId,
          studentId,
          'EXCESSIVE_PROFILE_VIEWING',
          'high',
          'Multiple profile views without any engagement',
          { profileViews, messagesSent, timeWindow: '24h' }
        );
      }
    }

    // Pattern 2: Sudden inactivity after accessing contact details
    if (activityType === 'CONTACT_ACCESS') {
      const lastActivity = recentActivity[0];
      const timeSinceAccess = Date.now() - lastActivity.grantedAt.getTime();
      
      // Flag if no activity for 2 hours after getting contact details
      if (timeSinceAccess > 2 * 60 * 60 * 1000) {
        await this.flagSuspiciousActivity(
          employerId,
          studentId,
          'SUDDEN_INACTIVITY_AFTER_CONTACT_ACCESS',
          'medium',
          'No platform activity after accessing contact information',
          { timeSinceAccess, lastActivity: lastActivity.action }
        );
      }
    }

    // Pattern 3: Abnormal access patterns
    await this.detectAbnormalAccessPatterns(employerId, recentActivity);
  }

  /**
   * Monitor message content for policy violations
   */
  static async monitorMessage(
    senderId: string,
    receiverId: string,
    content: string,
    metadata: any
  ): Promise<{ allowed: boolean; flags: string[]; modifiedContent?: string }> {
    const flags: string[] = [];
    let modifiedContent = content;

    // Check for contact information sharing attempts
    const contactPatterns = [
      /\b[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      /\b(?:\+44|0)[\d\s]{10,}\b/g, // UK Phone numbers
      /\b(?:linkedin|whatsapp|telegram|discord)\.?\w*/gi, // External platforms
      /\bmeet\s+me\s+(?:at|outside|off)\b/gi, // Meetup suggestions
      /\b(?:call|text|email)\s+me\s+(?:at|on)\b/gi, // Direct contact requests
    ];

    contactPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        flags.push([
          'EMAIL_SHARING_ATTEMPT',
          'PHONE_SHARING_ATTEMPT', 
          'EXTERNAL_PLATFORM_REFERENCE',
          'EXTERNAL_MEETUP_SUGGESTION',
          'DIRECT_CONTACT_REQUEST'
        ][index]);
        
        // Redact the content
        modifiedContent = modifiedContent.replace(pattern, '[REDACTED]');
      }
    });

    // Check for hiring attempts outside platform
    const hiringPatterns = [
      /\b(?:hire|employ|job offer|position|role)\s+(?:you|direct)/gi,
      /\b(?:skip|bypass|avoid)\s+(?:the\s+)?platform/gi,
      /\b(?:cheaper|free|no fee)\s+(?:way|method)/gi,
    ];

    hiringPatterns.forEach((pattern) => {
      if (pattern.test(content)) {
        flags.push('PLATFORM_BYPASS_ATTEMPT');
      }
    });

    // Track flagged messages
    if (flags.length > 0) {
      await this.flagSuspiciousActivity(
        senderId,
        receiverId,
        'MESSAGE_POLICY_VIOLATION',
        flags.includes('PLATFORM_BYPASS_ATTEMPT') ? 'critical' : 'medium',
        'Message contains policy violations',
        { originalContent: content, flags, messageMetadata: metadata }
      );
    }

    return {
      allowed: !flags.includes('PLATFORM_BYPASS_ATTEMPT'),
      flags,
      modifiedContent: flags.length > 0 ? modifiedContent : undefined
    };
  }

  /**
   * Flag suspicious activity
   */
  static async flagSuspiciousActivity(
    employerId: string,
    studentId: string,
    activityType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    evidence: any
  ): Promise<void> {
    // Record in database
    await EmployerAccess.flagSuspiciousActivity(employerId, studentId, description);

    // Create detailed flag record
    const flag: SuspiciousActivityFlag = {
      employerId,
      studentId,
      activityType,
      severity,
      description,
      evidence,
      timestamp: new Date(),
      status: 'flagged'
    };

    // Store flag (in production, this would go to a monitoring database)
    console.log('🚨 SUSPICIOUS ACTIVITY FLAGGED:', flag);

    // Send alerts based on severity
    if (severity === 'critical') {
      await this.sendImmediateAlert(flag);
      await this.applyAutomaticRestrictions(employerId, studentId);
    } else if (severity === 'high') {
      await this.scheduleReview(flag);
    }

    // Update employer access restrictions
    await this.updateAccessRestrictions(employerId, studentId, severity);
  }

  /**
   * Detect abnormal access patterns
   */
  static async detectAbnormalAccessPatterns(
    employerId: string,
    recentActivity: any[]
  ): Promise<void> {
    // Pattern: Accessing many candidates quickly
    const uniqueStudents = new Set(recentActivity.map(a => a.metadata?.studentId)).size;
    const timeWindow = 60 * 60 * 1000; // 1 hour
    const recentWindow = recentActivity.filter(
      a => Date.now() - a.grantedAt.getTime() < timeWindow
    );

    if (uniqueStudents > 20 && recentWindow.length > 50) {
      await this.flagSuspiciousActivity(
        employerId,
        'multiple',
        'MASS_CANDIDATE_ACCESS',
        'high',
        'Accessing unusually high number of candidates in short time',
        { uniqueStudents, activityCount: recentWindow.length, timeWindow: '1h' }
      );
    }

    // Pattern: Off-hours activity
    const currentHour = new Date().getHours();
    const offHoursActivity = recentActivity.filter(a => {
      const hour = a.grantedAt.getHours();
      return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
    });

    if (offHoursActivity.length > 10) {
      await this.flagSuspiciousActivity(
        employerId,
        'multiple',
        'OFF_HOURS_ACTIVITY',
        'medium',
        'Unusual activity during off-hours',
        { offHoursCount: offHoursActivity.length }
      );
    }
  }

  /**
   * Monitor candidate reports
   */
  static async processCandidateReport(
    studentId: string,
    employerId: string,
    reportType: string,
    description: string,
    evidence?: any
  ): Promise<void> {
    await this.flagSuspiciousActivity(
      employerId,
      studentId,
      `CANDIDATE_REPORT_${reportType}`,
      'high',
      `Candidate reported: ${description}`,
      { reportType, candidateEvidence: evidence }
    );

    // Immediately restrict access while investigating
    await this.applyTemporaryRestrictions(employerId, studentId);
  }

  /**
   * Browser fingerprinting detection
   */
  static async detectFingerprinting(
    employerId: string,
    fingerprint: any
  ): Promise<boolean> {
    // Check for multiple accounts from same fingerprint
    const recentFingerprints = await this.getRecentFingerprints(fingerprint.hash);
    
    if (recentFingerprints.length > 3) {
      await this.flagSuspiciousActivity(
        employerId,
        'multiple',
        'MULTIPLE_ACCOUNTS_SAME_DEVICE',
        'high',
        'Multiple employer accounts detected from same device',
        { fingerprint, accountCount: recentFingerprints.length }
      );
      return true;
    }

    return false;
  }

  /**
   * Social media monitoring (placeholder)
   */
  static async monitorSocialMedia(
    employerId: string,
    companyName: string
  ): Promise<void> {
    // In production, this would integrate with social media APIs
    // to monitor for hiring announcements that bypass the platform
    
    // Placeholder for social media monitoring
    console.log(`📱 Social media monitoring active for ${companyName}`);
  }

  // Helper methods
  private static async getRecentActivity(
    employerId: string,
    studentId?: string,
    timeWindow: string = '24h'
  ): Promise<any[]> {
    const hours = timeWindow === '24h' ? 24 : 1;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const query: any = {
      employerId,
      'accessHistory.grantedAt': { $gte: since }
    };

    if (studentId) {
      query.studentId = studentId;
    }

    const records = await EmployerAccess.find(query);
    return records.flatMap(record => 
      record.accessHistory.filter(h => h.grantedAt >= since)
    );
  }

  private static async sendImmediateAlert(flag: SuspiciousActivityFlag): Promise<void> {
    // In production: send email/SMS to admin team
    console.log('🚨 IMMEDIATE ALERT:', flag);
  }

  private static async scheduleReview(flag: SuspiciousActivityFlag): Promise<void> {
    // In production: add to admin review queue
    console.log('📋 SCHEDULED FOR REVIEW:', flag);
  }

  private static async applyAutomaticRestrictions(
    employerId: string,
    studentId: string
  ): Promise<void> {
    await EmployerAccess.findOneAndUpdate(
      { employerId, studentId },
      {
        $set: {
          'restrictions.contactBlocked': true,
          'restrictions.downloadBlocked': true,
          'restrictions.externalSharingBlocked': true,
          'monitoringFlags.suspiciousActivity': true
        }
      }
    );
  }

  private static async applyTemporaryRestrictions(
    employerId: string,
    studentId: string
  ): Promise<void> {
    await EmployerAccess.findOneAndUpdate(
      { employerId, studentId },
      {
        $set: {
          'restrictions.contactBlocked': true,
          'monitoringFlags.suspiciousActivity': true
        }
      }
    );
  }

  private static async updateAccessRestrictions(
    employerId: string,
    studentId: string,
    severity: string
  ): Promise<void> {
    const restrictions: any = {};

    if (severity === 'critical') {
      restrictions['restrictions.contactBlocked'] = true;
      restrictions['restrictions.downloadBlocked'] = true;
    } else if (severity === 'high') {
      restrictions['restrictions.downloadBlocked'] = true;
    }

    if (Object.keys(restrictions).length > 0) {
      await EmployerAccess.findOneAndUpdate(
        { employerId, studentId },
        { $set: restrictions }
      );
    }
  }

  private static async getRecentFingerprints(hash: string): Promise<any[]> {
    // In production: query fingerprint database
    return [];
  }

  /**
   * Generate monitoring report for admin dashboard
   */
  static async generateMonitoringReport(timeWindow: string = '24h'): Promise<any> {
    const recentFlags = await this.getRecentFlags(timeWindow);
    
    return {
      summary: {
        totalFlags: recentFlags.length,
        criticalFlags: recentFlags.filter(f => f.severity === 'critical').length,
        highFlags: recentFlags.filter(f => f.severity === 'high').length,
        resolvedFlags: recentFlags.filter(f => f.status === 'resolved').length
      },
      patterns: {
        mostCommonViolations: this.getMostCommonViolations(recentFlags),
        suspiciousEmployers: this.getSuspiciousEmployers(recentFlags),
        timeDistribution: this.getTimeDistribution(recentFlags)
      },
      flags: recentFlags
    };
  }

  private static async getRecentFlags(timeWindow: string): Promise<SuspiciousActivityFlag[]> {
    // In production: query monitoring database
    return [];
  }

  private static getMostCommonViolations(flags: SuspiciousActivityFlag[]): any {
    const violations = flags.reduce((acc, flag) => {
      acc[flag.activityType] = (acc[flag.activityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(violations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }

  private static getSuspiciousEmployers(flags: SuspiciousActivityFlag[]): any {
    const employers = flags.reduce((acc, flag) => {
      acc[flag.employerId] = (acc[flag.employerId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(employers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }

  private static getTimeDistribution(flags: SuspiciousActivityFlag[]): any {
    return flags.reduce((acc, flag) => {
      const hour = flag.timestamp.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }
}
