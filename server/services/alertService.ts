import { MonitoringService } from './monitoringService';
import { EmployerAccess } from '../models/EmployerAccess';
import { SuccessFee } from '../models/SuccessFee';
import { User } from '../models/User';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  trigger: 'immediate' | 'hourly' | 'daily' | 'weekly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: (data: any) => boolean;
  action: (data: any) => Promise<void>;
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  employerId?: string;
  studentId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: any;
  status: 'pending' | 'acknowledged' | 'resolved' | 'escalated';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  escalatedAt?: Date;
}

export class AlertService {
  private static alerts: Alert[] = [];
  private static alertRules: AlertRule[] = [];
  private static isMonitoringActive = false;

  /**
   * Initialize the alert system with predefined rules
   */
  static initialize(): void {
    this.setupDefaultAlertRules();
    this.startMonitoring();
  }

  /**
   * Setup default alert rules for anti-poaching detection
   */
  private static setupDefaultAlertRules(): void {
    this.alertRules = [
      // Critical: Platform bypass attempts
      {
        id: 'bypass-attempt-critical',
        name: 'Platform Bypass Attempt',
        description: 'Detected attempt to hire candidate outside platform',
        trigger: 'immediate',
        severity: 'critical',
        enabled: true,
        condition: (data) => data.activityType === 'PLATFORM_BYPASS_ATTEMPT',
        action: async (data) => {
          await this.sendImmediateAlert(data);
          await this.blockEmployerAccess(data.employerId);
          await this.notifyLegalTeam(data);
        }
      },

      // High: Excessive profile viewing without engagement
      {
        id: 'excessive-viewing-high',
        name: 'Excessive Profile Viewing',
        description: 'Employer viewing many profiles without engagement',
        trigger: 'immediate',
        severity: 'high',
        enabled: true,
        condition: (data) => data.activityType === 'EXCESSIVE_PROFILE_VIEWING',
        action: async (data) => {
          await this.sendHighPriorityAlert(data);
          await this.applyViewingRestrictions(data.employerId);
        }
      },

      // High: Contact information accessed without follow-up
      {
        id: 'contact-access-no-followup',
        name: 'Contact Access Without Follow-up',
        description: 'Contact details accessed but no platform engagement',
        trigger: 'immediate',
        severity: 'high',
        enabled: true,
        condition: (data) => data.activityType === 'SUDDEN_INACTIVITY_AFTER_CONTACT_ACCESS',
        action: async (data) => {
          await this.sendHighPriorityAlert(data);
          await this.createSuccessFeePrebill(data.employerId, data.studentId);
        }
      },

      // Medium: Message policy violations
      {
        id: 'message-policy-violation',
        name: 'Message Policy Violation',
        description: 'Message contains contact sharing or bypass attempts',
        trigger: 'immediate',
        severity: 'medium',
        enabled: true,
        condition: (data) => data.activityType === 'MESSAGE_POLICY_VIOLATION',
        action: async (data) => {
          await this.sendMediumPriorityAlert(data);
          await this.flagMessageForReview(data);
        }
      },

      // Daily: Overdue payments
      {
        id: 'overdue-payments-daily',
        name: 'Overdue Success Fees',
        description: 'Success fees are overdue for payment',
        trigger: 'daily',
        severity: 'high',
        enabled: true,
        condition: async () => {
          const overdueFees = await SuccessFee.getOverdueFees();
          return overdueFees.length > 0;
        },
        action: async () => {
          await this.processOverduePayments();
        }
      },

      // Weekly: Employer compliance review
      {
        id: 'employer-compliance-weekly',
        name: 'Employer Compliance Review',
        description: 'Weekly review of employer compliance metrics',
        trigger: 'weekly',
        severity: 'medium',
        enabled: true,
        condition: () => true, // Always run weekly
        action: async () => {
          await this.generateComplianceReport();
        }
      },

      // Hourly: Activity pattern analysis
      {
        id: 'activity-pattern-hourly',
        name: 'Activity Pattern Analysis',
        description: 'Analyze employer activity patterns for suspicious behavior',
        trigger: 'hourly',
        severity: 'medium',
        enabled: true,
        condition: () => true, // Always run hourly
        action: async () => {
          await this.analyzeActivityPatterns();
        }
      }
    ];
  }

  /**
   * Start the monitoring system
   */
  private static startMonitoring(): void {
    if (this.isMonitoringActive) return;
    
    this.isMonitoringActive = true;
    console.log('🔍 Alert monitoring system started');

    // Set up intervals for different trigger types
    setInterval(() => this.processScheduledAlerts('hourly'), 60 * 60 * 1000); // 1 hour
    setInterval(() => this.processScheduledAlerts('daily'), 24 * 60 * 60 * 1000); // 24 hours
    setInterval(() => this.processScheduledAlerts('weekly'), 7 * 24 * 60 * 60 * 1000); // 7 days

    // Process overdue alerts every 5 minutes
    setInterval(() => this.processOverdueAlerts(), 5 * 60 * 1000);
  }

