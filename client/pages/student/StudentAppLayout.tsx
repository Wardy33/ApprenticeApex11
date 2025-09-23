import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, MessageCircle, User } from "lucide-react";

interface StudentAppLayoutProps {
  children: React.ReactNode;
}

function StudentAppLayout({ children }: StudentAppLayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-around">
          <Link
            to="/student/home"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              isActive("/student/home") || isActive("/student")
                ? "text-orange-600 bg-orange-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Home className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </Link>

          <Link
            to="/student/jobs"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              isActive("/student/jobs")
                ? "text-orange-600 bg-orange-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Search className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Jobs</span>
          </Link>

          <Link
            to="/student/matches"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              isActive("/student/matches")
                ? "text-orange-600 bg-orange-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Heart className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Matches</span>
          </Link>

          <Link
            to="/student/messages"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              isActive("/student/messages")
                ? "text-orange-600 bg-orange-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <MessageCircle className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Messages</span>
          </Link>

          <Link
            to="/student/profile"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              isActive("/student/profile")
                ? "text-orange-600 bg-orange-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <User className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default StudentAppLayout;
