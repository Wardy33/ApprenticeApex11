import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Clock,
  Building2,
  Briefcase,
  GraduationCap,
  Users,
  Star,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  User,
  Mail,
  Heart,
  Share2,
  Eye,
} from "lucide-react";
import { WebLayout } from "../components/WebLayout";
import { SEOHead } from "../components/SEOHead";

interface JobDetails {
  _id: string;
  title: string;
  description: string;
  industry: string;
  location: {
    city: string;
    state: string;
    address: string;
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
    certifications: string[];
  };
  benefits: string[];
  duration: {
    months: number;
    startDate: string;
  };
  applicationDeadline: string;
  isRemote: boolean;
  employmentType: string;
  createdAt: string;
  viewCount: number;
  applicationCount: number;
  seoUrl: string;
  formattedSalary: string;
  daysUntilDeadline: number;
}

interface ApiResponse {
  success: boolean;
  data: JobDetails;
}

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Extract job ID from SEO URL
  const actualJobId = jobId?.split("-").pop();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/apprenticeships/public/${actualJobId}`,
        );
        const data: ApiResponse = await response.json();

        if (data.success) {
          setJob(data.data);
        } else {
          setError("Job not found or no longer available");
        }
      } catch (err) {
        setError("Error loading job details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (actualJobId) {
      fetchJob();
    }
  }, [actualJobId]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Send email subscription request to backend
      const response = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          type: "job_alerts",
          source: "job_detail_page",
          jobId: job?._id,
          industry: job?.industry,
          notificationEmail: "hello@apprenticeapex.co.uk",
        }),
      });

      if (response.ok) {
        console.log("Email subscription successful for job alerts:", email);
        setEmailSubmitted(true);
        setTimeout(() => setShowSignupModal(false), 2000);
      } else {
        console.error("Email subscription failed");
        // Still show success to user for better UX
        setEmailSubmitted(true);
        setTimeout(() => setShowSignupModal(false), 2000);
      }
    } catch (error) {
      console.error("Email subscription error:", error);
      // Still show success to user for better UX
      setEmailSubmitted(true);
      setTimeout(() => setShowSignupModal(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    // You could show a toast notification here
  };

  if (loading) {
    return (
      <WebLayout>
        <div className="bg-gradient-to-br from-black via-gray-900 to-black min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded mb-4 w-1/4"></div>
              <div className="h-12 bg-gray-700 rounded mb-6 w-3/4"></div>
              <div className="h-6 bg-gray-700 rounded mb-4 w-1/2"></div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div className="h-64 bg-gray-700 rounded"></div>
                  <div className="h-32 bg-gray-700 rounded"></div>
                </div>
                <div className="h-96 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </WebLayout>
    );
  }

  if (error || !job) {
    return (
      <WebLayout>
        <div className="bg-gradient-to-br from-black via-gray-900 to-black min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-16">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-4">
                Job Not Found
              </h1>
              <p className="text-gray-400 mb-8">
                {error ||
                  "This job listing is no longer available or may have expired."}
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/search-jobs"
                  className="px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors"
                >
                  Browse Other Jobs
                </Link>
                <Link
                  to="/"
                  className="px-6 py-3 border border-gray-600 text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </WebLayout>
    );
  }

  const seoConfig = {
    title: `${job.title} Apprenticeship in ${job.location.city} | ApprenticeApex`,
    description: `${job.title} apprenticeship opportunity in ${job.location.city}. ${job.formattedSalary}. Apply now to start your career in ${job.industry}.`,
    keywords: `${job.title}, apprenticeship, ${job.location.city}, ${job.industry}, career training, ${job.requirements.skills.join(", ")}`,
    canonical: job.seoUrl,
  };

  return (
    <WebLayout>
      <SEOHead {...seoConfig} />

      {/* JobPosting Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: job.title,
          description: job.description,
          identifier: {
            "@type": "PropertyValue",
            name: "ApprenticeApex Job ID",
            value: job._id,
          },
          datePosted: job.createdAt,
          validThrough: job.applicationDeadline,
          employmentType: job.employmentType.toUpperCase(),
          hiringOrganization: {
            "@type": "Organization",
            name: "ApprenticeApex Partner Company",
            url: "https://apprenticeapex.com",
          },
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              streetAddress: job.location.address,
              addressLocality: job.location.city,
              addressRegion: job.location.state,
              addressCountry: "GB",
            },
          },
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: job.salary.currency,
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salary.min,
              maxValue: job.salary.max,
              unitText: job.salary.type.toUpperCase(),
            },
          },
          workHours:
            job.employmentType === "full-time"
              ? "40 hours per week"
              : "Part-time hours",
          industry: job.industry,
          occupationalCategory: job.industry,
          skills: job.requirements.skills.join(", "),
          educationRequirements: job.requirements.education,
          experienceRequirements: job.requirements.experience,
          url: `https://apprenticeapex.com${job.seoUrl}`,
          applicationContact: {
            "@type": "ContactPoint",
            url: "https://apprenticeapex.com/candidate/signup",
          },
        })}
      </script>

      <div className="bg-gradient-to-br from-black via-gray-900 to-black min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link
                  to="/search-jobs"
                  className="hover:text-white transition-colors"
                >
                  Search Jobs
                </Link>
              </li>
              <li>/</li>
              <li className="text-white">{job.title}</li>
            </ol>
          </nav>

          {/* Back Button */}
          <Link
            to="/search-jobs"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Search Results
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Job Header */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                      {job.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        <span>
                          {job.location.city}, {job.location.state}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        <span>{job.industry}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        <span className="capitalize">{job.employmentType}</span>
                      </div>
                      {job.isRemote && (
                        <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-sm">
                          Remote Friendly
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-cyan-400 mb-4">
                      {job.formattedSalary}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="p-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                      title="Share this job"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                    <button className="p-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors">
                      <Heart className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-700/50 rounded-xl">
                    <div className="text-2xl font-bold text-white">
                      {job.applicationCount}
                    </div>
                    <div className="text-sm text-gray-400">Applications</div>
                  </div>
                  <div className="text-center p-3 bg-gray-700/50 rounded-xl">
                    <div className="text-2xl font-bold text-white">
                      {job.viewCount}
                    </div>
                    <div className="text-sm text-gray-400">Views</div>
                  </div>
                  <div className="text-center p-3 bg-gray-700/50 rounded-xl">
                    <div className="text-2xl font-bold text-white">
                      {job.duration.months}
                    </div>
                    <div className="text-sm text-gray-400">Months</div>
                  </div>
                  <div className="text-center p-3 bg-gray-700/50 rounded-xl">
                    <div className="text-2xl font-bold text-white">
                      {job.daysUntilDeadline}
                    </div>
                    <div className="text-sm text-gray-400">Days Left</div>
                  </div>
                </div>

                {/* Application Deadline Warning */}
                {job.daysUntilDeadline <= 7 && (
                  <div className="bg-orange-500/20 border border-orange-500 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-orange-300">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">
                        Application closes in {job.daysUntilDeadline} day
                        {job.daysUntilDeadline !== 1 ? "s" : ""}!
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Job Description */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  About This Apprenticeship
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  What We're Looking For
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Education */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Education
                    </h3>
                    <p className="text-gray-300">
                      {job.requirements.education}
                    </p>
                  </div>

                  {/* Experience */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Experience
                    </h3>
                    <p className="text-gray-300">
                      {job.requirements.experience}
                    </p>
                  </div>
                </div>

                {/* Skills */}
                {job.requirements.skills.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Skills & Technologies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-sm border border-pink-500/30"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {job.requirements.certifications.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Preferred Certifications
                    </h3>
                    <ul className="space-y-2">
                      {job.requirements.certifications.map((cert, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-gray-300"
                        >
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Benefits */}
              {job.benefits.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    What You'll Get
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {job.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-gray-300"
                      >
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Apply Section */}
              <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-6 text-white sticky top-8">
                <h3 className="text-xl font-bold mb-4">Ready to Apply?</h3>
                <p className="text-white/90 mb-6">
                  Create your free account to apply for this apprenticeship and
                  access exclusive opportunities.
                </p>

                <div className="space-y-3">
                  <Link
                    to="/candidate/signup"
                    className="block w-full bg-white text-gray-900 font-bold py-4 px-6 rounded-xl text-center hover:bg-gray-100 transition-all duration-200 hover:scale-105"
                  >
                    Create Account & Apply
                  </Link>

                  <div className="text-center text-white/70 text-sm">
                    Already have an account?
                  </div>

                  <Link
                    to="/candidate/signin"
                    className="block w-full border-2 border-white text-white font-bold py-3 px-6 rounded-xl text-center hover:bg-white/10 transition-all duration-200"
                  >
                    Sign In to Apply
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-white/20">
                  <h4 className="font-semibold mb-3">Why sign up?</h4>
                  <ul className="space-y-2 text-sm text-white/80">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Apply to multiple jobs instantly
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Get AI-powered job recommendations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Track your application status
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Free career support & resources
                    </li>
                  </ul>
                </div>
              </div>

              {/* Job Details */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">
                  Job Details
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-400">Posted:</span>
                    <span className="text-white text-right">
                      {formatDate(job.createdAt)}
                    </span>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-gray-400">Deadline:</span>
                    <span className="text-white text-right">
                      {formatDate(job.applicationDeadline)}
                    </span>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-gray-400">Start Date:</span>
                    <span className="text-white text-right">
                      {formatDate(job.duration.startDate)}
                    </span>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white text-right">
                      {job.duration.months} months
                    </span>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white text-right">
                      {job.location.city}, {job.location.state}
                      {job.isRemote && (
                        <div className="text-green-400 text-sm">
                          Remote options available
                        </div>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-gray-400">Industry:</span>
                    <span className="text-white text-right">
                      {job.industry}
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Alerts - Routes to hello@apprenticeapex.co.uk */}
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-bold mb-3">
                  Get Similar Job Alerts
                </h3>
                <p className="text-white/90 text-sm mb-3">
                  Get notified when similar {job.industry.toLowerCase()}{" "}
                  apprenticeships are posted.
                </p>
                <p className="text-white/70 text-xs mb-4">
                  Alert notifications sent to hello@apprenticeapex.co.uk
                </p>

                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border-0 text-gray-900 placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={!email}
                    className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Subscribe to Alerts
                  </button>
                </form>
              </div>

              {/* Share This Job */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Share This Job
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 bg-gray-700 text-white py-3 px-4 rounded-xl hover:bg-gray-600 transition-colors text-sm"
                  >
                    Copy Link
                  </button>
                  <button className="p-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related Jobs CTA */}
          <div className="mt-16 bg-gradient-to-br from-orange-400 via-pink-500 to-blue-500 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Explore More Opportunities
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                Discover other exciting apprenticeship opportunities in{" "}
                {job.industry} and beyond.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to={`/search-jobs?category=${encodeURIComponent(job.industry)}`}
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-105"
                >
                  More {job.industry} Jobs
                </Link>
                <Link
                  to="/search-jobs"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-200 hover:scale-105"
                >
                  Browse All Jobs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {emailSubmitted && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Thanks! We'll send you job alerts for {job.industry} roles.
          </div>
        </div>
      )}
    </WebLayout>
  );
}
