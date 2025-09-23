import mongoose, { Document, Schema } from "mongoose";

// Note: Subscription interface moved to models/Subscription.ts to avoid conflicts

export interface IPayment extends Document {
  _id: string;
  userId: string;
  subscriptionId?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  amount: number; // in cents
  currency: string;
  status: "pending" | "succeeded" | "failed" | "cancelled" | "refunded";
  type: "subscription" | "one_time" | "refund";
  description: string;
  metadata?: {
    plan?: string;
    billingPeriod?: string;
    jobListingId?: string;
    features?: string[];
  };
  failureReason?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoice extends Document {
  _id: string;
  userId: string;
  subscriptionId: string;
  paymentId?: string;
  stripeInvoiceId?: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  dueDate: Date;
  paidAt?: Date;
  lineItems: {
    description: string;
    quantity: number;
    unitAmount: number;
    totalAmount: number;
  }[];
  tax?: {
    rate: number;
    amount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Subscription schema moved to models/Subscription.ts to avoid conflicts

const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: String,
      required: true,
    },
    subscriptionId: { type: String },
    stripePaymentIntentId: { type: String },
    stripeChargeId: { type: String },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "gbp",
    },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "cancelled", "refunded"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["subscription", "one_time", "refund"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      plan: { type: String },
      billingPeriod: { type: String },
      jobListingId: { type: String },
      features: [{ type: String }],
    },
    failureReason: { type: String },
    refundAmount: { type: Number },
    refundReason: { type: String },
  },
  {
    timestamps: true,
  },
);

const invoiceSchema = new Schema<IInvoice>(
  {
    userId: {
      type: String,
      required: true,
    },
    subscriptionId: {
      type: String,
      required: true,
    },
    paymentId: { type: String },
    stripeInvoiceId: { type: String },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "gbp",
    },
    status: {
      type: String,
      enum: ["draft", "open", "paid", "void", "uncollectible"],
      default: "draft",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidAt: { type: Date },
    lineItems: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitAmount: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
      },
    ],
    tax: {
      rate: { type: Number, min: 0, max: 1 },
      amount: { type: Number, min: 0 },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes are managed centrally in server/config/indexes.ts

// Subscription model moved to models/Subscription.ts to avoid conflicts
export const Payment = mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);
export const Invoice = mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", invoiceSchema);
