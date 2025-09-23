import mongoose, { Schema, Document } from 'mongoose';

export interface IBilling extends Document {
  employerId: string;
  subscriptionId: string;
  
  // Invoice details
  invoiceType: 'monthly_fee' | 'success_fee' | 'trial_hire_fee';
  amount: number;
  currency: string;
  
  // For success fees
  relatedHireId?: string;
  candidateName?: string;
  jobTitle?: string;
  annualSalary?: number;
  feePercentage?: number;
  
  // For trial hire fees
  isTrialHire?: boolean;
  trialFeeAmount?: number; // £399 for trial hires
  
  // Payment status
  status: 'pending' | 'paid' | 'overdue' | 'failed' | 'refunded' | 'disputed';
  dueDate: Date;
  paidDate?: Date;
  
  // Payment processing
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  paymentMethod?: string;
  
  // Billing period (for monthly fees)
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
  
  // Notes and metadata
  description: string;
  metadata?: any;
  
  createdAt: Date;
  updatedAt: Date;
}

const billingSchema = new Schema<IBilling>({
  employerId: { type: String, required: true },
  subscriptionId: { type: String, required: true },
  
  invoiceType: { 
    type: String, 
    enum: ['monthly_fee', 'success_fee', 'trial_hire_fee'],
    required: true 
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'GBP' },
  
  relatedHireId: { type: String },
  candidateName: { type: String },
  jobTitle: { type: String },
  annualSalary: { type: Number },
  feePercentage: { type: Number },
  
  isTrialHire: { type: Boolean, default: false },
  trialFeeAmount: { type: Number },
  
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'overdue', 'failed', 'refunded', 'disputed'],
    default: 'pending'
  },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  
  stripeInvoiceId: { type: String },
  stripePaymentIntentId: { type: String },
  paymentMethod: { type: String },
  
  billingPeriodStart: { type: Date },
  billingPeriodEnd: { type: Date },
  
  description: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

// Indexes are managed centrally in server/config/indexes.ts

// Static methods
billingSchema.statics.createMonthlyFee = async function(
  subscriptionId: string,
  employerId: string,
  amount: number,
  billingPeriod: { start: Date; end: Date }
) {
  const dueDate = new Date(billingPeriod.start.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days to pay
  
  const billing = new this({
    employerId,
    subscriptionId,
    invoiceType: 'monthly_fee',
    amount,
    currency: 'GBP',
    status: 'pending',
    dueDate,
    billingPeriodStart: billingPeriod.start,
    billingPeriodEnd: billingPeriod.end,
    description: `Monthly subscription fee for ${billingPeriod.start.toLocaleDateString()} - ${billingPeriod.end.toLocaleDateString()}`
  });
  
  return await billing.save();
};

billingSchema.statics.createSuccessFee = async function(
  subscriptionId: string,
  employerId: string,
  hireDetails: {
    hireId: string;
    candidateName: string;
    jobTitle: string;
    annualSalary: number;
    feePercentage: number;
  }
) {
  const amount = Math.min(Math.max(
    (hireDetails.annualSalary * hireDetails.feePercentage) / 100,
    1800 // Minimum fee
  ), 3600); // Maximum fee
  
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days to pay
  
  const billing = new this({
    employerId,
    subscriptionId,
    invoiceType: 'success_fee',
    amount,
    currency: 'GBP',
    relatedHireId: hireDetails.hireId,
    candidateName: hireDetails.candidateName,
    jobTitle: hireDetails.jobTitle,
    annualSalary: hireDetails.annualSalary,
    feePercentage: hireDetails.feePercentage,
    status: 'pending',
    dueDate,
    description: `Success fee for hiring ${hireDetails.candidateName} as ${hireDetails.jobTitle} (${hireDetails.feePercentage}% of £${hireDetails.annualSalary})`
  });
  
  return await billing.save();
};

billingSchema.statics.createTrialHireFee = async function(
  subscriptionId: string,
  employerId: string,
  hireDetails: {
    hireId: string;
    candidateName: string;
    jobTitle: string;
  }
) {
  const trialFeeAmount = 399; // Fixed £399 for trial hires
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days to pay
  
  const billing = new this({
    employerId,
    subscriptionId,
    invoiceType: 'trial_hire_fee',
    amount: trialFeeAmount,
    currency: 'GBP',
    relatedHireId: hireDetails.hireId,
    candidateName: hireDetails.candidateName,
    jobTitle: hireDetails.jobTitle,
    isTrialHire: true,
    trialFeeAmount,
    status: 'pending',
    dueDate,
    description: `Trial hire fee for ${hireDetails.candidateName} as ${hireDetails.jobTitle} (60-day trial pricing)`
  });
  
  return await billing.save();
};

billingSchema.statics.getOutstandingBalance = async function(employerId: string) {
  const result = await this.aggregate([
    {
      $match: {
        employerId,
        status: { $in: ['pending', 'overdue'] }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { totalAmount: 0, count: 0 };
};

billingSchema.statics.getMonthlyRevenue = async function(month: Date) {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  const result = await this.aggregate([
    {
      $match: {
        status: 'paid',
        paidDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }
    },
    {
      $group: {
        _id: '$invoiceType',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result;
};

// Instance methods
billingSchema.methods.markAsPaid = function(paymentDetails: {
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  paidDate?: Date;
}) {
  this.status = 'paid';
  this.paidDate = paymentDetails.paidDate || new Date();
  this.paymentMethod = paymentDetails.paymentMethod;
  this.stripePaymentIntentId = paymentDetails.stripePaymentIntentId;
  
  return this.save();
};

billingSchema.methods.markAsOverdue = function() {
  this.status = 'overdue';
  return this.save();
};

billingSchema.methods.markAsFailed = function() {
  this.status = 'failed';
  return this.save();
};

billingSchema.methods.isOverdue = function() {
  return this.status === 'pending' && new Date() > this.dueDate;
};

billingSchema.methods.daysPastDue = function() {
  if (this.status !== 'overdue' && !this.isOverdue()) return 0;
  const now = new Date();
  const msPastDue = now.getTime() - this.dueDate.getTime();
  return Math.ceil(msPastDue / (24 * 60 * 60 * 1000));
};

export const Billing = mongoose.models.Billing || mongoose.model<IBilling>('Billing', billingSchema);
