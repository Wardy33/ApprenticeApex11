import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { WebLayout } from "../components/WebLayout";
import { Home, Building2, User, Search } from "lucide-react";
import { routeMonitor } from "../utils/routeMonitoring";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log the error using our monitoring system
    routeMonitor.logError(location.pathname);
  }, [location.pathname]);

  // Get suggestions from route monitor and convert to UI format
  const getSuggestions = (path: string) => {
    const monitorSuggestions = routeMonitor.getSuggestions(path);
    const suggestions = [];

    // Convert monitor suggestions to UI format
    monitorSuggestions.forEach((route) => {
      if (route.includes("/company")) {
        if (route.includes("signin")) {
          suggestions.push({
            to: route,
            label: "Company Sign In",
            icon: Building2,
          });
        } else if (route.includes("signup")) {
          suggestions.push({
            to: route,
            label: "Company Sign Up",
            icon: Building2,
          });
        } else {
          suggestions.push({
            to: route,
            label: "Company Portal",
            icon: Building2,
          });
        }
      } else if (route.includes("/candidate")) {
        if (route.includes("signin")) {
          suggestions.push({
            to: route,
            label: "Candidate Sign In",
            icon: User,
          });
        } else if (route.includes("signup")) {
          suggestions.push({
            to: route,
            label: "Candidate Sign Up",
            icon: User,
          });
        } else {
          suggestions.push({
            to: route,
            label: "Candidate Portal",
            icon: User,
          });
        }
      }
    });

    // Fallback suggestions if no monitor suggestions
    if (suggestions.length === 0) {
      if (
        path.toLowerCase().includes("company") ||
        path.toLowerCase().includes("employer")
      ) {
        suggestions.push(
          { to: "/company/signin", label: "Company Sign In", icon: Building2 },
          { to: "/company/signup", label: "Company Sign Up", icon: Building2 },
          { to: "/for-employers", label: "For Employers", icon: Building2 },
        );
      }

      if (
        path.toLowerCase().includes("candidate") ||
        path.toLowerCase().includes("student")
      ) {
        suggestions.push(
          { to: "/candidate/signin", label: "Candidate Sign In", icon: User },
          { to: "/candidate/signup", label: "Candidate Sign Up", icon: User },
        );
      }

      if (path.toLowerCase().includes("auth") && suggestions.length === 0) {
        suggestions.push(
          { to: "/company/signin", label: "Company Sign In", icon: Building2 },
          { to: "/candidate/signin", label: "Candidate Sign In", icon: User },
        );
      }
    }

    return suggestions;
  };

  const suggestions = getSuggestions(location.pathname);

  return (
    <WebLayout>
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="text-center max-w-2xl mx-auto px-6">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            404
          </h1>
          <p className="text-xl text-gray-300 mb-2">Oops! Page not found</p>
          <p className="text-sm text-gray-400 mb-8">
            The page{" "}
            <code className="bg-gray-800 px-2 py-1 rounded text-orange-400">
              {location.pathname}
            </code>{" "}
            doesn't exist.
          </p>

          {suggestions.length > 0 && (
            <div className="mb-8">
              <p className="text-gray-300 mb-4">
                Were you looking for one of these?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {suggestions.map((suggestion, index) => {
                  const IconComponent = suggestion.icon;
                  return (
                    <Link
                      key={index}
                      to={suggestion.to}
                      className="flex items-center justify-center px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-700/50 hover:border-orange-400 transition-all duration-200 text-gray-300 hover:text-white"
                    >
                      <IconComponent className="h-4 w-4 mr-2" />
                      {suggestion.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-400 via-pink-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-500 hover:to-red-600 transition-all duration-200 hover:scale-105 shadow-xl border border-white/20"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Link>
              <Link
                to="/browse-apprenticeships"
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 transition-all duration-200 border border-gray-600"
              >
                <Search className="h-4 w-4 mr-2" />
                Browse Apprenticeships
              </Link>
            </div>

            <div className="text-xs text-gray-500">
              If you believe this is an error, please contact support.
            </div>
          </div>
        </div>
      </div>
    </WebLayout>
  );
};

export default NotFound;