  /**
   * Stop the monitoring system
   */
  static stopMonitoring(): void {
    this.isMonitoringActive = false;
    console.log('🛑 Alert monitoring system stopped');
  }

  /**
   * Process immediate alerts based on activity
   */
  static async processImmediateAlert(activityData: any): Promise<void> {
    const immediateRules = this.alertRules.filter(
      rule => rule.trigger === 'immediate' && rule.enabled
    );

    for (const rule of immediateRules) {
      let shouldTrigger = false;
      
      if (typeof rule.condition === 'function') {
        try {
          shouldTrigger = await rule.condition(activityData);
        } catch (error) {
          console.error(`Error evaluating rule ${rule.id}:`, error);
          continue;
        }
      }

      if (shouldTrigger) {
        const alert = await this.createAlert(rule, activityData);
        await rule.action(activityData);
        console.log(`🚨 Immediate alert triggered: ${rule.name}`);
      }
    }
  }

  /**
   * Process scheduled alerts (hourly, daily, weekly)
   */
  private static async processScheduledAlerts(trigger: string): Promise<void> {
    const scheduledRules = this.alertRules.filter(
      rule => rule.trigger === trigger && rule.enabled
    );

    for (const rule of scheduledRules) {
      try {
        const shouldTrigger = await rule.condition({});
        if (shouldTrigger) {
          const alert = await this.createAlert(rule, {});
          await rule.action({});
          console.log(`⏰ Scheduled alert triggered: ${rule.name}`);
        }
      } catch (error) {
        console.error(`Error processing scheduled rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Create an alert record
   */
  private static async createAlert(rule: AlertRule, data: any): Promise<Alert> {
    const alert: Alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      employerId: data.employerId,
      studentId: data.studentId,
      severity: rule.severity,
      title: rule.name,
      message: rule.description,
      data,
      status: 'pending',
      createdAt: new Date()
    };

    this.alerts.push(alert);
    
    // In production, this would be stored in database
    console.log(`📋 Alert created: ${alert.title} (${alert.severity})`);
    
    return alert;
  }

  /**
   * Alert action handlers
   */
  private static async sendImmediateAlert(data: any): Promise<void> {
    // In production: send to Slack, email, SMS, etc.
    console.log('🚨 IMMEDIATE ALERT - Platform Bypass Detected:', {
      employerId: data.employerId,
      studentId: data.studentId,
      evidence: data.evidence,
      timestamp: new Date()
    });
  }

  private static async sendHighPriorityAlert(data: any): Promise<void> {
    // In production: send to admin team
    console.log('⚠��� HIGH PRIORITY ALERT:', {
      type: data.activityType,
      employerId: data.employerId,
      details: data.evidence,
      timestamp: new Date()
    });
  }

  private static async sendMediumPriorityAlert(data: any): Promise<void> {
    // In production: add to review queue
    console.log('📋 MEDIUM PRIORITY ALERT:', {
      type: data.activityType,
      employerId: data.employerId,
      details: data.evidence,
      timestamp: new Date()
    });
  }

  private static async blockEmployerAccess(employerId: string): Promise<void> {
    await EmployerAccess.updateMany(
      { employerId },
      {
        $set: {
          'restrictions.contactBlocked': true,
          'restrictions.downloadBlocked': true,
          'restrictions.externalSharingBlocked': true,
          'monitoringFlags.suspiciousActivity': true,
          'monitoringFlags.blocked': true
        }
      }
    );
    console.log(`🚫 Blocked all access for employer: ${employerId}`);
  }

  private static async applyViewingRestrictions(employerId: string): Promise<void> {
    await EmployerAccess.updateMany(
      { employerId },
      {
        $set: {
          'restrictions.downloadBlocked': true,
          'restrictions.profileViewLimit': 5,
          'monitoringFlags.suspiciousActivity': true
        }
      }
    );
    console.log(`⚠️ Applied viewing restrictions for employer: ${employerId}`);
  }

  private static async createSuccessFeePrebill(employerId: string, studentId: string): Promise<void> {
    try {
      // Check if hire evidence exists
      const accessRecord = await EmployerAccess.findOne({ employerId, studentId });
      if (!accessRecord) return;

      // Create a success fee record as a placeholder
      await SuccessFee.createBypassPenalty(employerId, studentId, {
        type: 'contact_access_without_engagement',
        firstContactDate: accessRecord.firstContactDate,
        evidence: false
      });

      console.log(`💰 Created success fee prebill for ${employerId} -> ${studentId}`);
    } catch (error) {
      console.error('Error creating success fee prebill:', error);
    }
  }

  private static async flagMessageForReview(data: any): Promise<void> {
    // In production: add to message review queue
    console.log('📨 Message flagged for review:', {
      employerId: data.employerId,
      studentId: data.studentId,
      flags: data.evidence.flags,
      timestamp: new Date()
    });
  }

  private static async notifyLegalTeam(data: any): Promise<void> {
    // In production: send to legal team
    console.log('⚖️ Legal team notified of platform bypass:', {
      employerId: data.employerId,
      studentId: data.studentId,
      evidence: data.evidence,
      timestamp: new Date()
    });
  }

  private static async processOverduePayments(): Promise<void> {
    try {
      const overdueFees = await SuccessFee.getOverdueFees();
      
      for (const fee of overdueFees) {
        // Mark as overdue
        await fee.markAsOverdue();
        
        // Send legal notice
        const daysPastDue = Math.floor((Date.now() - fee.dueDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysPastDue === 7) {
          await fee.sendLegalNotice('reminder');
        } else if (daysPastDue === 14) {
          await fee.sendLegalNotice('demand');
        } else if (daysPastDue === 30) {
          await fee.sendLegalNotice('legal_action');
        }
      }

      console.log(`💸 Processed ${overdueFees.length} overdue payments`);
    } catch (error) {
      console.error('Error processing overdue payments:', error);
    }
  }

  private static async generateComplianceReport(): Promise<void> {
    try {
      const report = await MonitoringService.generateMonitoringReport('7d');
      
      // In production: email to admin team
      console.log('📊 Weekly compliance report generated:', {
        totalFlags: report.summary.totalFlags,
        criticalFlags: report.summary.criticalFlags,
        topViolations: report.patterns.mostCommonViolations,
        suspiciousEmployers: report.patterns.suspiciousEmployers
      });
    } catch (error) {
      console.error('Error generating compliance report:', error);
    }
  }

  private static async analyzeActivityPatterns(): Promise<void> {
    try {
      // Get all active employers
      const activeEmployers = await EmployerAccess.distinct('employerId');
      
      for (const employerId of activeEmployers) {
        // Analyze patterns for each employer
        const recentActivity = await this.getEmployerActivity(employerId, '1h');
        
        if (recentActivity.length > 0) {
          await MonitoringService.analyzeActivityPatterns(
            employerId,
            recentActivity[0].studentId,
            'HOURLY_ANALYSIS',
            { activityCount: recentActivity.length }
          );
        }
      }
      
      console.log(`🔍 Analyzed activity patterns for ${activeEmployers.length} employers`);
    } catch (error) {
      console.error('Error analyzing activity patterns:', error);
    }
  }

  private static async processOverdueAlerts(): Promise<void> {
    const overdueAlerts = this.alerts.filter(
      alert => alert.status === 'pending' && 
      Date.now() - alert.createdAt.getTime() > 60 * 60 * 1000 // 1 hour old
    );

    for (const alert of overdueAlerts) {
      if (alert.severity === 'critical') {
        alert.status = 'escalated';
        alert.escalatedAt = new Date();
        console.log(`🚨 ESCALATED: ${alert.title} - ${alert.id}`);
      }
    }
  }

  /**
   * Manual alert management
   */
  static async acknowledgeAlert(alertId: string, adminId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && alert.status === 'pending') {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
      console.log(`✅ Alert acknowledged: ${alertId} by ${adminId}`);
    }
  }

  static async resolveAlert(alertId: string, adminId: string, resolution: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && ['pending', 'acknowledged'].includes(alert.status)) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      console.log(`✅ Alert resolved: ${alertId} by ${adminId} - ${resolution}`);
    }
  }

  static getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => ['pending', 'acknowledged'].includes(a.status));
  }

  static getAlertsByEmployer(employerId: string): Alert[] {
    return this.alerts.filter(a => a.employerId === employerId);
  }

  /**
   * Helper methods
   */
  private static generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static async getEmployerActivity(employerId: string, timeWindow: string): Promise<any[]> {
    const hours = timeWindow === '1h' ? 1 : 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const records = await EmployerAccess.find({
      employerId,
      'accessHistory.grantedAt': { $gte: since }
    });

    return records.flatMap(record => 
      record.accessHistory.filter(h => h.grantedAt >= since)
    );
  }

  /**
   * Integration with monitoring service
   */
  static async integrateWithMonitoring(): Promise<void> {
    // Override the flagSuspiciousActivity method to trigger alerts
    const originalFlag = MonitoringService.flagSuspiciousActivity;
    
    MonitoringService.flagSuspiciousActivity = async function(
      employerId: string,
      studentId: string,
      activityType: string,
      severity: 'low' | 'medium' | 'high' | 'critical',
      description: string,
      evidence: any
    ) {
      // Call original function
      await originalFlag.call(this, employerId, studentId, activityType, severity, description, evidence);
      
      // Trigger alert system
      await AlertService.processImmediateAlert({
        employerId,
        studentId,
        activityType,
        severity,
        description,
        evidence
      });
    };
  }
}
