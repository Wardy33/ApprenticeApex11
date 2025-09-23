// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: "student" | "company";
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    role: string;
    profile: any;
    isEmailVerified?: boolean;
  };
  token: string;
}

// User Profile Types
export interface StudentProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  bio?: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
  videoProfile?: {
    url: string;
    cloudinaryId: string;
    thumbnail: string;
  };
  location: {
    city: string;
    coordinates: [number, number];
  };
  preferences: {
    industries: string[];
    maxDistance: number;
    salaryRange: {
      min: number;
      max: number;
    };
  };
  cvUrl?: string;
  isActive: boolean;
}

export interface CompanyProfile {
  companyName: string;
  industry: string;
  description: string;
  website?: string;
  logo?: string;
  location: {
    city: string;
    address: string;
    coordinates: [number, number];
  };
  contactPerson: {
    firstName: string;
    lastName: string;
    position: string;
    phone?: string;
  };
  isVerified: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  isCurrently: boolean;
  grade?: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  isCurrently: boolean;
  description: string;
}

// Apprenticeship Types
export interface Apprenticeship {
  _id: string;
  companyId: string;
  jobTitle: string;
  description: string;
  industry: string;
  location: {
    city: string;
    address: string;
    coordinates: [number, number];
  };
  requirements: string[];
  responsibilities: string[];
  duration: {
    years: number;
    months: number;
  };
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  benefits: string[];
  applicationDeadline?: string;
  startDate?: string;
  isActive: boolean;
  thumbnailImage?: string;
  applicationCount: number;
  viewCount: number;
  swipeStats: {
    totalSwipes: number;
    rightSwipes: number;
    leftSwipes: number;
  };
  createdAt: string;
  updatedAt: string;
  // Enhanced fields for frontend
  company?: {
    name: string;
    logo?: string;
  };
  formattedSalary?: string;
  formattedDuration?: string;
  conversionRate?: number;
  distance?: number;
}

export interface ApprenticeshipDiscoverParams {
  lat?: number;
  lng?: number;
  maxDistance?: number;
  industries?: string;
  salaryMin?: number;
  salaryMax?: number;
  limit?: number;
  offset?: number;
}

