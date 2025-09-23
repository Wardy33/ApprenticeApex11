import mongoose, { Schema, Document } from 'mongoose';

export interface ISuccessFee extends Document {
  employerId: string;
  studentId: string;
  apprenticeshipId?: string;
  
  // Fee Details
  feeType: 'success_fee' | 'platform_bypass_penalty' | 'liquidated_damages';
  feeRate: number; // Percentage or fixed amount
  feeStructure: 'percentage' | 'fixed';
  baseSalary?: number; // For percentage-based fees
  calculatedAmount: number;
  currency: string;
  
  // Hire Details
  hireDate?: Date;
  apprenticeStartDate?: Date;
  jobTitle?: string;
  actualSalary?: number;
  contractDuration?: number; // months
  
  // Payment Status
  paymentStatus: 'pending' | 'paid' | 'overdue' | 'disputed' | 'waived' | 'refunded';
  dueDate: Date;
  paidDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  
  // Tracking and Compliance
  hireSource: 'platform' | 'external' | 'unknown';
  firstContactDate: Date;
  bypassDetected: boolean;
  evidenceOfHire: {
    type: 'employee_confirmation' | 'payroll_records' | 'contract_upload' | 'external_report';
    uploadedAt: Date;
    documentUrl?: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
  }[];
  
  // Legal and Compliance
  agreementSigned: boolean;
  agreementDate?: Date;
  exclusivePeriodEnd: Date; // 12 months from first contact
  legalNoticesSent: {
    type: 'reminder' | 'demand' | 'legal_action';
    sentDate: Date;
    responseDate?: Date;
  }[];
  
  // Dispute Management
  disputeRaised: boolean;
  disputeDetails?: {
    reason: string;
    raisedDate: Date;
    status: 'pending' | 'mediation' | 'resolved' | 'legal';
    resolution?: string;
    resolvedDate?: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const successFeeSchema = new Schema<ISuccessFee>({
  employerId: { type: String, required: true },
  studentId: { type: String, required: true },
  apprenticeshipId: { type: String },
  
  feeType: { 
    type: String, 
    enum: ['success_fee', 'platform_bypass_penalty', 'liquidated_damages'],
    required: true 
  },
  feeRate: { type: Number, required: true },
  feeStructure: { type: String, enum: ['percentage', 'fixed'], required: true },
  baseSalary: { type: Number },
  calculatedAmount: { type: Number, required: true },
  currency: { type: String, default: 'GBP' },
  
  hireDate: { type: Date },
  apprenticeStartDate: { type: Date },
  jobTitle: { type: String },
  actualSalary: { type: Number },
  contractDuration: { type: Number },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'disputed', 'waived', 'refunded'],
    default: 'pending'
  },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  paymentMethod: { type: String },
  transactionId: { type: String },
  
  hireSource: { 
    type: String, 
    enum: ['platform', 'external', 'unknown'],
    default: 'platform'
  },
  firstContactDate: { type: Date, required: true },
  bypassDetected: { type: Boolean, default: false },
  evidenceOfHire: [{
    type: {
      type: String,
      enum: ['employee_confirmation', 'payroll_records', 'contract_upload', 'external_report'],
      required: true
    },
    uploadedAt: { type: Date, default: Date.now },
    documentUrl: { type: String },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    }
  }],
  
  agreementSigned: { type: Boolean, default: false },
  agreementDate: { type: Date },
  exclusivePeriodEnd: { type: Date, required: true },
  legalNoticesSent: [{
    type: {
      type: String,
      enum: ['reminder', 'demand', 'legal_action'],
      required: true
    },
    sentDate: { type: Date, default: Date.now },
    responseDate: { type: Date }
  }],
  
  disputeRaised: { type: Boolean, default: false },
  disputeDetails: {
    reason: { type: String },
    raisedDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'mediation', 'resolved', 'legal']
    },
    resolution: { type: String },
    resolvedDate: { type: Date }
  }
}, {
  timestamps: true,
});

// Indexes are managed centrally in server/config/indexes.ts

