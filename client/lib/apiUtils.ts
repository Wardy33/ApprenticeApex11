// Enhanced API client with proper error handling, loading states, and retry logic
import { AuthResponse, ApiError } from "../../shared/api";
import {
  safeGetFromLocalStorage,
  safeSetToLocalStorage,
  safeRemoveFromLocalStorage,
} from "./safeJsonParse";

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

type ApiResponse<T = any> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: ApiError;
    };

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;

  constructor() {
    // Determine the correct API URL based on environment
    const isProduction = window.location.hostname.includes("fly.dev");
    const isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isProduction) {
      // Use the same domain for API calls in production
      this.baseURL = window.location.origin;
    } else if (isDevelopment) {
      // Use the current origin for development
      this.baseURL = window.location.origin;
    } else {
      // Fallback
      this.baseURL = import.meta.env.VITE_API_URL || window.location.origin;
    }

    console.log("API Client initialized with base URL:", this.baseURL);
    this.timeout = 30000; // Increased to 30 seconds for better reliability
    this.retries = 3;
  }

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.warn("No auth token found in localStorage");
      }
      return token;
    }
    return null;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: ApiRequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      body,
      headers = {},
      timeout = this.timeout,
      retries = this.retries,
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      // Create a fresh AbortController for each attempt
      const controller = new AbortController();
      let timeoutId: NodeJS.Timeout | null = null;

      try {
        // Set up timeout with proper cleanup
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            if (!controller.signal.aborted) {
              controller.abort();
              reject(new Error("Request timeout"));
            }
          }, timeout);
        });

        // Make the fetch request
        const fetchPromise = fetch(url, {
          ...requestConfig,
          signal: controller.signal,
        });

        // Race between fetch and timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        // Clear timeout on successful response
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        // Check if response is ok
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = {
              error: `HTTP ${response.status}: ${response.statusText}`,
            };
          }

          // Handle authentication errors
          if (response.status === 401) {
            this.handleAuthError();
          }

          return {
            data: null,
            error: {
              error:
                errorData.error ||
                `Request failed with status ${response.status}`,
              details: errorData.details,
            },
          };
        }

        // Parse response data
        let data;
        try {
          const responseText = await response.text();
          data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          console.error("Failed to parse response JSON:", parseError);
          return {
            data: null,
            error: {
              error: "Invalid response format from server",
            },
          };
        }

        return { data, error: null };
      } catch (error) {
        // Clean up timeout if it exists
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        lastError = error as Error;

        console.warn(`Request attempt ${attempt + 1} failed:`, {
          url,
          method,
          error: lastError.message,
          attempt: attempt + 1,
          maxRetries: retries + 1,
        });

        // Handle different error types
        if (
          lastError.name === "AbortError" ||
          lastError.message === "Request timeout"
        ) {
          // Timeout error - return immediately, don't retry for timeouts
          return {
            data: null,
            error: {
              error:
                "Request timeout. The server is taking too long to respond. Please try again.",
            },
          };
        }

        // Network errors
        if (
          lastError.message.includes("Failed to fetch") ||
          lastError.message.includes("NetworkError")
        ) {
          // Check if this is the last attempt
          if (attempt === retries) {
            return {
              data: null,
              error: {
                error:
                  "Network error. Please check your internet connection and try again.",
              },
            };
          }
        }

        // Don't retry on client errors (4xx) except for rate limiting
        if (
          lastError.message.includes("4") &&
          !lastError.message.includes("429")
        ) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          const delay = Math.min(Math.pow(2, attempt) * 1000, 5000); // Max 5 second delay
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Return final error after all retries exhausted
    return {
      data: null,
      error: {
        error:
          lastError?.message === "Request timeout"
            ? "Request timeout. Please try again."
            : lastError?.message ||
              "Network error. Please check your connection.",
      },
    };
  }

  private handleAuthError(): void {
    if (typeof window !== "undefined") {
      safeRemoveFromLocalStorage("authToken");
      safeRemoveFromLocalStorage("userProfile");

      // Redirect to appropriate login page based on current path
      if (
        !window.location.pathname.includes("/signin") &&
        !window.location.pathname.includes("/signup")
      ) {
        const currentPath = window.location.pathname;

        if (currentPath.startsWith("/company")) {
          window.location.href = "/company/signin";
        } else if (currentPath.startsWith("/admin")) {
          window.location.href = "/admin";
        } else {
          // Default to candidate signin for all other paths
          window.location.href = "/candidate/signin";
        }
      }
    }
  }

  // Auth methods
  async login(
    email: string,
    password: string,
    role?: "candidate" | "company",
  ): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password, role },
      timeout: 15000, // Longer timeout for login
    });
  }

  async register(userData: {
    email: string;
    password: string;
    role: "candidate" | "company";
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    const response = await this.makeRequest<AuthResponse>(
      "/api/auth/register",
      {
        method: "POST",
        body: userData,
        retries: 2, // Retry up to 2 times for registration
        timeout: 20000, // Longer timeout for registration
      },
    );

    // Handle specific error cases with user-friendly messages
    if (response.error) {
      if (response.error.error.includes("503")) {
        response.error.error =
          "Our servers are temporarily busy. Please try again in a moment.";
      } else if (response.error.error.includes("504")) {
        response.error.error = "Server timeout. Please try again in a moment.";
      } else if (response.error.error.includes("404")) {
        response.error.error =
          "Registration service is currently unavailable. Please try again later.";
      } else if (response.error.error.includes("already exists")) {
        response.error.error =
          "An account with this email already exists. Please try signing in instead.";
      } else if (response.error.error.includes("timeout")) {
        response.error.error =
          "Registration is taking longer than expected. Please try again.";
      }
    }

    return response;
  }

  async companySignup(companyData: any): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>("/api/auth/register/company", {
      method: "POST",
      body: companyData,
      timeout: 20000, // Longer timeout for company signup
    });
  }

  // User methods
  async getProfile(): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/users/profile", {
      timeout: 10000, // Standard timeout for profile
    });
  }

  async updateProfile(profileData: any): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/users/profile", {
      method: "PUT",
      body: profileData,
      timeout: 15000, // Longer timeout for updates
    });
  }

  // Matching methods
  async getJobMatches(): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/matching/jobs", {
      timeout: 15000, // Longer timeout for matching
    });
  }

  async getProfileStatus(): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/matching/profile-status");
  }

  // Apprenticeships methods
  async discoverApprenticeships(params?: any): Promise<ApiResponse<any>> {
    const queryString = params
      ? "?" + new URLSearchParams(params).toString()
      : "";
    return this.makeRequest(`/api/apprenticeships/discover${queryString}`, {
      timeout: 15000, // Longer timeout for discovery
    });
  }

  async swipeApprenticeship(
    id: string,
    direction: "left" | "right",
    candidateLocation?: any,
  ): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/apprenticeships/${id}/swipe`, {
      method: "POST",
      body: { direction, candidateLocation }, // Updated from studentLocation
    });
  }

  // Applications methods
  async getMyApplications(): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/applications/my-applications", {
      timeout: 15000,
    });
  }

  async getReceivedApplications(): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/applications/received", {
      timeout: 15000,
    });
  }

  // Company methods
  async getMyListings(): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/apprenticeships/company/my", {
      timeout: 15000,
    });
  }

  async createListing(listingData: any): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/apprenticeships", {
      method: "POST",
      body: listingData,
      timeout: 20000, // Longer timeout for creation
    });
  }

  async updateListing(id: string, listingData: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/apprenticeships/${id}`, {
      method: "PUT",
      body: listingData,
      timeout: 15000,
    });
  }

  async deleteListing(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/apprenticeships/${id}`, {
      method: "DELETE",
    });
  }

  async getCompanyApplications(params?: any): Promise<ApiResponse<any>> {
    const queryString = params
      ? "?" + new URLSearchParams(params).toString()
      : "";
    return this.makeRequest(`/api/applications${queryString}`, {
      timeout: 15000,
    });
  }

  async getCompanyInterviews(params?: any): Promise<ApiResponse<any>> {
    const queryString = params
      ? "?" + new URLSearchParams(params).toString()
      : "";
    return this.makeRequest(`/api/interviews${queryString}`, {
      timeout: 15000,
    });
  }

  // Analytics methods
  async getDashboardAnalytics(): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/analytics/dashboard", {
      timeout: 15000,
    });
  }

  // Health check method for debugging
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.makeRequest("/api/health", {
      timeout: 5000,
      retries: 1,
    });
  }

  // Generic method for any endpoint
  async request<T>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, options);
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Helper function for localStorage operations
export const storage = {
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("authToken", token);
    }
  },

  getToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  },

  removeToken: () => {
    safeRemoveFromLocalStorage("authToken");
    safeRemoveFromLocalStorage("userProfile");
  },

  setUserProfile: (profile: any) => {
    safeSetToLocalStorage("userProfile", profile);
  },

  getUserProfile: () => {
    return safeGetFromLocalStorage("userProfile", null);
  },
};

// Network status checker
export function checkNetworkStatus(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// Format error messages
export function formatApiError(error: ApiError | string): string {
  if (typeof error === "string") {
    return error;
  }

  return error.error || "An unexpected error occurred";
}

// Retry function with exponential backoff
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// Debug helper for monitoring API calls
export function enableApiDebugging() {
  if (typeof window !== "undefined") {
    (window as any).apiClient = apiClient;
    console.log(
      "API debugging enabled. Use window.apiClient to test API calls.",
    );
  }
}
