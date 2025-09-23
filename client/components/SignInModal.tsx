import { Link } from "react-router-dom";
import { X, User, Building2 } from "lucide-react";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container - ensures proper centering and prevents cutoff */}
      <div className="fixed inset-0 flex items-center justify-center p-4 min-h-screen">
        {/* Modal Content */}
        <div className="relative bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Title */}
          <h2
            id="signin-modal-title"
            className="text-xl sm:text-2xl font-bold text-white text-center mb-4 sm:mb-6 mt-2"
          >
            Sign In
          </h2>

          <p className="text-gray-300 text-center mb-6 sm:mb-8 text-sm sm:text-base">
            Choose your account type to continue
          </p>

          {/* Sign In Options */}
          <div className="space-y-3 sm:space-y-4">
            {/* Candidate Sign In */}
            <Link
              to="/candidate/signin"
              onClick={onClose}
              className="flex items-center justify-center w-full p-3 sm:p-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg group"
            >
              <User className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm sm:text-base">
                Candidate Portal
              </span>
            </Link>

            {/* Company Sign In */}
            <Link
              to="/company/signin"
              onClick={onClose}
              className="flex items-center justify-center w-full p-3 sm:p-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg group"
            >
              <Building2 className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm sm:text-base">
                Company Portal
              </span>
            </Link>
          </div>

          {/* Divider */}
          <div className="my-4 sm:my-6 flex items-center">
            <div className="flex-1 border-t border-gray-600" />
            <span className="px-3 sm:px-4 text-gray-400 text-xs sm:text-sm">
              or
            </span>
            <div className="flex-1 border-t border-gray-600" />
          </div>

          {/* Sign Up Links */}
          <div className="text-center">
            <p className="text-gray-400 text-xs sm:text-sm mb-3">
              Don't have an account?
            </p>
            <div className="flex space-x-2 sm:space-x-3">
              <Link
                to="/candidate/signup"
                onClick={onClose}
                className="flex-1 py-2 px-2 sm:px-4 text-xs sm:text-sm text-pink-400 border border-pink-400/30 rounded-lg hover:bg-pink-400/10 transition-colors text-center"
              >
                Candidate Sign Up
              </Link>
              <Link
                to="/company/signup"
                onClick={onClose}
                className="flex-1 py-2 px-2 sm:px-4 text-xs sm:text-sm text-cyan-400 border border-cyan-400/30 rounded-lg hover:bg-cyan-400/10 transition-colors text-center"
              >
                Company Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
