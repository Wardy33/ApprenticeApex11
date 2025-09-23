import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { StatusDashboard } from "../components/StatusDashboard";

export default function Debug() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Homepage
          </Link>
          <h1 className="text-3xl font-bold text-cyan-400 drop-shadow-lg">
            ApprenticeApex Debug Dashboard
          </h1>
          <p className="text-gray-300 mt-2">
            System status and feature implementation overview
          </p>
        </div>

        {/* Status Dashboard */}
        <StatusDashboard />

        {/* Quick Links */}
        <div className="mt-8 bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 border border-white/20 rounded-lg shadow-xl backdrop-blur-sm p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Quick Access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/candidate/signup"
              className="block p-4 border rounded-lg hover:bg-white/10 transition-colors"
            >
              <h3 className="font-semibold text-white">Student Signup</h3>
              <p className="text-sm text-gray-300">
                Test enhanced registration flow
              </p>
            </Link>
            <Link
              to="/candidate/signin"
              className="block p-4 border rounded-lg hover:bg-white/10 transition-colors"
            >
              <h3 className="font-semibold text-white">Student Login</h3>
              <p className="text-sm text-gray-300">
                Test authentication system
              </p>
            </Link>
            <Link
              to="/company"
              className="block p-4 border rounded-lg hover:bg-white/10 transition-colors"
            >
              <h3 className="font-semibold text-white">Company Portal</h3>
              <p className="text-sm text-gray-300">
                Mobile-optimized dashboard
              </p>
            </Link>
          </div>
        </div>

        {/* API Information */}
        <div className="mt-8 bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 border border-white/20 rounded-lg shadow-xl backdrop-blur-sm p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            API Information
          </h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-200">Backend URL</h3>
              <p className="text-sm text-gray-300">http://localhost:8080</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-200">Key Endpoints</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>
                  <code className="bg-gray-800/60 px-1 py-0.5 rounded">
                    GET /api/ping
                  </code>{" "}
                  - Health check
                </li>
                <li>
                  <code className="bg-gray-800/60 px-1 py-0.5 rounded">
                    POST /api/auth/register
                  </code>{" "}
                  - User registration
                </li>
                <li>
                  <code className="bg-gray-800/60 px-1 py-0.5 rounded">
                    POST /api/auth/login
                  </code>{" "}
                  - User login
                </li>
                <li>
                  <code className="bg-gray-800/60 px-1 py-0.5 rounded">
                    GET /api/matching/jobs
                  </code>{" "}
                  - Job matching (requires auth)
                </li>
                <li>
                  <code className="bg-gray-800/60 px-1 py-0.5 rounded">
                    GET /api/matching/profile-status
                  </code>{" "}
                  - Profile completion check
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* External Services Status */}
        <div className="mt-8 bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 border border-white/20 rounded-lg shadow-xl backdrop-blur-sm p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            External Services Setup
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-200 mb-2">
                Ready for Integration
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Stripe (Payments) - API keys needed
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Daily.co (Video calls) - API key + domain needed
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  MongoDB - Connection string needed
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Email Service - SMTP config needed
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-200 mb-2">
                Implementation Notes
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• All API clients pre-configured</li>
                <li>• Error handling & retry logic implemented</li>
                <li>• Mobile-responsive design completed</li>
                <li>• Job matching algorithm with percentage scoring</li>
                <li>• Profile completion validation system</li>
                <li>• Enhanced user experience with loading states</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
