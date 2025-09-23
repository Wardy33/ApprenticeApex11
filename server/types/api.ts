// Standardized API response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends APIResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse extends APIResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  stack?: string; // Only in development
}

// User-related types
export interface UserProfile {
  id: string;
  email: string;
  role: 'student' | 'company' | 'admin';
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  isEmailVerified: boolean;
}

export interface StudentProfile extends UserProfile {
  role: 'student';
  dateOfBirth?: string;
  location?: string;
  skills?: string[];
  interests?: string[];
  education?: {
    level: string;
    institution?: string;
    graduationYear?: number;
  };
  cv?: {
    filename: string;
    uploadDate: string;
    url: string;
  };
}

export interface CompanyProfile extends UserProfile {
  role: 'company';
  companyName: string;
  companySize: string;
  industry: string;
  website?: string;
  description?: string;
  address?: string;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'cancelled';
}

// Apprenticeship-related types
export interface Apprenticeship {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logo?: string;
  };
  description: string;
  requirements: string[];
  benefits: string[];
  location: string;
  salary: {
    min: number;
    max: number;
    currency: 'GBP';
  };
  duration: string;
  startDate: string;
  applicationDeadline: string;
  isRemote: boolean;
  experienceLevel: 'entry' | 'junior' | 'mid' | 'senior';
  category: string;
  skills: string[];
  status: 'active' | 'paused' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  studentId: string;
  apprenticeshipId: string;
  coverLetter?: string;
  status: 'pending' | 'reviewing' | 'interview' | 'offer' | 'accepted' | 'rejected';
  appliedAt: string;
  updatedAt: string;
  notes?: string;
}

// Subscription and payment types
export interface Subscription {
  id: string;
  companyId: string;
  planType: 'trial' | 'starter' | 'professional' | 'business' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  trialEnd?: string;
  monthlyFee: number;
  successFeeRate: number;
  features: {
    jobPostings: number;
    adminUsers: number;
    hasVideoInterviews: boolean;
    hasAPIAccess: boolean;
    hasPrioritySupport: boolean;
  };
}

export interface Payment {
  id: string;
  companyId: string;
  type: 'monthly_subscription' | 'success_fee' | 'one_time';
  amount: number;
  currency: 'GBP';
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  description: string;
  createdAt: string;
  paidAt?: string;
}

// Video interview types
export interface VideoRoom {
  id: string;
  roomName: string;
  applicationId: string;
  scheduledFor: string;
  duration: number; // in minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participants: {
    studentId: string;
    companyUserId: string;
  };
  roomUrl?: string;
  recordingUrl?: string;
  createdAt: string;
}

// Message types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'student' | 'company';
  content: string;
  messageType: 'text' | 'file' | 'system';
  attachments?: {
    filename: string;
    url: string;
    type: string;
  }[];
  readAt?: string;
  createdAt: string;
}

// Utility types for API handlers
export type RequestHandler<TParams = any, TBody = any, TQuery = any> = (
  req: {
    params: TParams;
    body: TBody;
    query: TQuery;
    user?: UserProfile;
  }
) => Promise<APIResponse>;

// Validation schemas export (for Zod)
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}
