import { Subscription } from '../models/Subscription';
import { Billing } from '../models/Billing';
import { User } from '../models/User';

export class SubscriptionService {
  
  /**
   * Create a new trial subscription for an employer
   */
  static async createTrialSubscription(employerId: string) {
    try {
      // Check if employer already has a subscription
      const existingSubscription = await Subscription.findOne({ employerId });
      if (existingSubscription) {
        throw new Error('Employer already has a subscription');
      }
      
      const subscription = await Subscription.createTrialSubscription(employerId);
      
      console.log(`✅ Created trial subscription for employer: ${employerId}`);
      return subscription;
    } catch (error) {
      console.error('Error creating trial subscription:', error);
      throw error;
    }
  }
  
  /**
   * Upgrade subscription to a paid plan
   */
  static async upgradeToPaidPlan(
    employerId: string, 
    planType: string,
    paymentMethodId?: string
  ) {
    try {
      const subscription = await Subscription.findOne({ employerId });
      if (!subscription) {
        throw new Error('No subscription found for employer');
      }
      
      // Upgrade the plan
      await subscription.upgradePlan(planType);
      
      // Create first monthly billing record if not trial
      if (planType !== 'trial' && subscription.monthlyFee > 0) {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        
        await Billing.createMonthlyFee(
          subscription._id,
          employerId,
          subscription.monthlyFee,
          {
            start: now,
            end: nextMonth
          }
        );
      }
      
      console.log(`✅ Upgraded subscription for employer ${employerId} to ${planType}`);
      return subscription;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  }
  
  /**
   * Process a successful hire and create billing
   */
  static async processHire(
    employerId: string,
    hireDetails: {
      hireId: string;
      candidateName: string;
      jobTitle: string;
      annualSalary?: number;
    }
  ) {
    try {
      const subscription = await Subscription.findOne({ employerId });
      if (!subscription) {
        throw new Error('No subscription found for employer');
      }
      
      // Record the hire in usage stats
      await subscription.recordHire();
      
      // Create appropriate billing record
      if (subscription.isInTrial) {
        // Trial hire - fixed £399 fee
        await Billing.createTrialHireFee(
          subscription._id,
          employerId,
          {
            hireId: hireDetails.hireId,
            candidateName: hireDetails.candidateName,
            jobTitle: hireDetails.jobTitle
          }
        );
      } else {
        // Regular hire - percentage based
        if (!hireDetails.annualSalary) {
          throw new Error('Annual salary required for non-trial hires');
        }
        
        await Billing.createSuccessFee(
          subscription._id,
          employerId,
          {
            hireId: hireDetails.hireId,
            candidateName: hireDetails.candidateName,
            jobTitle: hireDetails.jobTitle,
            annualSalary: hireDetails.annualSalary,
            feePercentage: subscription.successFeeRate
          }
        );
      }
      
      console.log(`✅ Processed hire for employer ${employerId}: ${hireDetails.candidateName}`);
      return true;
    } catch (error) {
      console.error('Error processing hire:', error);
      throw error;
    }
  }
  
  /**
   * Check if employer can perform specific actions based on their plan
   */
  static async checkPlanLimits(employerId: string, action: string) {
    try {
      const subscription = await Subscription.findOne({ employerId });
      if (!subscription) {
        return { allowed: false, reason: 'No subscription found' };
      }
      
      // Check if trial is expired
      if (subscription.isTrialExpired()) {
        return { 
          allowed: false, 
          reason: 'Trial period has expired. Please upgrade to a paid plan.' 
        };
      }
      
      switch (action) {
        case 'create_job_posting':
          if (!subscription.canCreateJobPosting()) {
            return {
              allowed: false,
              reason: `Job posting limit reached (${subscription.jobPostingLimit} per month). Please upgrade your plan.`
            };
          }
          break;
          
        case 'add_user':
          if (!subscription.canAddUser()) {
            return {
              allowed: false,
              reason: `User limit reached (${subscription.userLimit} users). Please upgrade your plan.`
            };
          }
          break;
          
        case 'access_analytics':
          if (subscription.features.analytics === 'basic' && action.includes('advanced')) {
            return {
              allowed: false,
              reason: 'Advanced analytics requires Professional plan or higher.'
            };
          }
          break;
          
        case 'api_access':
          if (!subscription.features.apiAccess) {
            return {
              allowed: false,
              reason: 'API access requires Business plan or higher.'
            };
          }
          break;
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('Error checking plan limits:', error);
      return { allowed: false, reason: 'Error checking subscription' };
    }
  }
  
  /**
   * Get subscription details for an employer
   */
  static async getSubscriptionDetails(employerId: string) {
    try {
      const subscription = await Subscription.findOne({ employerId });
      if (!subscription) {
        return null;
      }
      
      const outstandingBalance = await Billing.getOutstandingBalance(employerId);
      
      return {
        subscription,
        outstandingBalance,
        isTrialExpired: subscription.isTrialExpired(),
        daysLeftInTrial: subscription.daysLeftInTrial(),
        canCreateJobPosting: subscription.canCreateJobPosting(),
        canAddUser: subscription.canAddUser()
      };
    } catch (error) {
      console.error('Error getting subscription details:', error);
      throw error;
    }
  }
  
  /**
   * Get billing history for an employer
   */
  static async getBillingHistory(employerId: string, limit: number = 50) {
    try {
      const bills = await Billing.find({ employerId })
        .sort({ createdAt: -1 })
        .limit(limit);
      
      return bills;
    } catch (error) {
      console.error('Error getting billing history:', error);
      throw error;
    }
  }
  
  /**
   * Cancel subscription
   */
  static async cancelSubscription(employerId: string, reason?: string) {
    try {
      const subscription = await Subscription.findOne({ employerId });
      if (!subscription) {
        throw new Error('No subscription found for employer');
      }
      
      subscription.status = 'cancelled';
      await subscription.save();
      
      console.log(`✅ Cancelled subscription for employer: ${employerId}. Reason: ${reason || 'Not specified'}`);
      return subscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
  
  /**
   * Process monthly billing for all active subscriptions
   */
  static async processMonthlyBilling() {
    try {
      const now = new Date();
      const subscriptionsToCharge = await Subscription.find({
        status: 'active',
        isInTrial: false,
        nextBillingDate: { $lte: now },
        monthlyFee: { $gt: 0 }
      });
      
      for (const subscription of subscriptionsToCharge) {
        try {
          const billingPeriodStart = subscription.nextBillingDate;
          const billingPeriodEnd = new Date(billingPeriodStart);
          billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1);
          
          await Billing.createMonthlyFee(
            subscription._id,
            subscription.employerId,
            subscription.monthlyFee,
            {
              start: billingPeriodStart,
              end: billingPeriodEnd
            }
          );
          
          // Update next billing date
          subscription.currentPeriodStart = billingPeriodStart;
          subscription.currentPeriodEnd = billingPeriodEnd;
          subscription.nextBillingDate = billingPeriodEnd;
          await subscription.save();
          
          console.log(`✅ Created monthly bill for employer: ${subscription.employerId}`);
        } catch (error) {
          console.error(`❌ Error creating monthly bill for employer ${subscription.employerId}:`, error);
        }
      }
      
      console.log(`✅ Processed monthly billing for ${subscriptionsToCharge.length} subscriptions`);
    } catch (error) {
      console.error('Error processing monthly billing:', error);
      throw error;
    }
  }
  
  /**
   * Mark overdue invoices
   */
  static async markOverdueInvoices() {
    try {
      const now = new Date();
      const overdueInvoices = await Billing.find({
        status: 'pending',
        dueDate: { $lt: now }
      });
      
      for (const invoice of overdueInvoices) {
        await invoice.markAsOverdue();
      }
      
      console.log(`✅ Marked ${overdueInvoices.length} invoices as overdue`);
    } catch (error) {
      console.error('Error marking overdue invoices:', error);
      throw error;
    }
  }
  
  /**
   * Get platform revenue metrics
   */
  static async getRevenueMetrics(startDate: Date, endDate: Date) {
    try {
      const revenueByType = await Billing.aggregate([
        {
          $match: {
            status: 'paid',
            paidDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$invoiceType',
            totalRevenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);
      
      const totalRevenue = revenueByType.reduce((sum, item) => sum + item.totalRevenue, 0);
      
      return {
        totalRevenue,
        revenueByType,
        period: { startDate, endDate }
      };
    } catch (error) {
      console.error('Error getting revenue metrics:', error);
      throw error;
    }
  }
}
