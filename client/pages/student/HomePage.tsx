import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  X,
  MapPin,
  Building2,
  Clock,
  Filter,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "../../lib/apiUtils";

interface Application {
  id: string;
  apprenticeshipTitle: string;
  company: string;
  status: "pending" | "reviewing" | "interviewed" | "accepted" | "rejected";
  appliedDate: string;
}

function HomePage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "reviewing":
        return "text-blue-600 bg-blue-100";
      case "interviewed":
        return "text-purple-600 bg-purple-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      case "accepted":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "reviewing":
        return "Under Review";
      case "interviewed":
        return "Interviewed";
      case "rejected":
        return "Rejected";
      case "accepted":
        return "Accepted";
      default:
        return status;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Modern Header Section */}
      <div className="bg-white px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Good morning, Sarah! 👋
            </h1>
            <p className="text-gray-600 text-sm">
              Ready to explore new opportunities?
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Progress Ring */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Profile Completion
              </h3>
              <p className="text-gray-600 text-sm">85% complete</p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-500"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="85, 100"
                  strokeLinecap="round"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900">85%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/student/jobs"
            className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white transition-all duration-200 hover:scale-105"
          >
            <Building2 className="w-6 h-6 mb-2" />
            <h3 className="font-semibold mb-1">Browse Jobs</h3>
            <p className="text-sm opacity-90">Find your perfect match</p>
          </Link>
          <Link
            to="/student/matches"
            className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-4 text-white transition-all duration-200 hover:scale-105"
          >
            <Heart className="w-6 h-6 mb-2" />
            <h3 className="font-semibold mb-1">Your Matches</h3>
            <p className="text-sm opacity-90">3 new matches</p>
          </Link>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Recent Applications
          </h2>
          <Link
            to="/student/applications"
            className="text-blue-600 text-sm font-medium"
          >
            View All
          </Link>
        </div>

        <div className="space-y-4">
          {applications.map((application) => (
            <div
              key={application.id}
              className="bg-white rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">
                  {application.apprenticeshipTitle}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    application.status,
                  )}`}
                >
                  {getStatusText(application.status)}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">
                {application.company}
              </p>
              <p className="text-gray-500 text-xs">
                Applied on{" "}
                {new Date(application.appliedDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
