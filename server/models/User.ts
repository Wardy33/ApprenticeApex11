import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  role: "candidate" | "company" | "admin" | "master_admin";
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  isActive: boolean;
  profile: ICandidateProfile | ICompanyProfile | IAdminProfile;
  createdAt: Date;
  updatedAt: Date;

  // Master Admin specific fields
  isMasterAdmin?: boolean;
  adminPermissions?: {
    canViewAllUsers: boolean;
    canViewFinancials: boolean;
    canModerateContent: boolean;
    canAccessSystemLogs: boolean;
    canExportData: boolean;
    canManageAdmins: boolean;
    canConfigureSystem: boolean;
  };
  lastAccessedAdminPanel?: Date;
  adminLoginAttempts?: number;
  adminLoginLockedUntil?: Date;
}

export interface ICandidateProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  phone?: string;
  bio?: string;
  skills: string[];
  hasDriversLicense: boolean;
  assistedNeeds?: string;
  education: IEducation[];
  experience: IExperience[];
  videoProfile?: {
    url: string;
    cloudinaryId: string;
    thumbnail: string;
  };
  location: {
    city: string;
    postcode: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  preferences: {
    industries: string[];
    maxDistance: number; // in miles
    salaryRange: {
      min: number;
      max: number;
    };
    workType: "full-time" | "part-time" | "both";
    remoteWork: boolean;
  };
  transportModes: string[];
  cvUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  isActive: boolean;
  profileCompletion: number; // Percentage 0-100
  availabilityDate?: Date;
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    applicationUpdates: boolean;
    jobRecommendations: boolean;
  };
}

export interface ICompanyProfile {
  companyName: string;
  industry: string;
  description: string;
  website?: string;
  logo?: string;
  companySize: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+";
  foundedYear?: number;
  location: {
    city: string;
    address: string;
    postcode: string;
    coordinates: [number, number];
  };
  contactPerson: {
    firstName: string;
    lastName: string;
    position: string;
    phone?: string;
    email?: string;
  };
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  benefits: string[];
  culture: string[];
  isVerified: boolean;
  verificationDate?: Date;
  subscriptionPlan: "free" | "basic" | "premium" | "enterprise";
  jobPostingLimit: number;
  jobPostingsUsed: number;
  notificationSettings: {
    applicationAlerts: boolean;
    weeklyReports: boolean;
    marketingEmails: boolean;
  };
}

export interface IAdminProfile {
  firstName: string;
  lastName: string;
  position: string;
  department?: string;
  permissions: {
    users: boolean;
    content: boolean;
    financial: boolean;
    analytics: boolean;
    system: boolean;
  };
  lastAccess: Date;
  twoFactorEnabled: boolean;
  adminLevel: "admin" | "master_admin";
}

export interface IEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  isCurrently: boolean;
  grade?: string;
  achievements?: string[];
}

export interface IExperience {
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  isCurrently: boolean;
  description: string;
  skills?: string[];
  achievements?: string[];
}

const educationSchema = new Schema<IEducation>({
  institution: { type: String, required: true, trim: true },
  degree: { type: String, required: true, trim: true },
  fieldOfStudy: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isCurrently: { type: Boolean, default: false },
  grade: { type: String, trim: true },
  achievements: [{ type: String, trim: true }],
});

const experienceSchema = new Schema<IExperience>({
  company: { type: String, required: true, trim: true },
  position: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isCurrently: { type: Boolean, default: false },
  description: { type: String, required: true, maxlength: 1000 },
  skills: [{ type: String, trim: true }],
  achievements: [{ type: String, trim: true }],
});

