// CRITICAL: Emergency localStorage cleanup MUST run first to prevent app crashes
import "./lib/emergencyLocalStorageCleanup";
// Mute console in production unless debug override is present
import "./lib/muteConsole";

import { StrictMode, Suspense, lazy, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./global.css";
import Index from "./pages/Index";
import { initializeServiceWorker } from "./utils/serviceWorker";
import { enableLazyImages } from "./utils/lazyImages";
import {
  cleanupCorruptedLocalStorage,
  runLocalStorageDiagnostics,
} from "./lib/cleanupLocalStorage";
import ErrorBoundary from "./components/ErrorBoundary";
import { apiDebugger } from "./lib/apiDebugger";
import { diagnostics } from "./utils/diagnostics";
import SeoManager from "./components/SeoManager";
import { initAnalytics } from "./utils/analytics";

// Lazy load components for better performance
const CandidateApp = lazy(() => import("./pages/StudentApp"));
const CompanyPortal = lazy(() => import("./pages/CompanyPortal"));
const CandidateAuth = lazy(() => import("./pages/StudentAuth"));
const CandidateProfileSetup = lazy(() => import("./pages/StudentProfileSetup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Debug = lazy(() => import("./pages/Debug"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const BrowseApprenticeships = lazy(
  () => import("./pages/BrowseApprenticeships"),
);
const SearchJobs = lazy(() => import("./pages/SearchJobs"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const AcceptableUse = lazy(() => import("./pages/legal/AcceptableUse"));
const ForEmployers = lazy(() => import("./pages/ForEmployers"));
const CompanyAuth = lazy(() => import("./pages/CompanyAuth"));
const CandidateForgotPassword = lazy(
  () => import("./pages/CandidateForgotPassword"),
);
const CompanyForgotPassword = lazy(
  () => import("./pages/CompanyForgotPassword"),
);
const AdminApp = lazy(() => import("./pages/admin/AdminApp"));
const AdminLoginSimple = lazy(() => import("./pages/admin/AdminLoginSimple"));

// Loading component for accessibility
function LoadingFallback({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-black"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div className="loading-indicator text-white">
        <div className="loading-spinner" aria-hidden="true"></div>
        <span className="sr-only">Loading {ariaLabel}...</span>
        <span aria-hidden="true" className="ml-2 text-lg font-medium">
          Loading...
        </span>
      </div>
    </div>
  );
}

function App() {
  // Initialize service worker and PWA features
  useEffect(() => {
    try {
      // Clean up corrupted localStorage data that causes JSON parsing errors
      cleanupCorruptedLocalStorage();

      // Run diagnostics in development mode
      if (process.env.NODE_ENV === "development") {
        runLocalStorageDiagnostics();
        apiDebugger.enable();
        console.log(
          "🔧 Debug mode enabled - diagnostic tools available in console",
        );
        console.log(
          "Run: window.diagnostics.quickTest() for a quick health check",
        );
      }

      // Initialize debugging tools if debug mode is requested
      if (
        typeof window !== "undefined" &&
        window.location.search.includes("debug=true")
      ) {
        apiDebugger.enable();
        console.log("🔧 Debug mode enabled via URL parameter");
      }

      // Run a quick connectivity check
      if (typeof navigator !== "undefined" && navigator.onLine) {
        diagnostics.quickTest().catch((error) => {
          console.warn("Initial connectivity check failed:", error);
        });
      }

      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        initializeServiceWorker();
      }
      // Ensure images default to lazy-loading
      enableLazyImages();
      // Initialize analytics only in production with GA id present
      initAnalytics();
    } catch (error) {
      console.warn("App initialization failed:", error);
    }
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/debug"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="Debug page" />}>
                <Debug />
              </Suspense>
            }
          />
          <Route
            path="/about"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="About page" />}>
                <About />
              </Suspense>
            }
          />
          <Route
            path="/contact"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="Contact page" />}>
                <Contact />
              </Suspense>
            }
          />
          <Route
            path="/for-employers"
            element={
              <Suspense
                fallback={<LoadingFallback ariaLabel="Employers page" />}
              >
                <ForEmployers />
              </Suspense>
            }
          />
          <Route
            path="/pricing"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="Pricing page" />}>
                <ForEmployers />
              </Suspense>
            }
          />
          <Route
            path="/browse-apprenticeships"
            element={
              <Suspense
                fallback={
                  <LoadingFallback ariaLabel="Browse apprenticeships" />
                }
              >
                <BrowseApprenticeships />
              </Suspense>
            }
          />
          <Route
            path="/student-resources"
            element={
              <Suspense
                fallback={<LoadingFallback ariaLabel="Student resources" />}
              >
                <BrowseApprenticeships />
              </Suspense>
            }
          />
          <Route
            path="/search-jobs"
            element={
              <Suspense
                fallback={
                  <LoadingFallback ariaLabel="Search apprenticeship jobs" />
                }
              >
                <SearchJobs />
              </Suspense>
            }
          />
          <Route
            path="/apprenticeships/:jobId"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="Job details" />}>
                <JobDetail />
              </Suspense>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <Suspense
                fallback={<LoadingFallback ariaLabel="Privacy policy" />}
              >
                <PrivacyPolicy />
              </Suspense>
            }
          />
          <Route
            path="/terms-of-service"
            element={
              <Suspense
                fallback={<LoadingFallback ariaLabel="Terms of service" />}
              >
                <TermsOfService />
              </Suspense>
            }
          />
          <Route
            path="/cookie-policy"
            element={
              <Suspense
                fallback={<LoadingFallback ariaLabel="Cookie policy" />}
              >
                <CookiePolicy />
              </Suspense>
            }
          />
          <Route
            path="/acceptable-use"
            element={
              <Suspense
                fallback={<LoadingFallback ariaLabel="Acceptable use policy" />}
              >
                <AcceptableUse />
              </Suspense>
            }
          />
          <Route
            path="/candidate/signup"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="Candidate signup" />}>
                <CandidateAuth />
              </Suspense>
            }
          />
          <Route
            path="/candidate/signin"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="Candidate signin" />}>
                <CandidateAuth />
              </Suspense>
            }
          />
          <Route
            path="/candidate/forgot-password"
            element={
              <Suspense
                fallback={
                  <LoadingFallback ariaLabel="Candidate forgot password" />
                }
              >
                <CandidateForgotPassword />
              </Suspense>
            }
          />
          <Route
            path="/candidate/setup-profile"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="Profile setup" />}>
                <CandidateProfileSetup />
              </Suspense>
            }
          />
          <Route
            path="/candidate/*"
            element={
              <Suspense
                fallback={<LoadingFallback ariaLabel="Candidate portal" />}
              >
                <CandidateApp />
              </Suspense>
            }
          />
          <Route
            path="/company/signup"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="Company signup" />}>
                <CompanyAuth />
              </Suspense>
            }
          />
          <Route
            path="/company/signin"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="Company signin" />}>
                <CompanyAuth />
              </Suspense>
            }
          />
          {/* Redirects for common mistyped URLs */}
          <Route path="/CompanyAuth" element={<Navigate to="/company/signin" replace />} />
          <Route path="/companyauth" element={<Navigate to="/company/signin" replace />} />
          <Route path="/company-auth" element={<Navigate to="/company/signin" replace />} />
          <Route path="/Company" element={<Navigate to="/company/signin" replace />} />
          <Route path="/CandidateAuth" element={<Navigate to="/candidate/signin" replace />} />
          <Route path="/StudentAuth" element={<Navigate to="/candidate/signin" replace />} />
          <Route path="/CompanyPortal" element={<Navigate to="/company" replace />} />
          <Route path="/CandidateApp" element={<Navigate to="/candidate" replace />} />
          <Route path="/StudentApp" element={<Navigate to="/candidate" replace />} />
          <Route
            path="/company/forgot-password"
            element={
              <Suspense
                fallback={<LoadingFallback ariaLabel="Company forgot password" />}
              >
                <CompanyForgotPassword />
              </Suspense>
            }
          />
          <Route
            path="/company/*"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="Company portal" />}>
                <CompanyPortal />
              </Suspense>
            }
          />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="Admin panel" />}>
                <AdminApp />
              </Suspense>
            }
          />
          <Route
            path="/admin-test"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="Admin test" />}>
                <AdminLoginSimple />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<LoadingFallback ariaLabel="Page not found" />}>
                <NotFound />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// Initialize React app safely
function initializeApp() {
  const container = document.getElementById("root");
  if (!container) {
    console.error("Root container not found");
    return;
  }

  try {
    // Store root instance globally to prevent recreation during HMR
    let root = (globalThis as any).__reactRoot;

    if (!root) {
      root = createRoot(container);
      (globalThis as any).__reactRoot = root;
    }

    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    console.error("Failed to initialize React app:", error);
    // Fallback: show basic error message
    container.innerHTML =
      '<div style="padding: 20px; color: red;">App failed to load. Please refresh the page.</div>';
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

export default App;
