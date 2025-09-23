import { Link } from "react-router-dom";
import {
  Smartphone,
  Building2,
  Zap,
  Users,
  Video,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
} from "lucide-react";
import { WebLayout } from "../components/WebLayout";
import { SEOHead, seoConfigs } from "../components/SEOHead";

export default function Index() {
  return (
    <WebLayout>
      <SEOHead {...seoConfigs.home} />
      <div className="bg-gradient-to-br from-black via-gray-900 to-black min-h-screen">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          {/* Header */}
          <header className="text-center mb-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-pink-500 to-blue-500 opacity-20 blur-3xl rounded-full"></div>
            <h1 className="hero-text text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 relative z-10">
              <span className="bg-gradient-to-r from-cyan-300 via-orange-400 to-pink-500 bg-clip-text text-transparent">
                Apprentice
              </span>
              <span className="bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Apex
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto relative z-10 font-medium">
              The revolutionary platform connecting students with apprenticeship
              opportunities through AI-powered matching
            </p>
          </header>

          {/* Animated Student App Demo */}
          <div className="max-w-6xl mx-auto mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                See How It Works
              </h2>
              <p className="text-gray-300 text-lg">
                Watch students swipe through opportunities in real-time
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-center">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-24 h-36 sm:w-20 sm:h-32 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl mx-auto mb-4 p-3 transform rotate-12 hover:rotate-0 transition-all duration-300 shadow-2xl border border-white/20 touch-target">
                  <div className="bg-white/90 rounded-xl h-full flex flex-col justify-center items-center text-xs">
                    <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mb-1"></div>
                    <div className="text-gray-800 font-bold text-xs leading-tight">
                      Software Dev
                    </div>
                    <div className="text-gray-600 text-xs">£20k</div>
                  </div>
                </div>
                <h3 className="text-white font-bold mb-2">1. Browse Jobs 👀</h3>
                <p className="text-gray-400 text-sm">
                  Swipe through curated apprenticeships
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-20 h-32 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl mx-auto mb-4 p-3 transform -rotate-6 hover:rotate-0 transition-all duration-300 shadow-2xl border border-white/20">
                  <div className="bg-white/90 rounded-xl h-full flex flex-col justify-center items-center text-xs">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full mb-1"></div>
                    <div className="text-gray-800 font-bold text-xs leading-tight">
                      ✓ Match!
                    </div>
                    <div className="text-green-600 text-xs">92% fit</div>
                  </div>
                </div>
                <h3 className="text-white font-bold mb-2">2. Get Matched</h3>
                <p className="text-gray-400 text-sm">
                  AI finds your perfect fit
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-20 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 p-3 transform rotate-6 hover:rotate-0 transition-all duration-300 shadow-2xl border border-white/20">
                  <div className="bg-white/90 rounded-xl h-full flex flex-col justify-center items-center text-xs">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-cyan-400 rounded-full mb-1"></div>
                    <div className="text-gray-800 font-bold text-xs leading-tight">
                      Interview
                    </div>
                    <div className="text-blue-600 text-xs leading-tight">
                      Tomorrow 2PM
                    </div>
                  </div>
                </div>
                <h3 className="text-white font-bold mb-2">3. Start Career</h3>
                <p className="text-gray-400 text-sm">
                  Begin your apprenticeship journey
                </p>
              </div>
            </div>
          </div>

          {/* Main Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto mb-16">
            {/* Student App Card */}
            <div className="group">
              <div className="rounded-3xl p-6 md:p-8 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-red-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <Smartphone className="h-10 w-10 text-white mr-3" />
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                      Student App
                    </h2>
                  </div>
                  <p className="text-white/90 mb-6">
                    Swipe through apprenticeship opportunities, create
                    AI-powered CVs, and connect with companies
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div className="flex items-center text-white/80">
                      <Zap className="h-4 w-4 mr-2" />
                      Tinder-like Swiping
                    </div>
                    <div className="flex items-center text-white/80">
                      <Video className="h-4 w-4 mr-2" />
                      Video Profiles
                    </div>
                    <div className="flex items-center text-white/80">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Real-time Chat
                    </div>
                    <div className="flex items-center text-white/80">
                      <Users className="h-4 w-4 mr-2" />
                      AI-Generated CVs
                    </div>
                  </div>
                  <div className="button-group flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/candidate/signup"
                      className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-xl text-center transition-all duration-200 hover:scale-105 shadow-lg touch-target min-h-[44px]"
                    >
                      Sign Up
                    </Link>
                    <Link
                      to="/candidate/signin"
                      className="flex-1 border-2 border-white text-white font-bold py-3 px-4 rounded-xl text-center hover:bg-white/20 transition-all duration-200 hover:scale-105 touch-target min-h-[44px]"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Portal Card */}
            <div className="group">
              <div className="rounded-3xl p-8 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 border border-white/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <Building2 className="h-10 w-10 text-white mr-3" />
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                      Company Portal
                    </h2>
                  </div>
                  <p className="text-white/90 mb-6 font-medium">
                    Manage apprenticeship listings, review applications, and
                    track analytics in your dashboard
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div className="flex items-center text-white/80">
                      <Building2 className="h-4 w-4 mr-2" />
                      Listing Management
                    </div>
                    <div className="flex items-center text-white/80">
                      <Users className="h-4 w-4 mr-2" />
                      Candidate Review
                    </div>
                    <div className="flex items-center text-white/80">
                      <Zap className="h-4 w-4 mr-2" />
                      Analytics Dashboard
                    </div>
                    <div className="flex items-center text-white/80">
                      <Video className="h-4 w-4 mr-2" />
                      Video Interviews
                    </div>
                  </div>
                  <div className="button-group flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/company/signup"
                      className="flex-1 bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-[#0A0E27] font-bold py-3 px-4 rounded-xl text-center transition-all duration-200 hover:scale-105 shadow-lg touch-target min-h-[44px]"
                    >
                      Sign Up
                    </Link>
                    <Link
                      to="/company/signin"
                      className="flex-1 border-2 border-white text-white font-bold py-3 px-4 rounded-xl text-center hover:bg-white/20 transition-all duration-200 hover:scale-105 touch-target min-h-[44px]"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-orange-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
              Platform Features
            </h3>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-xl border border-white/20">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-2 text-white">
                  AI-Powered Matching
                </h4>
                <p className="text-gray-300">
                  Smart algorithms match students with perfect apprenticeship
                  opportunities
                </p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-xl border border-white/20">
                  <Video className="h-10 w-10 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-2 text-white">
                  Video Integration 📹
                </h4>
                <p className="text-gray-300">
                  30-second profiles and seamless video interviews
                </p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-xl border border-white/20">
                  <MessageCircle className="h-10 w-10 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-2 text-white">
                  Real-time Communication
                </h4>
                <p className="text-gray-300">
                  Instant messaging powered by Sendbird for seamless connections
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="py-16 rounded-3xl mt-16 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-white/10">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-orange-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                Our Platform Vision
              </h3>
              <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                <div className="group text-center touch-target p-4">
                  <div className="text-3xl md:text-4xl font-bold text-[#00D4FF] mb-2 group-hover:scale-110 transition-transform duration-200">
                    1,000+
                  </div>
                  <div className="text-gray-300 text-sm font-medium">
                    Students to Impact
                  </div>
                </div>
                <div className="group text-center touch-target p-4">
                  <div className="text-3xl md:text-4xl font-bold text-[#00D4FF] mb-2 group-hover:scale-110 transition-transform duration-200">
                    £20,000+
                  </div>
                  <div className="text-gray-300 text-sm font-medium">
                    Average Starting Salary Goal
                  </div>
                </div>
                <div className="group text-center touch-target p-4">
                  <div className="text-3xl md:text-4xl font-bold text-[#00D4FF] mb-2 group-hover:scale-110 transition-transform duration-200">
                    90%
                  </div>
                  <div className="text-gray-300 text-sm font-medium">
                    Placement Success Rate
                  </div>
                </div>
                <div className="group text-center touch-target p-4">
                  <div className="text-3xl md:text-4xl font-bold text-[#00D4FF] mb-2 group-hover:scale-110 transition-transform duration-200">
                    Zero
                  </div>
                  <div className="text-gray-300 text-sm font-medium">
                    Cost to Students
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="rounded-3xl p-8 md:p-12 text-center mt-16 bg-gradient-to-br from-orange-400 via-pink-500 to-blue-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <h3 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                Ready to Start Your Apprenticeship Journey?
              </h3>
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto font-medium">
                Join thousands of students who have found their perfect
                apprenticeship match. Get started today and take the first step
                towards your career
              </p>
              <div className="button-group flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/candidate/signup"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#00D4FF] text-[#0A0E27] font-bold rounded-xl hover:bg-[#00D4FF]/90 transition-all duration-200 hover:scale-105 touch-target min-h-[48px]"
                >
                  Sign Up as Student
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/for-employers"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-[#00D4FF] text-[#00D4FF] font-bold rounded-xl hover:bg-[#00D4FF]/10 transition-all duration-200 hover:scale-105 touch-target min-h-[48px]"
                >
                  Post Opportunities
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