export const candidateProfileSchema = new Schema<ICandidateProfile>({
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function (date: Date) {
        const age = new Date().getFullYear() - date.getFullYear();
        return age >= 16 && age <= 65;
      },
      message: "Age must be between 16 and 65",
    },
  },
  phone: {
    type: String,
    validate: {
      validator: function (phone: string) {
        return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
      },
      message: "Please enter a valid phone number",
    },
  },
  bio: { type: String, maxlength: 500 },
  skills: [
    {
      type: String,
      trim: true,
      maxlength: 50,
    },
  ],
  hasDriversLicense: { type: Boolean, default: false },
  assistedNeeds: { type: String, maxlength: 500 },
  education: [educationSchema],
  experience: [experienceSchema],
  videoProfile: {
    url: { type: String },
    cloudinaryId: { type: String },
    thumbnail: { type: String },
  },
  location: {
    city: { type: String, required: true, trim: true },
    postcode: { type: String, trim: true },
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
  },
  preferences: {
    industries: [
      {
        type: String,
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
    ],
    maxDistance: { type: Number, default: 25, min: 1, max: 500 },
    salaryRange: {
      min: { type: Number, default: 0, min: 0 },
      max: { type: Number, default: 100000, min: 0 },
    },
    workType: {
      type: String,
      enum: ["full-time", "part-time", "both"],
      default: "both",
    },
    remoteWork: { type: Boolean, default: false },
  },
  transportModes: [
    {
      type: String,
      enum: [
        "car",
        "public-transport",
        "bicycle",
        "walking",
        "motorcycle",
        "other",
      ],
    },
  ],
  cvUrl: {
    type: String,
    validate: {
      validator: function (url: string) {
        return !url || /^https?:\/\/.+/.test(url);
      },
      message: "CV URL must be a valid HTTP/HTTPS URL",
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
  linkedinUrl: {
    type: String,
    validate: {
      validator: function (url: string) {
        return !url || /^https?:\/\/(www\.)?linkedin\.com\/.+/.test(url);
      },
      message: "LinkedIn URL must be a valid LinkedIn profile URL",
    },
  },
  githubUrl: {
    type: String,
    validate: {
      validator: function (url: string) {
        return !url || /^https?:\/\/(www\.)?github\.com\/.+/.test(url);
      },
      message: "GitHub URL must be a valid GitHub profile URL",
    },
  },
  isActive: { type: Boolean, default: true },
  profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
  availabilityDate: { type: Date },
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    applicationUpdates: { type: Boolean, default: true },
    jobRecommendations: { type: Boolean, default: true },
  },
});

