import mongoose, { Schema, Document } from "mongoose";

export interface IApprenticeship extends Document {
  title: string;
  description: string;
  industry: string;
  company: mongoose.Types.ObjectId;
  companyName: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  salary: {
    min: number;
    max: number;
    currency: string;
    type: "hourly" | "monthly" | "annually";
  };
  requirements: {
    education: string;
    experience: string;
    skills: string[];
    certifications: string[];
  };
  benefits: string[];
  duration: {
    months: number;
    startDate: Date;
    endDate: Date;
  };
  applicationDeadline: Date;
  isActive: boolean;
  isRemote: boolean;
  employmentType: "full-time" | "part-time" | "contract";
  applicationCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ApprenticeshipSchema = new Schema<IApprenticeship>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    industry: {
      type: String,
      required: true,
      enum: [
        "Technology",
        "Healthcare",
        "Engineering",
        "Finance",
        "Manufacturing",
        "Construction",
        "Education",
        "Retail",
        "Hospitality",
        "Other",
      ],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        index: "2dsphere",
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
    },
    salary: {
      min: {
        type: Number,
        required: true,
        min: 0,
      },
      max: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "CAD"],
      },
      type: {
        type: String,
        required: true,
        enum: ["hourly", "monthly", "annually"],
      },
    },
    requirements: {
      education: {
        type: String,
        required: true,
      },
      experience: {
        type: String,
        required: true,
      },
      skills: [
        {
          type: String,
          trim: true,
        },
      ],
      certifications: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
    duration: {
      months: {
        type: Number,
        required: true,
        min: 1,
        max: 48,
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    applicationDeadline: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isRemote: {
      type: Boolean,
      default: false,
    },
    employmentType: {
      type: String,
      required: true,
      enum: ["full-time", "part-time", "contract"],
    },
    applicationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Note: Indexes are managed centrally in server/config/indexes.ts
// This avoids duplicate index definitions and Mongoose warnings

// Virtual for applications
ApprenticeshipSchema.virtual("applications", {
  ref: "Application",
  localField: "_id",
  foreignField: "apprenticeship",
});

// Pre-save middleware to validate salary range
ApprenticeshipSchema.pre("save", function (next) {
  if (this.salary.min > this.salary.max) {
    return next(
      new Error("Minimum salary cannot be greater than maximum salary"),
    );
  }

  if (this.duration.startDate >= this.duration.endDate) {
    return next(new Error("Start date must be before end date"));
  }

  next();
});

export const Apprenticeship = mongoose.model<IApprenticeship>(
  "Apprenticeship",
  ApprenticeshipSchema,
);
