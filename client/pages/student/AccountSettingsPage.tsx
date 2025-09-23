import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  User,
  Lock,
  Bell,
  Globe,
  Download,
} from "lucide-react";

function AccountSettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="p-6 space-y-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
          <div className="space-y-1">
            <Link
              to="/student/edit-profile-info"
              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-gray-900 font-medium">
                  Personal Information
                </span>
              </div>
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              to="/student/edit-skills-preferences"
              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Settings className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-gray-900 font-medium">
                  Skills & Preferences
                </span>
              </div>
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
          <div className="space-y-1">
            <Link
              to="/student/change-password"
              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <Lock className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-gray-900 font-medium">
                  Change Password
                </span>
              </div>
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Link
              to="/student/privacy-settings"
              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <Settings className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="text-gray-900 font-medium">
                  Privacy Settings
                </span>
              </div>
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Notifications
          </h3>
          <div className="space-y-1">
            <Link
              to="/student/notification-settings"
              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <Bell className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="text-gray-900 font-medium">
                  Push Notifications
                </span>
              </div>
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* App Settings */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            App Settings
          </h3>
          <div className="space-y-1">
            <Link
              to="/student/language-region"
              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                  <Globe className="h-4 w-4 text-cyan-600" />
                </div>
                <span className="text-gray-900 font-medium">
                  Language & Region
                </span>
              </div>
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account</h3>
          <div className="space-y-1">
            <Link
              to="/student/download-data"
              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Download className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-gray-900 font-medium">
                  Download My Data
                </span>
              </div>
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountSettingsPage;