export interface ApprenticeshipDiscoverResponse {
  apprenticeships: Apprenticeship[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: {
    industries: string[];
    maxDistance: number;
    salaryRange: { min?: number; max?: number };
  };
}

export interface SwipeRequest {
  direction: "left" | "right";
  studentLocation?: {
    lat: number;
    lng: number;
  };
}

export interface SwipeResponse {
  message: string;
  match: boolean;
  matchScore?: number;
  apprenticeship?: {
    id: string;
    jobTitle: string;
    company: string;
  };
}

// Application Types
export interface Application {
  _id: string;
  studentId: string;
  apprenticeshipId: string;
  companyId: string;
  status:
    | "applied"
    | "viewed"
    | "shortlisted"
    | "interview_scheduled"
    | "rejected"
    | "accepted";
  coverLetter?: string;
  cvUrl?: string;
  aiMatchScore: number;
  studentVideoUrl?: string;
  companyNotes?: string;
  interviewDetails?: {
    scheduledDate: string;
    meetingUrl: string;
    interviewerNotes?: string;
    studentFeedback?: string;
  };
  swipeDirection: "right" | "left";
  appliedAt: string;
  updatedAt: string;
  // Enhanced fields
  student?: {
    name: string;
    email: string;
    location?: string;
    skills: string[];
    videoProfile?: any;
    cvUrl?: string;
  };
  apprenticeship?: {
    jobTitle: string;
    company?: string;
    location?: string;
    salary?: string;
    id?: string;
  };
  formattedDate?: string;
  daysAgo?: number;
  statusColor?: string;
}

export interface ApplicationsResponse {
  applications: Application[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  statusCounts?: {
    applied: number;
    viewed: number;
    shortlisted: number;
    interview_scheduled: number;
    rejected: number;
    accepted: number;
  };
}

// Messaging Types
export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  messageType: "text" | "file" | "video" | "image";
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
  // Enhanced fields
  isOwn?: boolean;
  formattedTime?: string;
  formattedDate?: string;
}

export interface Conversation {
  _id: string;
  participants: string[];
  applicationId?: string;
  lastMessage?: {
    content: string;
    sentAt: string;
    senderId: string;
    timeAgo?: string;
  };
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Enhanced fields
  otherParticipant?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  totalUnread: number;
}

export interface MessagesResponse {
  messages: Message[];
  conversation: {
    id: string;
    participants: string[];
    applicationId?: string;
  };
  hasMore: boolean;
}

// Analytics Types
export interface DashboardAnalytics {
  overview: {
    activeListings: number;
    totalApplications: number;
    newApplicationsThisWeek: number;
    interviewsScheduled: number;
    hiredCandidates: number;
    averageTimeToHire: number;
    conversionRate: number;
    responseRate: number;
  };
  applications: {
    weekly: Array<{ week: string; applications: number; swipes: number }>;
    byStatus: Array<{ status: string; count: number; percentage: number }>;
    byIndustry: Array<{ industry: string; count: number; percentage: number }>;
  };
  listings: {
    performance: Array<{
      id: string;
      jobTitle: string;
      applications: number;
      views: number;
      swipes: number;
      conversionRate: number;
      applicationRate: number;
      createdAt: string;
    }>;
    topPerforming: {
      mostApplications: string;
      highestConversion: string;
      mostViewed: string;
    };
  };
  demographics: {
    ageGroups: Array<{ range: string; count: number; percentage: number }>;
    locations: Array<{ city: string; count: number; percentage: number }>;
    topSkills: Array<{ skill: string; count: number }>;
  };
  trends: {
    applicationTrend: Array<{ date: string; value: number; label: string }>;
    swipeTrend: Array<{ date: string; value: number; label: string }>;
    conversionTrend: Array<{ date: string; value: number; label: string }>;
  };
  benchmarks: {
    industryAverage: {
      conversionRate: number;
      averageApplications: number;
      timeToHire: number;
    };
    yourPerformance: {
      conversionRate: number;
      averageApplications: number;
      timeToHire: number;
    };
    percentileRank: number;
  };
}

// Upload Types
export interface UploadResponse {
  message: string;
  video?: {
    url: string;
    thumbnailUrl: string;
    cloudinaryId: string;
    duration: number;
    size: number;
  };
  image?: {
    url: string;
    cloudinaryId: string;
    size: number;
  };
  cv?: {
    url: string;
    key: string;
    filename: string;
    size: number;
    mimeType: string;
  };
  logo?: {
    url: string;
    cloudinaryId: string;
    size: number;
  };
  attachment?: {
    type: string;
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  };
  uploadedAt: string;
}

// Statistics Types
export interface UserStats {
  userId: string;
  stats: {
    totalSwipes?: number;
    rightSwipes?: number;
    leftSwipes?: number;
    matches?: number;
    activeConversations?: number;
    profileViews?: number;
    cvDownloads?: number;
    interviewsScheduled?: number;
    swipeAccuracy?: number;
    responseRate?: number;
    // Company stats
    activeListings?: number;
    totalApplications?: number;
    newApplicationsThisWeek?: number;
    hiredCandidates?: number;
    averageTimeToHire?: number;
    topPerformingListing?: string;
    conversionRate?: number;
  };
}

// Error Types
export interface ApiError {
  error: string;
  details?: any;
  stack?: string;
}

// Success Response
export interface ApiSuccess<T = any> {
  message: string;
  data?: T;
  timestamp?: string;
}

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginationResponse {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Legacy types for backward compatibility
export interface DemoResponse {
  message: string;
  timestamp: string;
  data: any;
}

// Industry constants
export const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Engineering",
  "Marketing",
  "Education",
  "Manufacturing",
  "Retail",
  "Construction",
  "Hospitality",
  "Other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

// Application status constants
export const APPLICATION_STATUSES = [
  "applied",
  "viewed",
  "shortlisted",
  "interview_scheduled",
  "rejected",
  "accepted",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// API endpoint constants
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  REFRESH: "/api/auth/refresh",
  FORGOT_PASSWORD: "/api/auth/forgot-password",
  VERIFY_EMAIL: "/api/auth/verify-email",

  // User
  PROFILE: "/api/users/profile",
  PROFILE_VIDEO: "/api/users/profile/video",
  GENERATE_CV: "/api/users/profile/generate-cv",
  USER_STATS: "/api/users/stats",
  DELETE_ACCOUNT: "/api/users/account",
  EXPORT_DATA: "/api/users/export",

  // Apprenticeships
  DISCOVER: "/api/apprenticeships/discover",
  SWIPE: "/api/apprenticeships/{id}/swipe",
  MY_LISTINGS: "/api/apprenticeships/my-listings",
  CREATE_LISTING: "/api/apprenticeships",
  UPDATE_LISTING: "/api/apprenticeships/{id}",
  DELETE_LISTING: "/api/apprenticeships/{id}",

  // Applications
  MY_APPLICATIONS: "/api/applications/my-applications",
  RECEIVED_APPLICATIONS: "/api/applications/received",
  UPDATE_STATUS: "/api/applications/{id}/status",
  SCHEDULE_INTERVIEW: "/api/applications/{id}/schedule-interview",
  APPLICATION_DETAILS: "/api/applications/{id}",

  // Messages
  CONVERSATIONS: "/api/messages/conversations",
  MESSAGES: "/api/messages/conversations/{conversationId}/messages",
  SEND_MESSAGE: "/api/messages/conversations/{conversationId}/messages",
  CREATE_CONVERSATION: "/api/messages/conversations",
  MARK_READ: "/api/messages/conversations/{conversationId}/read",

  // Analytics
  DASHBOARD_ANALYTICS: "/api/analytics/dashboard",
  LISTING_ANALYTICS: "/api/analytics/listings/{listingId}",
  EXPORT_ANALYTICS: "/api/analytics/export",

  // Upload
  UPLOAD_VIDEO: "/api/upload/video-profile",
  UPLOAD_PICTURE: "/api/upload/profile-picture",
  UPLOAD_CV: "/api/upload/cv",
  UPLOAD_LOGO: "/api/upload/company-logo",
  UPLOAD_ATTACHMENT: "/api/upload/message-attachment",
  DELETE_FILE: "/api/upload/files/{fileId}",
  UPLOAD_STATS: "/api/upload/stats",
} as const;
