import { WebLayout } from "../components/WebLayout";
import { SEOHead } from "../components/SEOHead";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Briefcase,
  ArrowRight,
} from "lucide-react";

export default function BrowseApprenticeships() {
  return (
    <WebLayout>
      <SEOHead
        title="Browse Apprenticeships - Find Your Perfect Opportunity | ApprenticeApex"
        description="Explore thousands of apprenticeship opportunities across the UK. Filter by location, industry, and career level to find your perfect match."
        keywords="browse apprenticeships, apprenticeship opportunities, UK apprenticeships, career opportunities, job search"
      />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Browse <span className="text-orange">Apprenticeships</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover thousands of apprenticeship opportunities across the UK.
            Create an account to unlock AI-powered matching and personalized
            recommendations.
          </p>
        </div>

        {/* CTA to Sign Up */}
        <div className="bg-orange/10 border border-orange/20 rounded-xl p-8 mb-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Get Personalized Matches</h2>
          <p className="text-gray-300 mb-6">
            Sign up for a free account to access our AI-powered matching system,
            save opportunities, and get instant notifications for new positions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/candidate/signup"
              className="inline-flex items-center justify-center px-8 py-3 bg-orange hover:bg-orange/90 text-white font-semibold rounded-lg transition-colors"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            <a
              href="/candidate/signin"
              className="inline-flex items-center justify-center px-8 py-3 border border-orange text-orange hover:bg-orange hover:text-white font-semibold rounded-lg transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-900/50 rounded-xl p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Keywords
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Job title, skills, or company..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="City or postcode..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Industry
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange appearance-none">
                  <option value="">All Industries</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="engineering">Engineering</option>
                  <option value="marketing">Marketing</option>
                  <option value="construction">Construction</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Apprenticeships */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Featured Opportunities</h2>
            <span className="text-gray-400 text-sm">
              Sign up to see all 2,500+ opportunities
            </span>
          </div>

          {/* Sample listings */}
          {[
            {
              title: "Software Developer Apprentice",
              company: "TechCorp Ltd",
              location: "London",
              salary: "£18,000 - £25,000",
              duration: "36 months",
              type: "Full-time",
              description:
                "Join our dynamic team and learn cutting-edge web development technologies...",
            },
            {
              title: "Digital Marketing Apprentice",
              company: "Creative Agency",
              location: "Manchester",
              salary: "£16,000 - £22,000",
              duration: "24 months",
              type: "Full-time",
              description:
                "Learn the fundamentals of digital marketing including SEO, social media...",
            },
            {
              title: "Data Analyst Apprentice",
              company: "Finance Solutions",
              location: "Birmingham",
              salary: "£19,000 - £26,000",
              duration: "30 months",
              type: "Full-time",
              description:
                "Develop skills in data analysis, visualization, and business intelligence...",
            },
          ].map((job, index) => (
            <div
              key={index}
              className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 hover:border-orange/30 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {job.title}
                  </h3>
                  <p className="text-orange font-semibold">{job.company}</p>
                </div>
                <span className="bg-orange/20 text-orange px-3 py-1 rounded-full text-sm font-medium">
                  Featured
                </span>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4 text-sm">
                <div className="flex items-center text-gray-300">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  {job.location}
                </div>
                <div className="flex items-center text-gray-300">
                  <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                  {job.salary}
                </div>
                <div className="flex items-center text-gray-300">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  {job.duration}
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="w-4 h-4 mr-2 bg-green-500 rounded-full text-xs"></span>
                  {job.type}
                </div>
              </div>

              <p className="text-gray-300 mb-4">{job.description}</p>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">Posted 2 days ago</div>
                <a
                  href="/candidate/signup"
                  className="bg-orange hover:bg-orange/90 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Apply Now
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-300 mb-6">
            Ready to find your perfect apprenticeship match? Join thousands of
            students who have found their dream careers through ApprenticeApex.
          </p>
          <a
            href="/candidate/signup"
            className="inline-flex items-center justify-center px-8 py-3 bg-orange hover:bg-orange/90 text-white font-semibold rounded-lg transition-colors"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>
    </WebLayout>
  );
}
