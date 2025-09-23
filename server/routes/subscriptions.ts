import express from 'express';
import express, { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscriptionService';

const router = express.Router();

/**
 * Get current subscription details
 */
router.get('/current', async (req: Request, res: Response) => {
  try {
    const employerId = req.user?.userId;
    if (!employerId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const details = await SubscriptionService.getSubscriptionDetails(employerId);
    
    if (!details) {
      return res.json({
        success: true,
        subscription: null,
        hasSubscription: false
      });
    }
    
    res.json({
      success: true,
      subscription: details.subscription,
      outstandingBalance: details.outstandingBalance,
      isTrialExpired: details.isTrialExpired,
      daysLeftInTrial: details.daysLeftInTrial,
      limits: {
        canCreateJobPosting: details.canCreateJobPosting,
        canAddUser: details.canAddUser
      },
      hasSubscription: true
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subscription details' });
  }
});

/**
 * Start trial subscription
 */
router.post('/start-trial', async (req: Request, res: Response) => {
  try {
    const employerId = req.user?.userId;
    if (!employerId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const subscription = await SubscriptionService.createTrialSubscription(employerId);
    
    res.json({
      success: true,
      subscription,
      message: 'Trial subscription created successfully'
    });
  } catch (error) {
    console.error('Error starting trial:', error);
    
    if ((error as Error).message === 'Employer already has a subscription') {
      return res.status(400).json({ success: false, error: 'You already have a subscription' });
    }
    
    res.status(500).json({ success: false, error: 'Failed to start trial subscription' });
  }
});

/**
 * Upgrade to paid plan
 */
router.post('/upgrade', async (req: Request, res: Response) => {
  try {
    const employerId = req.user?.userId;
    const { planType, paymentMethodId } = req.body;
    
    if (!employerId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    if (!planType) {
      return res.status(400).json({ success: false, error: 'Plan type is required' });
    }
    
    const validPlans = ['starter', 'professional', 'business', 'enterprise'];
    if (!validPlans.includes(planType)) {
      return res.status(400).json({ success: false, error: 'Invalid plan type' });
    }
    
    const subscription = await SubscriptionService.upgradeToPaidPlan(
      employerId,
      planType,
      paymentMethodId
    );
    
    res.json({
      success: true,
      subscription,
      message: `Successfully upgraded to ${planType} plan`
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to upgrade subscription' });
  }
});

/**
 * Get available plans and pricing
 */
router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = {
      trial: {
        name: 'Trial',
        description: '60-day risk-free trial',
        monthlyFee: 0,
        successFee: 399, // Fixed fee for trial
        features: [
          'Unlimited job postings',
          'AI-powered Gen Z matching',
          'Multi-platform candidate sourcing',
          'Mobile-optimized candidate profiles',
          'Basic analytics and reporting',
          'Email and chat support',
          'Platform messaging system'
        ],
        limits: {
          jobPostings: 'Unlimited',
          users: 1,
          duration: '60 days'
        }
      },
      starter: {
        name: 'Starter',
        description: 'For Small Training Providers',
        monthlyFee: 49,
        successFeeRate: 12,
        features: [
          'Up to 5 job postings per month',
          'Basic Gen Z matching algorithm',
          'Standard candidate profiles',
          'Email support',
          'Basic analytics dashboard',
          'Social media integration (LinkedIn, Instagram)'
        ],
        limits: {
          jobPostings: 5,
          users: 1
        }
      },
      professional: {
        name: 'Professional',
        description: 'For Growing Organizations',
        monthlyFee: 99,
        successFeeRate: 12,
        popular: true,
        features: [
          'Up to 15 job postings per month',
          'Advanced AI-powered matching',
          'Premium candidate profiles with video',
          'Priority email + chat support',
          'Advanced analytics & reporting',
          'Custom branding',
          'Multi-platform social posting (TikTok, Instagram, Snapchat)',
          'Basic automation workflows',
          'Candidate pool building tools'
        ],
        limits: {
          jobPostings: 15,
          users: 3
        }
      },
      business: {
        name: 'Business',
        description: 'For High-Volume Recruitment',
        monthlyFee: 149,
        successFeeRate: 12,
        features: [
          'Up to 30 job postings per month',
          'Premium Gen Z targeting & matching',
          'White-label career pages',
          'Phone + priority support',
          'Custom reporting & insights',
          'Advanced automation workflows',
          'Full social media marketing suite',
          'API access',
          'Bulk candidate messaging',
          'Integration with major ATS systems'
        ],
        limits: {
          jobPostings: 30,
          users: 5
        }
      },
      enterprise: {
        name: 'Enterprise',
        description: 'For Large-Scale Operations',
        monthlyFee: 'Custom',
        successFeeRate: 12,
        features: [
          'Unlimited job postings',
          'Dedicated account manager',
          'Custom AI training & matching',
          '24/7 phone support',
          'Advanced security features',
          'Unlimited users',
          'Custom integrations',
          'White-glove service',
          'Training & onboarding included',
          'SLA guarantees'
        ],
        limits: {
          jobPostings: 'Unlimited',
          users: 'Unlimited'
        }
      }
    };
    
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

/**
 * Check plan limits for specific action
 */
router.get('/check-limits/:action', async (req: Request, res: Response) => {
  try {
    const employerId = req.user?.userId;
    const { action } = req.params;
    
    if (!employerId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const result = await SubscriptionService.checkPlanLimits(employerId, action);
    
    res.json({
      success: true,
      allowed: result.allowed,
      reason: result.reason
    });
  } catch (error) {
    console.error('Error checking plan limits:', error);
    res.status(500).json({ success: false, error: 'Failed to check plan limits' });
  }
});

/**
 * Process a hire (creates billing record)
 */
router.post('/process-hire', async (req: Request, res: Response) => {
  try {
    const employerId = req.user?.userId;
    const { hireId, candidateName, jobTitle, annualSalary } = req.body;
    
    if (!employerId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    if (!hireId || !candidateName || !jobTitle) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: hireId, candidateName, jobTitle' 
      });
    }
    
    await SubscriptionService.processHire(employerId, {
      hireId,
      candidateName,
      jobTitle,
      annualSalary
    });
    
    res.json({
      success: true,
      message: 'Hire processed successfully'
    });
  } catch (error) {
    console.error('Error processing hire:', error);
    res.status(500).json({ success: false, error: 'Failed to process hire' });
  }
});

/**
 * Get billing history
 */
router.get('/billing-history', async (req: Request, res: Response) => {
  try {
    const employerId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (!employerId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const billingHistory = await SubscriptionService.getBillingHistory(employerId, limit);
    
    res.json({
      success: true,
      billingHistory
    });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch billing history' });
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const employerId = req.user?.userId;
    const { reason } = req.body;
    
    if (!employerId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const subscription = await SubscriptionService.cancelSubscription(employerId, reason);
    
    res.json({
      success: true,
      subscription,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
  }
});

/**
 * Calculate pricing estimate
 */
router.post('/calculate-pricing', async (req: Request, res: Response) => {
  try {
    const { planType, estimatedHires, averageSalary } = req.body;
    
    if (!planType) {
      return res.status(400).json({ success: false, error: 'Plan type is required' });
    }
    
    const cfgMap: Record<string, { monthlyFee: number; successFeeRate: number; successFee?: number }> = {
      trial: { monthlyFee: 0, successFeeRate: 0, successFee: 399 },
      starter: { monthlyFee: 49, successFeeRate: 12 },
      professional: { monthlyFee: 99, successFeeRate: 12 },
      business: { monthlyFee: 149, successFeeRate: 12 },
      enterprise: { monthlyFee: 0, successFeeRate: 12 },
    };
    const planConfig = cfgMap[planType];
    if (!planConfig) {
      return res.status(400).json({ success: false, error: 'Invalid plan type' });
    }
    const monthlyFee = planConfig.monthlyFee;
    
    let estimatedMonthlyCost = monthlyFee;
    
    if (estimatedHires && averageSalary) {
      if (planType === 'trial') {
        // Trial: fixed £399 per hire
        estimatedMonthlyCost += estimatedHires * 399;
      } else {
        // Regular plans: percentage of salary
        const successFeePerHire = Math.min(Math.max(
          (averageSalary * planConfig.successFeeRate) / 100,
          1800 // Minimum fee
        ), 3600); // Maximum fee
        
        estimatedMonthlyCost += estimatedHires * successFeePerHire;
      }
    }
    
    res.json({
      success: true,
      estimate: {
        planType,
        monthlyFee,
        successFeeRate: planConfig.successFeeRate,
        estimatedHires: estimatedHires || 0,
        averageSalary: averageSalary || 0,
        estimatedMonthlyCost,
        breakdown: {
          baseFee: monthlyFee,
          successFees: estimatedMonthlyCost - monthlyFee
        }
      }
    });
  } catch (error) {
    console.error('Error calculating pricing:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate pricing' });
  }
});

export default router;
