import { Link } from "react-router-dom";
import {
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";

export function WebFooter() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div>
              <span className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-cyan-300 via-orange-400 to-pink-500 bg-clip-text text-transparent">
                  Apprentice
                </span>
                <span className="bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Apex
                </span>
              </span>
            </div>
            <p className="text-gray-300 text-sm">
              Connecting candidates with apprenticeship opportunities through
              AI-powered matching. Building the future workforce, one apprentice
              at a time
            </p>
            <div className="flex space-x-4">
              <button
                disabled
                className="text-gray-400 cursor-not-allowed opacity-50"
                title="Coming Soon"
              >
                <Facebook className="h-5 w-5" />
              </button>
              <button
                disabled
                className="text-gray-400 cursor-not-allowed opacity-50"
                title="Coming Soon"
              >
                <Twitter className="h-5 w-5" />
              </button>
              <a
                href="https://www.linkedin.com/company/apprenticeapex"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-all duration-200 hover:scale-110"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <button
                disabled
                className="text-gray-400 cursor-not-allowed opacity-50"
                title="Coming Soon"
              >
                <Instagram className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* For Candidates */}
          <div className="space-y-4">
            <h3 className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent font-bold">
              For Candidates
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/candidate/signup"
                  className="text-gray-300 hover:text-orange-400 transition-all duration-200 text-sm hover:scale-105 inline-block"
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link
                  to="/candidate/signin"
                  className="text-gray-300 hover:text-orange-400 transition-all duration-200 text-sm hover:scale-105 inline-block"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-300 hover:text-orange-400 transition-all duration-200 text-sm hover:scale-105 inline-block"
                >
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* For Employers */}
          <div className="space-y-4">
            <h3 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-bold">
              For Employers
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/company"
                  className="text-gray-300 hover:text-cyan-400 transition-all duration-200 text-sm hover:scale-105 inline-block"
                >
                  Company Portal
                </Link>
              </li>
              <li>
                <Link
                  to="/for-employers"
                  className="text-gray-300 hover:text-cyan-400 transition-all duration-200 text-sm hover:scale-105 inline-block"
                >
                  Post Opportunities
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-gray-300 hover:text-cyan-400 transition-all duration-200 text-sm hover:scale-105 inline-block"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-4">
            <h3 className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent font-bold">
              Contact & Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/contact"
                  className="text-gray-300 hover:text-purple-400 transition-all duration-200 text-sm hover:scale-105 inline-block"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-300 hover:text-purple-400 transition-all duration-200 text-sm hover:scale-105 inline-block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-300 hover:text-purple-400 transition-all duration-200 text-sm hover:scale-105 inline-block"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-gray-300 hover:text-purple-400 transition-all duration-200 text-sm hover:scale-105 inline-block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-gray-300 hover:text-purple-400 transition-all duration-200 text-sm hover:scale-105 inline-block"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/cookie-policy"
                  className="text-gray-300 hover:text-purple-400 transition-all duration-200 text-sm hover:scale-105 inline-block"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t border-white/10 py-8">
          <div className="flex justify-center">
            <div className="flex items-center space-x-3">
              <Mail className="h-6 w-6 text-orange-400" />
              <div>
                <p className="text-white text-sm font-medium">Email</p>
                <p className="text-gray-300 text-sm">
                  hello@apprenticeapex.co.uk
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2025 ApprenticeApex. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link
                to="/acceptable-use"
                className="text-gray-300 hover:text-green-400 transition-all duration-200 text-sm hover:scale-105"
              >
                Accessibility
              </Link>
              <Link
                to="/privacy-policy"
                className="text-gray-300 hover:text-green-400 transition-all duration-200 text-sm hover:scale-105"
              >
                Data Protection
              </Link>
              <Link
                to="/acceptable-use"
                className="text-gray-300 hover:text-green-400 transition-all duration-200 text-sm hover:scale-105"
              >
                Acceptable Use
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
