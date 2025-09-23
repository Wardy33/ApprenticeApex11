import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Building2 } from "lucide-react";
import { WebLayout } from "../components/WebLayout";
import { SEOHead } from "../components/SEOHead";
import { apiClient } from "../lib/apiUtils";

export default function CompanyForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call the forgot password API endpoint
      const response = await apiClient.request("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          role: "company",
        }),
      });

      if (!response.error) {
        setSubmitted(true);
      } else {
        setError(
          response.error.error || "Failed to send reset email. Please try again.",
        );
      }
    } catch (err) {
      setError("Unable to send reset email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const seoConfig = {
    title: "Reset Your Company Password | ApprenticeApex",
    description:
      "Reset your ApprenticeApex company account password. Enter your email to receive password reset instructions.",
    keywords:
      "password reset, forgot password, company account, employer, ApprenticeApex",
    canonical: "/company/forgot-password",
  };

  return (
    <WebLayout>
      <SEOHead {...seoConfig} />

      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            {/* Back Link */}
            <Link
              to="/company/signin"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>

            {!submitted ? (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="h-8 w-8 text-blue-400" />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Forgot Your Password?
                  </h1>
                  <p className="text-gray-300">
                    No problem! Enter your company account email address and
                    we'll send you instructions to reset your password.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Company Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your company email address"
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    {loading ? "Sending..." : "Send Reset Instructions"}
                  </button>
                </form>

                {/* Additional Help */}
                <div className="mt-6 text-center">
                  <p className="text-gray-400 text-sm">
                    Remember your password?{" "}
                    <Link
                      to="/company/signin"
                      className="text-pink-400 hover:underline"
                    >
                      Sign in here
                    </Link>
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Need help?{" "}
                    <Link
                      to="/contact"
                      className="text-pink-400 hover:underline"
                    >
                      Contact support
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <Mail className="h-8 w-8 text-green-400" />
                  </div>

                  <h1 className="text-3xl font-bold text-white mb-4">
                    Check Your Email
                  </h1>

                  <p className="text-gray-300 mb-6">
                    We've sent password reset instructions to{" "}
                    <span className="text-pink-400 font-semibold">{email}</span>
                  </p>

                  <div className="bg-blue-500/20 border border-blue-500 rounded-xl p-4 mb-6">
                    <p className="text-blue-200 text-sm">
                      <strong>Didn't receive the email?</strong> Check your spam
                      folder or{" "}
                      <button
                        onClick={() => {
                          setSubmitted(false);
                          setEmail("");
                        }}
                        className="text-pink-400 hover:underline"
                      >
                        try again
                      </button>
                    </p>
                  </div>

                  <Link
                    to="/company/signin"
                    className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
