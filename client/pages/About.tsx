import { Link } from "react-router-dom";
import { Users, Target, Award, Heart, ArrowRight } from "lucide-react";
import { WebLayout } from "../components/WebLayout";
import { SEOHead, seoConfigs } from "../components/SEOHead";

export default function About() {
  return (
    <WebLayout>
      <SEOHead {...seoConfigs.about} />
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-orange-400 to-pink-500 bg-clip-text text-transparent">
              Apprentice
            </span>
            <span className="bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Apex
            </span>
            <span className="text-2xl animate-bounce">✨</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto font-medium">
            We're revolutionizing the apprenticeship landscape by connecting
            ambitious students with forward-thinking employers through
            AI-powered matching technology
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="rounded-2xl p-8 bg-gradient-to-br from-orange-400/20 via-pink-500/20 to-red-500/20 border border-white/20 shadow-xl backdrop-blur-sm group hover:scale-105 transition-all duration-300">
            <Target className="h-12 w-12 text-orange-400" />
            <h2 className="text-2xl font-bold mb-4 text-white">Our Mission</h2>
            <p className="text-gray-300 leading-relaxed">
              To bridge the skills gap in the UK by creating meaningful
              connections between talented students and employers who value
              growth, learning, and innovation. We believe every young person
              deserves the opportunity to build a successful career through
              hands-on experience and mentorship.
            </p>
          </div>

          <div className="rounded-2xl p-8 bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-purple-500/20 border border-white/20 shadow-xl backdrop-blur-sm group hover:scale-105 transition-all duration-300">
            <Award className="h-12 w-12 text-cyan-400" />
            <h2 className="text-2xl font-bold mb-4 text-white">Our Vision</h2>
            <p className="text-gray-300 leading-relaxed">
              To become the UK's leading apprenticeship platform, where every
              match leads to mutual success. We envision a future where
              apprenticeships are the preferred pathway to career success,
              creating a skilled workforce that drives economic growth and
              innovation.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              Our Story
            </h2>
            <div className="rounded-2xl p-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 shadow-xl backdrop-blur-sm">
              <p className="text-gray-300 leading-relaxed mb-6">
                ApprenticeApex was founded in 2025 with a simple observation:
                the traditional job search process wasn't working for
                apprenticeships. Students were spending countless hours applying
                to opportunities that weren't the right fit, while employers
                struggled to find candidates with the right potential and
                attitude.
              </p>
              <p className="text-gray-300 leading-relaxed mb-6">
                Drawing inspiration from modern dating apps, we realized that
                the swipe mechanism could revolutionize how people discover
                career opportunities. But we didn't stop there – we enhanced it
                with AI-powered matching that considers not just skills and
                location, but personality fit, career aspirations, and growth
                potential.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Today, we're proud to serve thousands of students and hundreds
                of employers across the UK, creating meaningful connections that
                lead to successful careers and thriving businesses
              </p>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Our Values
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-xl border border-white/20">
                <Users className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">
                People First
              </h3>
              <p className="text-gray-300">
                Every decision we make is guided by what's best for our users –
                both students and employers. We're building relationships, not
                just transactions.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-xl">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">
                Quality Matches
              </h3>
              <p className="text-gray-300">
                We're obsessed with creating perfect matches. Our AI
                continuously learns and improves to ensure every connection has
                the potential for success.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-xl">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">
                Genuine Care
              </h3>
              <p className="text-gray-300">
                We genuinely care about the success of every apprentice and
                employer on our platform. Your success is our success.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-3xl p-8 mb-16 bg-gradient-to-br from-gray-900/80 to-black/80 border border-white/10 shadow-xl backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-orange-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
            Our Platform Vision
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-200">
                1,000+
              </div>
              <div className="text-gray-300">Students to Impact</div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-200">
                £20,000+
              </div>
              <div className="text-gray-300">Average Starting Salary Goal</div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-200">
                90%
              </div>
              <div className="text-gray-300">Placement Success Rate</div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-200">
                Zero
              </div>
              <div className="text-gray-300">Cost to Students</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            Ready to Join Our Community?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto font-medium">
            Whether you're a student looking for your perfect apprenticeship or
            an employer seeking talented individuals, we're here to help you
            succeed
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/candidate/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-400 via-pink-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-500 hover:to-red-600 transition-all duration-200 hover:scale-105 shadow-xl"
            >
              Start as Student
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/company"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-200 hover:scale-105"
            >
              Join as Employer
            </Link>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
