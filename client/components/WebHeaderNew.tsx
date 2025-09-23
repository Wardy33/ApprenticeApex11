import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { SignInModal } from "./SignInModal";

export function WebHeaderNew() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const location = useLocation();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Handle keyboard navigation for mobile menu and modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsSignInModalOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="backdrop-blur-md border-b sticky top-0 z-50 bg-gradient-to-r from-black via-gray-900 to-black border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center group"
            aria-label="ApprenticeApex Home"
          >
            <span className="text-2xl font-bold text-white transform group-hover:scale-105 transition-all duration-200">
              <span className="text-pink-500">Apprentice</span>
              <span className="text-pink-500">Apex</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center space-x-8"
            role="navigation"
            aria-label="Main navigation"
          >
            <Link
              to="/"
              className={`text-sm font-medium transition-all duration-200 hover:scale-105 px-4 py-3 rounded-xl min-h-[44px] flex items-center ${
                isActive("/")
                  ? "bg-pink-500 text-white"
                  : "text-white hover:bg-white/10"
              }`}
              aria-current={isActive("/") ? "page" : undefined}
              aria-label="Home page"
            >
              Home
            </Link>

            <Link
              to="/search-jobs"
              className={`text-sm font-medium transition-all duration-200 hover:scale-105 px-3 py-2 rounded-xl focus-indicator ${
                isActive("/search-jobs")
                  ? "bg-orange-500 text-white"
                  : "text-white hover:bg-white/10"
              }`}
              aria-current={isActive("/search-jobs") ? "page" : undefined}
              aria-label="Search apprenticeship jobs"
            >
              Search Jobs
            </Link>

            <Link
              to="/for-employers"
              className={`text-sm font-medium transition-all duration-200 hover:scale-105 px-3 py-2 rounded-xl focus-indicator ${
                isActive("/for-employers")
                  ? "bg-cyan-500 text-white"
                  : "text-white hover:bg-white/10"
              }`}
              aria-current={isActive("/for-employers") ? "page" : undefined}
              aria-label="Employer information and portal"
            >
              For Employers
            </Link>

            <Link
              to="/about"
              className={`text-sm font-medium transition-all duration-200 hover:scale-105 px-3 py-2 rounded-xl focus-indicator ${
                isActive("/about")
                  ? "bg-purple-500 text-white"
                  : "text-white hover:bg-white/10"
              }`}
              aria-current={isActive("/about") ? "page" : undefined}
              aria-label="About ApprenticeApex"
            >
              About
            </Link>

            <Link
              to="/contact"
              className={`text-sm font-medium transition-all duration-200 hover:scale-105 px-3 py-2 rounded-xl focus-indicator ${
                isActive("/contact")
                  ? "bg-green-500 text-white"
                  : "text-white hover:bg-white/10"
              }`}
              aria-current={isActive("/contact") ? "page" : undefined}
              aria-label="Contact us"
            >
              Contact
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div
            className="hidden md:flex items-center space-x-4"
            role="group"
            aria-label="Account actions"
          >
            <button
              onClick={() => setIsSignInModalOpen(true)}
              className="text-sm font-medium text-white transition-all duration-200 hover:scale-105 px-3 py-2 rounded-xl hover:bg-white/10 focus-indicator"
              aria-label="Sign in to your account"
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignInModalOpen(true)}
              className="text-white px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105 bg-pink-500 hover:bg-pink-600 shadow-lg focus-indicator"
              aria-label="Get started - create your account"
            >
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-white transition-all duration-200 hover:scale-105 hover:bg-white/10 focus-indicator"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={
              isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"
            }
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden py-4 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm border-t border-white/10 rounded-b-xl mx-4"
            id="mobile-menu"
            role="navigation"
            aria-label="Mobile navigation"
            ref={mobileMenuRef}
          >
            <div className="space-y-2" role="list">
              <Link
                to="/"
                className="block px-3 py-3 text-base font-medium text-white rounded-xl transition-all duration-200 hover:bg-pink-500 mx-2 focus-indicator"
                onClick={() => setIsMobileMenuOpen(false)}
                role="listitem"
                aria-current={isActive("/") ? "page" : undefined}
                aria-label="Navigate to home page"
              >
                Home
              </Link>
              <Link
                to="/search-jobs"
                className="block px-3 py-3 text-base font-medium text-white rounded-xl transition-all duration-200 hover:bg-orange-500 mx-2 focus-indicator"
                onClick={() => setIsMobileMenuOpen(false)}
                role="listitem"
                aria-current={isActive("/search-jobs") ? "page" : undefined}
                aria-label="Search apprenticeship jobs"
              >
                Search Jobs
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSignInModalOpen(true);
                }}
                className="block w-full text-left px-3 py-3 text-base font-medium text-white rounded-xl transition-all duration-200 hover:bg-pink-500 mx-2 focus-indicator"
                role="listitem"
                aria-label="Sign in to your account"
              >
                Sign In
              </button>
              <Link
                to="/for-employers"
                className="block px-3 py-3 text-base font-medium text-white rounded-xl transition-all duration-200 hover:bg-cyan-500 mx-2 focus-indicator"
                onClick={() => setIsMobileMenuOpen(false)}
                role="listitem"
                aria-current={isActive("/for-employers") ? "page" : undefined}
                aria-label="Employer information and portal"
              >
                For Employers
              </Link>
              <Link
                to="/about"
                className="block px-3 py-3 text-base font-medium text-white rounded-xl transition-all duration-200 hover:bg-purple-500 mx-2 focus-indicator"
                onClick={() => setIsMobileMenuOpen(false)}
                role="listitem"
                aria-current={isActive("/about") ? "page" : undefined}
                aria-label="About ApprenticeApex"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="block px-3 py-3 text-base font-medium text-white rounded-xl transition-all duration-200 hover:bg-green-500 mx-2 focus-indicator"
                onClick={() => setIsMobileMenuOpen(false)}
                role="listitem"
                aria-current={isActive("/contact") ? "page" : undefined}
                aria-label="Contact us"
              >
                Contact
              </Link>
            </div>
            <div
              className="mt-4 pt-4 border-t border-white/10 mx-2"
              role="group"
              aria-label="Primary actions"
            >
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSignInModalOpen(true);
                }}
                className="block w-full bg-pink-500 hover:bg-pink-600 text-white px-4 py-3 rounded-xl text-center font-bold transition-all duration-200 hover:scale-105 shadow-lg focus-indicator"
                aria-label="Get started - create your account"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </header>
  );
}