export const companyProfileSchema = new Schema<ICompanyProfile>({
  companyName: { type: String, required: true, trim: true, maxlength: 100 },
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
  description: { type: String, required: true, maxlength: 2000 },
  website: {
    type: String,
    validate: {
      validator: function (url: string) {
        return !url || /^https?:\/\/.+/.test(url);
      },
      message: "Website must be a valid HTTP/HTTPS URL",
    },
  },
  logo: { type: String },
  companySize: {
    type: String,
    enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
    required: true,
  },
  foundedYear: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear(),
    validate: {
      validator: function (year: number) {
        return !year || (year >= 1800 && year <= new Date().getFullYear());
      },
      message: "Founded year must be between 1800 and current year",
    },
  },
  location: {
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    postcode: { type: String, trim: true },
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
  },
  contactPerson: {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    position: { type: String, required: true, trim: true, maxlength: 100 },
    phone: {
      type: String,
      validate: {
        validator: function (phone: string) {
          return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
        },
        message: "Please enter a valid phone number",
      },
    },
    email: {
      type: String,
      validate: {
        validator: function (email: string) {
          return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Please enter a valid email address",
      },
    },
  },
  socialLinks: {
    linkedin: {
      type: String,
      validate: {
        validator: function (url: string) {
          return !url || /^https?:\/\/(www\.)?linkedin\.com\/.+/.test(url);
        },
        message: "LinkedIn URL must be a valid LinkedIn URL",
      },
    },
    twitter: {
      type: String,
      validate: {
        validator: function (url: string) {
          return !url || /^https?:\/\/(www\.)?twitter\.com\/.+/.test(url);
        },
        message: "Twitter URL must be a valid Twitter URL",
      },
    },
    facebook: {
      type: String,
      validate: {
        validator: function (url: string) {
          return !url || /^https?:\/\/(www\.)?facebook\.com\/.+/.test(url);
        },
        message: "Facebook URL must be a valid Facebook URL",
      },
    },
  },
  benefits: [{ type: String, trim: true, maxlength: 100 }],
  culture: [{ type: String, trim: true, maxlength: 100 }],
  isVerified: { type: Boolean, default: false },
  verificationDate: { type: Date },
  subscriptionPlan: {
    type: String,
    enum: ["free", "basic", "premium", "enterprise"],
    default: "free",
  },
  jobPostingLimit: { type: Number, default: 3, min: 0 },
  jobPostingsUsed: { type: Number, default: 0, min: 0 },
  notificationSettings: {
    applicationAlerts: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
  },
});

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Please enter a valid email address",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      validate: {
        validator: function (password: string) {
          // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(
            password,
          );
        },
        message:
          "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number",
      },
    },
    role: {
      type: String,
      enum: ["student", "company", "admin", "master_admin"],
      required: true,
    },
    isMasterAdmin: { type: Boolean, default: false },
    adminPermissions: {
      canViewAllUsers: { type: Boolean, default: false },
      canViewFinancials: { type: Boolean, default: false },
      canModerateContent: { type: Boolean, default: false },
      canAccessSystemLogs: { type: Boolean, default: false },
      canExportData: { type: Boolean, default: false },
      canManageAdmins: { type: Boolean, default: false },
      canConfigureSystem: { type: Boolean, default: false },
    },
    lastAccessedAdminPanel: { type: Date },
    adminLoginAttempts: { type: Number, default: 0 },
    adminLoginLockedUntil: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    profile: {
      type: Schema.Types.Mixed,
      validate: {
        validator: function (this: IUser, value: any) {
          if (this.role === "candidate") {
            return value && typeof value === "object" && "firstName" in value;
          } else if (this.role === "company") {
            return value && typeof value === "object" && "companyName" in value;
          } else if (this.role === "admin" || this.role === "master_admin") {
            return true; // Admin profile is optional
          }
          return false;
        },
        message: "Profile must match the user role",
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc: any, ret: any) {
        delete (ret as any).password;
        delete (ret as any).emailVerificationToken;
        delete (ret as any).passwordResetToken;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// Note: Indexes are managed centrally in server/config/indexes.ts
// This avoids duplicate index definitions and Mongoose warnings

// Virtual for full name (students)
userSchema.virtual("fullName").get(function () {
  if (this.role === "candidate" && this.profile) {
    const profile = this.profile as ICandidateProfile;
    return `${profile.firstName} ${profile.lastName}`;
  }
  return undefined;
});

// Virtual for applications (students)
userSchema.virtual("applications", {
  ref: "Application",
  localField: "_id",
  foreignField: "student",
});

// Virtual for apprenticeships (companies)
userSchema.virtual("apprenticeships", {
  ref: "Apprenticeship",
  localField: "_id",
  foreignField: "company",
});

// Password hashing middleware
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Import bcrypt dynamically to avoid circular dependencies
    const bcrypt = await import("bcryptjs");
    const saltRounds = 12;
    this.password = await bcrypt.default.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Calculate profile completion for students
userSchema.pre("save", function (next) {
  if (this.role === "candidate" && this.profile) {
    const profile = this.profile as ICandidateProfile;
    let completionScore = 0;
    const totalFields = 10;

    // Basic info (30%)
    if (profile.firstName && profile.lastName) completionScore += 1;
    if (profile.phone) completionScore += 0.5;
    if (profile.bio) completionScore += 0.5;
    if (profile.dateOfBirth) completionScore += 0.5;
    if (profile.location?.city) completionScore += 0.5;

    // Skills and preferences (25%)
    if (profile.skills && profile.skills.length > 0) completionScore += 1;
    if (
      profile.preferences?.industries &&
      profile.preferences.industries.length > 0
    )
      completionScore += 1;
    if (profile.transportModes && profile.transportModes.length > 0)
      completionScore += 0.5;

    // Education and experience (25%)
    if (profile.education && profile.education.length > 0)
      completionScore += 1.25;
    if (profile.experience && profile.experience.length > 0)
      completionScore += 1.25;

    // Additional materials (20%)
    if (profile.cvUrl) completionScore += 1;
    if (profile.videoProfile?.url) completionScore += 1;

    profile.profileCompletion = Math.round(
      (completionScore / totalFields) * 100,
    );
  }
  next();
});

// Update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
) {
  const bcrypt = await import("bcryptjs");
  return bcrypt.default.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const crypto = require("crypto");
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return resetToken;
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const crypto = require("crypto");
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return verificationToken;
};

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
