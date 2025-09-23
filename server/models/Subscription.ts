import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  employerId: string;
  planType: 'trial' | 'starter' | 'professional' | 'business' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'paused';
  
  // Trial specifics
  trialStartDate?: Date;
  trialEndDate?: Date;
  isInTrial: boolean;
  
  // Plan details
  monthlyFee: number; // Base monthly fee
  successFeeRate: number; // Percentage of first year salary
  jobPostingLimit: number; // -1 for unlimited
  userLimit: number; // -1 for unlimited
  
  // Billing
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  
  // Features
  features: {
    aiMatching: 'basic' | 'advanced' | 'premium';
    candidateProfiles: 'standard' | 'premium' | 'video';
    support: 'email' | 'email_chat' | 'phone' | 'dedicated';
    analytics: 'basic' | 'advanced' | 'custom';
    branding: boolean;
    automation: 'none' | 'basic' | 'advanced';
    socialMediaIntegration: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
  };
  
  // Usage tracking
  usage: {
    jobPostingsThisMonth: number;
    usersActive: number;
    hiresThisMonth: number;
    lastActivityDate: Date;
  };
  
  // Payment info
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentMethodId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  employerId: { type: String, required: true },
  planType: { 
    type: String, 
    enum: ['trial', 'starter', 'professional', 'business', 'enterprise'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'cancelled', 'expired', 'paused'],
    default: 'active'
  },
  
  trialStartDate: { type: Date },
  trialEndDate: { type: Date },
  isInTrial: { type: Boolean, default: false },
  
  monthlyFee: { type: Number, required: true },
  successFeeRate: { type: Number, required: true }, // As percentage (e.g., 12 for 12%)
  jobPostingLimit: { type: Number, required: true }, // -1 for unlimited
  userLimit: { type: Number, required: true }, // -1 for unlimited
  
  currentPeriodStart: { type: Date, required: true },
  currentPeriodEnd: { type: Date, required: true },
  nextBillingDate: { type: Date, required: true },
  
  features: {
    aiMatching: { 
      type: String, 
      enum: ['basic', 'advanced', 'premium'],
      default: 'basic'
    },
    candidateProfiles: { 
      type: String, 
      enum: ['standard', 'premium', 'video'],
      default: 'standard'
    },
    support: { 
      type: String, 
      enum: ['email', 'email_chat', 'phone', 'dedicated'],
      default: 'email'
    },
    analytics: { 
      type: String, 
      enum: ['basic', 'advanced', 'custom'],
      default: 'basic'
    },
    branding: { type: Boolean, default: false },
    automation: { 
      type: String, 
      enum: ['none', 'basic', 'advanced'],
      default: 'none'
    },
    socialMediaIntegration: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    whiteLabel: { type: Boolean, default: false }
  },
  
  usage: {
    jobPostingsThisMonth: { type: Number, default: 0 },
    usersActive: { type: Number, default: 1 },
    hiresThisMonth: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: Date.now }
  },
  
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  paymentMethodId: { type: String }
}, {
  timestamps: true
});

// Indexes are managed centrally in server/config/indexes.ts

