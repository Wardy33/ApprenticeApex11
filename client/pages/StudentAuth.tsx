import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from "lucide-react";
import { useAuth, useFormSubmission } from "../hooks/useApi";
import { LoadingButton } from "../components/ui/loading";
import { ErrorAlert } from "../components/ui/error-alert";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

function SignUpForm() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const { submit, loading, error, clearError } = useFormSubmission(
    async (data: FormData) => {
      return await register({
        email: data.email,
        password: data.password,
        role: "student",
        firstName: data.firstName,
        lastName: data.lastName,
      });
    },
    {
      onSuccess: () => {
        navigate("/candidate/setup-profile");
      },
      onError: (errorMessage: string) => {
        // Provide user-friendly error messages
        if (errorMessage.includes("503")) {
          console.error(
            "Service temporarily unavailable. Using development mode.",
          );
        } else if (errorMessage.includes("404")) {
          console.error(
            "Registration endpoint not found. Please check your network connection.",
          );
        }
      },
    },
  );

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    clearError();
    await submit(formData);
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center p-4 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={() => navigate("/")}
          className="text-xl font-bold text-white hover:scale-105 transition-all duration-200"
        >
          <span className="text-pink-500">Apprentice</span>
          <span className="text-pink-500">Apex</span>
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-cyan-400 drop-shadow-lg">
              Join ApprenticeApex
            </h2>
            <p className="text-gray-300">
              Create your candidate account to find amazing apprenticeships
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/40 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 backdrop-blur-sm transition-all duration-200"
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/40 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 backdrop-blur-sm transition-all duration-200"
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && (
                  <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/40 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 backdrop-blur-sm transition-all duration-200"
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="w-full pl-10 pr-12 py-3 bg-gray-800/40 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 backdrop-blur-sm transition-all duration-200"
                  placeholder="��•••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
              <div className="mt-2 text-xs text-gray-400">
                Password must be at least 8 characters with:
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>1 uppercase letter (A-Z)</li>
                  <li>1 lowercase letter (a-z)</li>
                  <li>1 number (0-9)</li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className="w-full pl-10 pr-12 py-3 bg-gray-800/40 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 backdrop-blur-sm transition-all duration-200"
                  placeholder="•••••���••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) =>
                    handleInputChange("agreeToTerms", e.target.checked)
                  }
                  className="mt-1 w-4 h-4 border-white/20 rounded focus:ring-orange-500 bg-gray-800/40 text-orange-400"
                />
                <span className="text-sm text-gray-300">
                  I agree to the{" "}
                  <Link
                    to="/terms-of-service"
                    className="hover:underline text-orange-400"
                    target="_blank"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy-policy"
                    className="hover:underline text-orange-400"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.agreeToTerms}
                </p>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <ErrorAlert
                error={error}
                onDismiss={clearError}
                variant="error"
              />
            )}

            {/* Submit Button */}
            <LoadingButton
              type="submit"
              isLoading={loading}
              loadingText="Creating Account..."
              className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-pink-500 hover:bg-pink-600 hover:scale-105 border border-white/20"
            >
              Create Account
            </LoadingButton>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-300">
              Already have an account?{" "}
              <Link
                to="/candidate/signin"
                className="hover:underline font-medium text-orange-400"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const { submit, loading, error, clearError } = useFormSubmission(
    async (data: typeof formData) => {
      return await login(data.email, data.password, "candidate");
    },
    {
      onSuccess: () => {
        navigate("/candidate/home");
      },
    },
  );

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    clearError();
    await submit(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center p-4 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={() => navigate("/")}
          className="text-xl font-bold text-white hover:scale-105 transition-all duration-200"
        >
          <span className="text-pink-500">Apprentice</span>
          <span className="text-pink-500">Apex</span>
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">
              Welcome Back
            </h2>
            <p className="text-gray-300">
              Sign in to continue your apprenticeship journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/40 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 backdrop-blur-sm transition-all duration-200"
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="w-full pl-10 pr-12 py-3 bg-gray-800/40 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 backdrop-blur-sm transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    handleInputChange("rememberMe", e.target.checked)
                  }
                  className="w-4 h-4 border-white/20 rounded focus:ring-orange-500 bg-gray-800/40 text-orange-400"
                />
                <span className="text-sm text-gray-300">Remember me</span>
              </label>
              <Link
                to="/candidate/forgot-password"
                className="text-sm hover:underline text-orange-400"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error Alert */}
            {error && (
              <ErrorAlert
                error={error}
                onDismiss={clearError}
                variant="error"
              />
            )}

            {/* Submit Button */}
            <LoadingButton
              type="submit"
              isLoading={loading}
              loadingText="Signing In..."
              className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-pink-500 hover:bg-pink-600 hover:scale-105 border border-white/20"
            >
              Sign In
            </LoadingButton>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-gray-300">
              Don't have an account?{" "}
              <Link
                to="/candidate/signup"
                className="hover:underline font-medium text-orange-400"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { SignUpForm, SignInForm };

// Default export for lazy loading
export default function CandidateAuth() {
  // Check URL to determine which form to show
  const path = window.location.pathname;
  if (path.includes("/signin")) {
    return <SignInForm />;
  }
  return <SignUpForm />;
}
