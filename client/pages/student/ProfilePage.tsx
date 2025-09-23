import React from "react";
import { Link } from "react-router-dom";
import {
  User,
  Settings,
  Edit,
  Camera,
  MapPin,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

function ProfilePage() {
  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
      </div>

      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {/* Profile Picture & Basic Info */}
        <div className="bg-white rounded-xl p-6 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-gray-500" />
            </div>
            <Link
              to="/student/change-picture"
              className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
            >
              <Camera className="h-4 w-4" />
            </Link>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Sarah Johnson
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Software Development Student
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              London, UK
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined Jan 2024
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/student/edit-about"
            className="bg-white rounded-xl p-4 hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-6 w-6 text-orange-500 mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Edit About</h3>
            <p className="text-gray-600 text-sm">
              Update your bio and interests
            </p>
          </Link>
          <Link
            to="/student/edit-skills"
            className="bg-white rounded-xl p-4 hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-6 w-6 text-blue-500 mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Skills</h3>
            <p className="text-gray-600 text-sm">
              Manage your skills and experience
            </p>
          </Link>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Contact Information
            </h3>
            <Link
              to="/student/edit-contact"
              className="text-orange-500 hover:text-orange-600 transition-colors"
            >
              <Edit className="h-5 w-5" />
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900">sarah.johnson@email.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900">+44 7123 456789</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900">London, UK</span>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Account Settings
          </h3>
          <div className="space-y-3">
            <Link
              to="/student/account-settings"
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">General Settings</span>
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

export default ProfilePage;