// Static methods
subscriptionSchema.statics.createTrialSubscription = async function(employerId: string) {
  const trialStart = new Date();
  const trialEnd = new Date(trialStart.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days
  
  const subscription = new this({
    employerId,
    planType: 'trial',
    status: 'active',
    isInTrial: true,
    trialStartDate: trialStart,
    trialEndDate: trialEnd,
    monthlyFee: 0,
    successFeeRate: 0, // Special trial rate - fixed £399 per hire
    jobPostingLimit: -1, // Unlimited during trial
    userLimit: 1,
    currentPeriodStart: trialStart,
    currentPeriodEnd: trialEnd,
    nextBillingDate: trialEnd,
    features: {
      aiMatching: 'advanced',
      candidateProfiles: 'premium',
      support: 'email_chat',
      analytics: 'basic',
      branding: false,
      automation: 'basic',
      socialMediaIntegration: true,
      apiAccess: false,
      whiteLabel: false
    }
  });
  
  return await subscription.save();
};

subscriptionSchema.statics.getPlanConfig = function(planType: string) {
  const configs = {
    trial: {
      monthlyFee: 0,
      successFeeRate: 0, // Special handling for £399 fixed fee
      jobPostingLimit: -1,
      userLimit: 1,
      features: {
        aiMatching: 'advanced',
        candidateProfiles: 'premium',
        support: 'email_chat',
        analytics: 'basic',
        branding: false,
        automation: 'basic',
        socialMediaIntegration: true,
        apiAccess: false,
        whiteLabel: false
      }
    },
    starter: {
      monthlyFee: 49,
      successFeeRate: 12,
      jobPostingLimit: 5,
      userLimit: 1,
      features: {
        aiMatching: 'basic',
        candidateProfiles: 'standard',
        support: 'email',
        analytics: 'basic',
        branding: false,
        automation: 'none',
        socialMediaIntegration: true,
        apiAccess: false,
        whiteLabel: false
      }
    },
    professional: {
      monthlyFee: 99,
      successFeeRate: 12,
      jobPostingLimit: 15,
      userLimit: 3,
      features: {
        aiMatching: 'advanced',
        candidateProfiles: 'video',
        support: 'email_chat',
        analytics: 'advanced',
        branding: true,
        automation: 'basic',
        socialMediaIntegration: true,
        apiAccess: false,
        whiteLabel: false
      }
    },
    business: {
      monthlyFee: 149,
      successFeeRate: 12,
      jobPostingLimit: 30,
      userLimit: 5,
      features: {
        aiMatching: 'premium',
        candidateProfiles: 'video',
        support: 'phone',
        analytics: 'custom',
        branding: true,
        automation: 'advanced',
        socialMediaIntegration: true,
        apiAccess: true,
        whiteLabel: true
      }
    },
    enterprise: {
      monthlyFee: 0, // Custom pricing
      successFeeRate: 12,
      jobPostingLimit: -1,
      userLimit: -1,
      features: {
        aiMatching: 'premium',
        candidateProfiles: 'video',
        support: 'dedicated',
        analytics: 'custom',
        branding: true,
        automation: 'advanced',
        socialMediaIntegration: true,
        apiAccess: true,
        whiteLabel: true
      }
    }
  };
  
  return configs[planType as keyof typeof configs] || configs.trial;
};

// Instance methods
subscriptionSchema.methods.isTrialExpired = function() {
  return this.isInTrial && this.trialEndDate && new Date() > this.trialEndDate;
};

subscriptionSchema.methods.daysLeftInTrial = function() {
  if (!this.isInTrial || !this.trialEndDate) return 0;
  const now = new Date();
  const msLeft = this.trialEndDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
};

subscriptionSchema.methods.canCreateJobPosting = function() {
  if (this.jobPostingLimit === -1) return true;
  return this.usage.jobPostingsThisMonth < this.jobPostingLimit;
};

subscriptionSchema.methods.canAddUser = function() {
  if (this.userLimit === -1) return true;
  return this.usage.usersActive < this.userLimit;
};

subscriptionSchema.methods.recordJobPosting = function() {
  this.usage.jobPostingsThisMonth += 1;
  this.usage.lastActivityDate = new Date();
  return this.save();
};

subscriptionSchema.methods.recordHire = function() {
  this.usage.hiresThisMonth += 1;
  this.usage.lastActivityDate = new Date();
  return this.save();
};

subscriptionSchema.methods.upgradePlan = async function(newPlanType: string) {
  const config = (this.constructor as any).getPlanConfig(newPlanType);
  
  this.planType = newPlanType as any;
  this.monthlyFee = config.monthlyFee;
  this.successFeeRate = config.successFeeRate;
  this.jobPostingLimit = config.jobPostingLimit;
  this.userLimit = config.userLimit;
  this.features = config.features;
  
  // End trial if upgrading
  if (this.isInTrial) {
    this.isInTrial = false;
    this.trialEndDate = new Date();
  }
  
  return await this.save();
};

// Prevent model overwrite error
export const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', subscriptionSchema);
