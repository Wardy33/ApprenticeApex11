import mongoose, { Document, Schema } from "mongoose";

export interface IInterview extends Document {
  _id: string;
  applicationId: string;
  studentId: string;
  companyId: string;
  jobTitle: string;
  scheduledDateTime: Date;
  duration: number; // in minutes
  type: "video" | "phone" | "in-person";
  status: "scheduled" | "completed" | "cancelled" | "rescheduled" | "no-show";
  videoCall?: {
    platform: "twilio" | "daily" | "zoom";
    roomId?: string;
    roomUrl?: string;
    accessToken?: string;
    recordingUrl?: string;
  };
  location?: {
    address: string;
    coordinates: [number, number];
    instructions?: string;
  };
  notes?: {
    companyNotes?: string;
    studentNotes?: string;
    outcomeNotes?: string;
  };
  feedback?: {
    companyRating?: number; // 1-5
    studentRating?: number; // 1-5
    companyFeedback?: string;
    studentFeedback?: string;
  };
  reminders: {
    sentAt: Date;
    type: "email" | "sms" | "push";
    recipient: "student" | "company" | "both";
  }[];
  rescheduleHistory: {
    previousDateTime: Date;
    reason: string;
    requestedBy: "student" | "company";
    requestedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const interviewSchema = new Schema<IInterview>(
  {
    applicationId: {
      type: String,
      required: true,
  
    },
    studentId: {
      type: String,
      required: true,
  
    },
    companyId: {
      type: String,
      required: true,
  
    },
    jobTitle: {
      type: String,
      required: true,
    },
    scheduledDateTime: {
      type: Date,
      required: true,
  
    },
    duration: {
      type: Number,
      required: true,
      default: 45,
      min: 15,
      max: 180,
    },
    type: {
      type: String,
      enum: ["video", "phone", "in-person"],
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "rescheduled", "no-show"],
      default: "scheduled",
  
    },
    videoCall: {
      platform: {
        type: String,
        enum: ["twilio", "daily", "zoom"],
      },
      roomId: { type: String },
      roomUrl: { type: String },
      accessToken: { type: String },
      recordingUrl: { type: String },
    },
    location: {
      address: { type: String },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
      instructions: { type: String },
    },
    notes: {
      companyNotes: { type: String, maxlength: 2000 },
      studentNotes: { type: String, maxlength: 2000 },
      outcomeNotes: { type: String, maxlength: 2000 },
    },
    feedback: {
      companyRating: { type: Number, min: 1, max: 5 },
      studentRating: { type: Number, min: 1, max: 5 },
      companyFeedback: { type: String, maxlength: 1000 },
      studentFeedback: { type: String, maxlength: 1000 },
    },
    reminders: [
      {
        sentAt: { type: Date, required: true },
        type: {
          type: String,
          enum: ["email", "sms", "push"],
          required: true,
        },
        recipient: {
          type: String,
          enum: ["student", "company", "both"],
          required: true,
        },
      },
    ],
    rescheduleHistory: [
      {
        previousDateTime: { type: Date, required: true },
        reason: { type: String, required: true },
        requestedBy: {
          type: String,
          enum: ["student", "company"],
          required: true,
        },
        requestedAt: { type: Date, required: true },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes are managed centrally in server/config/indexes.ts

export const Interview = mongoose.models.Interview || mongoose.model<IInterview>(
  "Interview",
  interviewSchema,
);