// Static methods
successFeeSchema.statics.createSuccessFee = async function(
  employerId: string,
  studentId: string,
  hireDetails: any,
  agreementDetails: any
) {
  const feeRate = 15; // 15% default rate
  const calculatedAmount = hireDetails.salary * (feeRate / 100);
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  
  const successFee = new this({
    employerId,
    studentId,
    apprenticeshipId: hireDetails.apprenticeshipId,
    feeType: 'success_fee',
    feeRate,
    feeStructure: 'percentage',
    baseSalary: hireDetails.salary,
    calculatedAmount,
    currency: 'GBP',
    hireDate: hireDetails.hireDate,
    apprenticeStartDate: hireDetails.startDate,
    jobTitle: hireDetails.jobTitle,
    actualSalary: hireDetails.salary,
    contractDuration: hireDetails.duration,
    dueDate,
    hireSource: hireDetails.source || 'platform',
    firstContactDate: agreementDetails.firstContactDate,
    exclusivePeriodEnd: new Date(agreementDetails.firstContactDate.getTime() + 365 * 24 * 60 * 60 * 1000),
    agreementSigned: agreementDetails.signed,
    agreementDate: agreementDetails.signedDate
  });
  
  return await successFee.save();
};

successFeeSchema.statics.createBypassPenalty = async function(
  employerId: string,
  studentId: string,
  bypassDetails: any
) {
  const penaltyAmount = bypassDetails.type === 'hire_bypass' ? 2000 : 500;
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days for penalties
  
  const penalty = new this({
    employerId,
    studentId,
    feeType: 'platform_bypass_penalty',
    feeRate: penaltyAmount,
    feeStructure: 'fixed',
    calculatedAmount: penaltyAmount,
    currency: 'GBP',
    dueDate,
    hireSource: 'external',
    firstContactDate: bypassDetails.firstContactDate,
    exclusivePeriodEnd: new Date(bypassDetails.firstContactDate.getTime() + 365 * 24 * 60 * 60 * 1000),
    bypassDetected: true,
    evidenceOfHire: bypassDetails.evidence ? [{
      type: 'external_report',
      uploadedAt: new Date(),
      verificationStatus: 'pending'
    }] : []
  });
  
  return await penalty.save();
};

successFeeSchema.statics.getOverdueFees = async function() {
  const today = new Date();
  return await this.find({
    dueDate: { $lt: today },
    paymentStatus: { $in: ['pending', 'overdue'] }
  });
};

successFeeSchema.statics.getFeesInExclusivePeriod = async function(employerId: string, studentId: string) {
  const today = new Date();
  return await this.find({
    employerId,
    studentId,
    exclusivePeriodEnd: { $gt: today }
  });
};

successFeeSchema.statics.calculateTotalOwed = async function(employerId: string) {
  const result = await this.aggregate([
    {
      $match: {
        employerId,
        paymentStatus: { $in: ['pending', 'overdue'] }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$calculatedAmount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { totalAmount: 0, count: 0 };
};

// Instance methods
successFeeSchema.methods.markAsPaid = function(paymentDetails: any) {
  this.paymentStatus = 'paid';
  this.paidDate = new Date();
  this.paymentMethod = paymentDetails.method;
  this.transactionId = paymentDetails.transactionId;
  return this.save();
};

successFeeSchema.methods.markAsOverdue = function() {
  this.paymentStatus = 'overdue';
  return this.save();
};

successFeeSchema.methods.addEvidence = function(evidenceType: string, documentUrl?: string) {
  this.evidenceOfHire.push({
    type: evidenceType as any,
    uploadedAt: new Date(),
    documentUrl,
    verificationStatus: 'pending'
  });
  return this.save();
};

successFeeSchema.methods.sendLegalNotice = function(noticeType: string) {
  this.legalNoticesSent.push({
    type: noticeType as any,
    sentDate: new Date()
  });
  return this.save();
};

successFeeSchema.methods.raiseDispute = function(reason: string) {
  this.disputeRaised = true;
  this.disputeDetails = {
    reason,
    raisedDate: new Date(),
    status: 'pending'
  };
  this.paymentStatus = 'disputed';
  return this.save();
};

export const SuccessFee = mongoose.models.SuccessFee || mongoose.model<ISuccessFee>('SuccessFee', successFeeSchema);
