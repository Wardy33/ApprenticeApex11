import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployerAccess extends Document {
  employerId: string;
  studentId: string;
  accessLevel: 1 | 2 | 3 | 4;
  accessGrantedAt: Date;
  paymentStatus: 'none' | 'pending' | 'paid' | 'refunded';
  commitmentType: 'none' | 'subscription' | 'success_fee' | 'interview_fee';
  accessHistory: {
    level: number;
    grantedAt: Date;
    action: string;
    metadata?: any;
  }[];
  restrictions: {
    contactBlocked: boolean;
    downloadBlocked: boolean;
    externalSharingBlocked: boolean;
  };
  monitoringFlags: {
    suspiciousActivity: boolean;
    externalContactAttempts: number;
    lastActivityAt: Date;
  };
  agreementSigned: boolean;
  agreementSignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const employerAccessSchema = new Schema<IEmployerAccess>({
  employerId: { type: String, required: true },
  studentId: { type: String, required: true },
  accessLevel: { 
    type: Number, 
    enum: [1, 2, 3, 4], 
    default: 1,
    required: true 
  },
  accessGrantedAt: { type: Date, default: Date.now },
  paymentStatus: {
    type: String,
    enum: ['none', 'pending', 'paid', 'refunded'],
    default: 'none'
  },
  commitmentType: {
    type: String,
    enum: ['none', 'subscription', 'success_fee', 'interview_fee'],
    default: 'none'
  },
  accessHistory: [{
    level: { type: Number, required: true },
    grantedAt: { type: Date, default: Date.now },
    action: { type: String, required: true },
    metadata: Schema.Types.Mixed
  }],
  restrictions: {
    contactBlocked: { type: Boolean, default: false },
    downloadBlocked: { type: Boolean, default: true },
    externalSharingBlocked: { type: Boolean, default: true }
  },
  monitoringFlags: {
    suspiciousActivity: { type: Boolean, default: false },
    externalContactAttempts: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now }
  },
  agreementSigned: { type: Boolean, default: false },
  agreementSignedAt: { type: Date },
}, {
  timestamps: true,
});

// Indexes are managed centrally in server/config/indexes.ts
// Note: employerId + studentId unique constraint is preserved

// Static methods for access control
employerAccessSchema.statics.getAccessLevel = async function(employerId: string, studentId: string) {
  const access = await this.findOne({ employerId, studentId });
  return access ? access.accessLevel : 0;
};

employerAccessSchema.statics.upgradeAccess = async function(
  employerId: string, 
  studentId: string, 
  newLevel: number,
  action: string,
  metadata?: any
) {
  const access = await this.findOneAndUpdate(
    { employerId, studentId },
    {
      $set: {
        accessLevel: newLevel,
        accessGrantedAt: new Date(),
        'monitoringFlags.lastActivityAt': new Date()
      },
      $push: {
        accessHistory: {
          level: newLevel,
          grantedAt: new Date(),
          action,
          metadata
        }
      }
    },
    { upsert: true, new: true }
  );
  
  return access;
};

employerAccessSchema.statics.recordActivity = async function(
  employerId: string,
  studentId: string,
  action: string,
  metadata?: any
) {
  await this.findOneAndUpdate(
    { employerId, studentId },
    {
      $set: { 'monitoringFlags.lastActivityAt': new Date() },
      $push: {
        accessHistory: {
          level: 0, // Activity record
          grantedAt: new Date(),
          action,
          metadata
        }
      }
    },
    { upsert: true }
  );
};

employerAccessSchema.statics.flagSuspiciousActivity = async function(
  employerId: string,
  studentId: string,
  reason: string
) {
  await this.findOneAndUpdate(
    { employerId, studentId },
    {
      $set: { 
        'monitoringFlags.suspiciousActivity': true,
        'monitoringFlags.lastActivityAt': new Date()
      },
      $inc: { 'monitoringFlags.externalContactAttempts': 1 },
      $push: {
        accessHistory: {
          level: 0,
          grantedAt: new Date(),
          action: 'SUSPICIOUS_ACTIVITY_FLAGGED',
          metadata: { reason }
        }
      }
    },
    { upsert: true }
  );
};

export const EmployerAccess = mongoose.models.EmployerAccess || mongoose.model<IEmployerAccess>('EmployerAccess', employerAccessSchema);
