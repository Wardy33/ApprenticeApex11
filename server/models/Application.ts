import mongoose, { Schema, Document } from "mongoose";

export interface IApplication extends Document {
  student: mongoose.Types.ObjectId;
  apprenticeship: mongoose.Types.ObjectId;
  status:
    | "pending"
    | "reviewing"
    | "interviewed"
    | "accepted"
    | "rejected"
    | "withdrawn";
  submittedAt: Date;
  lastUpdated: Date;
  applicationData: {
    coverLetter: string;
    resumeUrl?: string;
    portfolioUrl?: string;
    additionalDocuments?: string[];
    customAnswers?: {
      question: string;
      answer: string;
    }[];
  };
  interview?: {
    scheduledDate: Date;
    type: "phone" | "video" | "in-person";
    location?: string;
    meetingLink?: string;
    notes?: string;
    completed: boolean;
  };
  feedback?: {
    rating: number;
    comments: string;
    providedBy: mongoose.Types.ObjectId;
    providedAt: Date;
  };
  statusHistory: {
    status: string;
    changedAt: Date;
    changedBy: mongoose.Types.ObjectId;
    reason?: string;
  }[];
  matchScore?: number;
  withdrawalReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    apprenticeship: {
      type: Schema.Types.ObjectId,
      ref: "Apprenticeship",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "reviewing",
        "interviewed",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      default: "pending",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    applicationData: {
      coverLetter: {
        type: String,
        required: true,
        maxlength: 2000,
      },
      resumeUrl: {
        type: String,
        validate: {
          validator: function (url: string) {
            return !url || /^https?:\/\/.+/.test(url);
          },
          message: "Resume URL must be a valid HTTP/HTTPS URL",
        },
      },
      portfolioUrl: {
        type: String,
        validate: {
          validator: function (url: string) {
            return !url || /^https?:\/\/.+/.test(url);
          },
          message: "Portfolio URL must be a valid HTTP/HTTPS URL",
        },
      },
      additionalDocuments: [
        {
          type: String,
        },
      ],
      customAnswers: [
        {
          question: {
            type: String,
            required: true,
          },
          answer: {
            type: String,
            required: true,
            maxlength: 1000,
          },
        },
      ],
    },
    interview: {
      scheduledDate: Date,
      type: {
        type: String,
        enum: ["phone", "video", "in-person"],
      },
      location: String,
      meetingLink: {
        type: String,
        validate: {
          validator: function (url: string) {
            return !url || /^https?:\/\/.+/.test(url);
          },
          message: "Meeting link must be a valid HTTP/HTTPS URL",
        },
      },
      notes: {
        type: String,
        maxlength: 1000,
      },
      completed: {
        type: Boolean,
        default: false,
      },
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comments: {
        type: String,
        maxlength: 1000,
      },
      providedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      providedAt: {
        type: Date,
        default: Date.now,
      },
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
          enum: [
            "pending",
            "reviewing",
            "interviewed",
            "accepted",
            "rejected",
            "withdrawn",
          ],
        },
        changedAt: {
          type: Date,
          default: Date.now,
          required: true,
        },
        changedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reason: {
          type: String,
          maxlength: 500,
        },
      },
    ],
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    withdrawalReason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Note: Indexes are managed centrally in server/config/indexes.ts
// Keep only the unique constraint to prevent duplicate applications
ApplicationSchema.index({ student: 1, apprenticeship: 1 }, { unique: true });

// Virtual populate for student details
ApplicationSchema.virtual("studentDetails", {
  ref: "User",
  localField: "student",
  foreignField: "_id",
  justOne: true,
});

// Virtual populate for apprenticeship details
ApplicationSchema.virtual("apprenticeshipDetails", {
  ref: "Apprenticeship",
  localField: "apprenticeship",
  foreignField: "_id",
  justOne: true,
});

// Pre-save middleware to update lastUpdated and add status history
ApplicationSchema.pre("save", function (next) {
  // Update lastUpdated timestamp
  this.lastUpdated = new Date();

  // Add to status history if status changed
  if (this.isModified("status") && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: (this as any).modifiedBy || this.student,
      reason: (this as any).statusChangeReason,
    });
  }

  // Initialize status history for new applications
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this.student,
    });
  }

  next();
});

// Static method to get applications by status
ApplicationSchema.statics.findByStatus = function (status: string) {
  return this.find({ status }).populate("student apprenticeship");
};

// Instance method to update status with history tracking
ApplicationSchema.methods.updateStatus = function (
  newStatus: string,
  changedBy: string,
  reason?: string,
) {
  this.status = newStatus;
  this.modifiedBy = changedBy;
  this.statusChangeReason = reason;
  return this.save();
};

export const Application = mongoose.model<IApplication>(
  "Application",
  ApplicationSchema,
);
