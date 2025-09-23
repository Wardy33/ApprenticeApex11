import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  ArrowRight,
  User,
  Mail,
  Briefcase,
  Clock,
  Calendar,
} from "lucide-react";
import { WebLayout } from "../components/WebLayout";
import { SEOHead } from "../components/SEOHead";

interface Job {
  _id: string;
  title: string;
  description: string;
  shortDescription: string;
  industry: string;
  location: {
    city: string;
    state: string;
  };
  salary: {
    min: number;
    max: number;
    currency: string;
    type: string;
  };
  requirements: {
    education: string;
    experience: string;
    skills: string[];
  };
  keyRequirements: string[];
  applicationDeadline: string;
  isRemote: boolean;
  employmentType: string;
  createdAt: string;
  viewCount: number;
  applicationCount: number;
  seoUrl: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    jobs: Job[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: {
      categories: string[];
      locations: string[];
    };
  };
  message: string;
}

export default function SearchJobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState<number>(0);

  // Search filters
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [selectedLocation, setSelectedLocation] = useState(
    searchParams.get("location") || "all",
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );

  // Available filter options from API
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  // Email subscription state
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const fetchJobsFromAPI = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        _cache_bust: Date.now().toString(),
      });

      if (searchTerm && searchTerm !== "") {
        params.set("search", searchTerm);
      }
      if (selectedCategory && selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }
      if (selectedLocation && selectedLocation !== "all") {
        params.set("location", selectedLocation);
      }

      const apiUrl = `/api/apprenticeships/public?${params.toString()}`;

      // Make the API call with no-cache headers
      const response = await fetch(apiUrl, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error ${response.status}`);
      }

      const responseData: ApiResponse = await response.json();

      if (responseData.success) {
        const jobsFromAPI = responseData.data.jobs || [];
        const totalFromAPI = responseData.data.pagination?.totalItems || 0;
        const categoriesFromAPI = responseData.data.filters?.categories || [];
        const locationsFromAPI = responseData.data.filters?.locations || [];

        setJobs(jobsFromAPI);
        setTotalJobs(totalFromAPI);
        setCategories(categoriesFromAPI);
        setLocations(locationsFromAPI);
        setError(null);
      } else {
        setError(`API Error: ${responseData.message || "Unknown error"}`);
        setJobs([]);
        setTotalJobs(0);
      }
    } catch (fetchError) {
      setError(
        `Network Error: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`,
      );
      setJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchJobsFromAPI();
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (searchTerm) newParams.set("search", searchTerm);
    if (selectedCategory !== "all") newParams.set("category", selectedCategory);
    if (selectedLocation !== "all") newParams.set("location", selectedLocation);
    if (currentPage > 1) newParams.set("page", currentPage.toString());
    setSearchParams(newParams);
  }, [
    searchTerm,
    selectedCategory,
    selectedLocation,
    currentPage,
    setSearchParams,
  ]);

  // Refetch when filters change
  useEffect(() => {
    fetchJobsFromAPI();
  }, [searchTerm, selectedCategory, selectedLocation, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // Handle email subscription
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      const response = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          subscription_type: "job_alerts",
          source: "search_jobs_page",
          notification_email: "hello@apprenticeapex.co.uk",
        }),
      });

      if (response.ok) {
        setEmailSubmitted(true);
        setEmail("");
        setTimeout(() => setEmailSubmitted(false), 3000);
      }
    } catch (error) {
      // Silently handle error for better UX
      setEmailSubmitted(true);
      setEmail("");
      setTimeout(() => setEmailSubmitted(false), 3000);
    }
  };

  const formatSalary = (job: Job) => {
    const currency = job.salary.currency === "GBP" ? "£" : "$";
    return `${currency}${job.salary.min?.toLocaleString()} - ${currency}${job.salary.max?.toLocaleString()} ${job.salary.type}`;
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return days > 0 ? days : 0;
  };

  const seoConfig = {
    title: `Search Apprenticeship Jobs${searchTerm ? ` - ${searchTerm}` : ""} | ApprenticeApex`,
    description: `Find your perfect apprenticeship opportunity. Browse available apprenticeship jobs across different industries and locations.`,
    keywords:
      "apprenticeship jobs, apprentice opportunities, career training, vocational training, entry level jobs",
    canonical: "/search-jobs",
  };

  return (
    <WebLayout>
      <SEOHead {...seoConfig} />

      <div className="bg-gradient-to-br from-black via-gray-900 to-black min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-300 via-orange-400 to-pink-500 bg-clip-text text-transparent">
              Find Your Perfect Apprenticeship
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {loading
                ? "Loading apprenticeship opportunities..."
                : totalJobs > 0
                  ? `Discover ${totalJobs} apprenticeship opportunities from top employers.`
                  : "Be the first to discover new apprenticeship opportunities as they become available."}
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search for apprenticeships, skills, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500"
                >
                  <option value="all">All Industries</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500"
                >
                  <option value="all">All Locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 mb-8">
              <p className="text-red-200">
                Unable to load apprenticeship listings at this time. Please try
                again later.
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mb-4"></div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Loading Apprenticeship Opportunities
              </h3>
              <p className="text-gray-400">
                Searching for the best matches for you...
              </p>
            </div>
          )}

          {/* Jobs Grid */}
          {!loading && jobs.length > 0 && (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Showing {jobs.length} of {totalJobs} Apprenticeship
                  Opportunities
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {jobs.map((job) => (
                  <div
                    key={job._id}
                    className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-pink-500/50 transition-all duration-300 hover:scale-105 group"
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location.city}, {job.location.state}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {job.shortDescription ||
                        job.description?.substring(0, 150) + "..."}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Industry:</span>
                        <span className="text-white">{job.industry}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Salary:</span>
                        <span className="text-white font-medium">
                          {formatSalary(job)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Deadline:</span>
                        <span className="text-white">
                          {getDaysUntilDeadline(job.applicationDeadline)} days
                          left
                        </span>
                      </div>
                    </div>

                    <Link
                      to={job.seoUrl || `/apprenticeships/${job._id}`}
                      className="block w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-4 rounded-xl text-center hover:from-pink-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 group"
                    >
                      View Full Details & Apply
                      <ArrowRight className="inline-block ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Empty State - No Jobs Available */}
          {!loading && jobs.length === 0 && !error && (
            <div className="text-center py-16">
              <Briefcase className="h-24 w-24 text-gray-500 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-white mb-4">
                No Apprenticeships Available Yet
              </h3>
              <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-lg">
                We're working with top employers to bring you exciting
                apprenticeship opportunities. Be the first to know when new
                positions become available!
              </p>

              {/* Email Alert Signup for Empty State */}
              <div className="max-w-md mx-auto">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl p-6 mb-8">
                  <h4 className="text-white font-bold text-xl mb-3 flex items-center justify-center gap-2">
                    <Mail className="h-6 w-6" />
                    Get Notified First
                  </h4>
                  <p className="text-white/90 text-sm mb-4">
                    Join our job alert list and receive an email when new
                    apprenticeship opportunities are posted.
                  </p>

                  {!emailSubmitted ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-3">
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-lg border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white/50"
                      />
                      <button
                        type="submit"
                        disabled={!email}
                        className="w-full bg-white text-blue-600 font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Notify Me of New Jobs
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-white text-lg font-semibold mb-2">
                        ✅ You're All Set!
                      </div>
                      <p className="text-white/90 text-sm">
                        We'll notify you as soon as new apprenticeship
                        opportunities become available.
                      </p>
                    </div>
                  )}

                  <p className="text-white/70 text-xs mt-3 text-center">
                    Notifications sent to hello@apprenticeapex.co.uk
                  </p>
                </div>
              </div>

              {/* Additional CTAs for Empty State */}
              <div className="space-y-4">
                <p className="text-gray-300 text-lg">
                  In the meantime, you can:
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/candidate/signup"
                    className="inline-flex items-center justify-center px-6 py-3 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-all duration-200 hover:scale-105"
                  >
                    <User className="mr-2 h-5 w-5" />
                    Create Your Profile
                  </Link>
                  <Link
                    to="/for-employers"
                    className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-200 hover:scale-105"
                  >
                    For Employers
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Lead Generation CTA Section */}
          <div className="bg-gradient-to-br from-orange-400 via-pink-500 to-blue-500 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {totalJobs > 0
                  ? "Ready to Apply for Your Dream Apprenticeship?"
                  : "Ready to Launch Your Career?"}
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                {totalJobs > 0
                  ? "Create your free account to apply for jobs, upload your CV, and get matched with top employers."
                  : "Create your free profile now and be ready to apply instantly when new apprenticeship opportunities become available."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/candidate/signup"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-105"
                >
                  <User className="mr-2 h-5 w-5" />
                  Create Free Account
                </Link>
                <Link
                  to="/candidate/signin"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-200 hover:scale-105"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
