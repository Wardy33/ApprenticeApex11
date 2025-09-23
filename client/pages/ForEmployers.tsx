import React, { useRef } from "react";
import {
  Check,
  Star,
  TrendingUp,
  Shield,
  Clock,
  Users,
  Zap,
  ArrowRight,
  Mail,
  MessageCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { WebLayout } from "../components/WebLayout";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyFee: number | string;
  successFeeRate?: number;
  successFee?: number;
  popular?: boolean;
  features: string[];
  limits: {
    jobPostings: number | string;
    users: number | string;
    duration?: string;
  };
}

export default function ForEmployers() {
  const plans: PricingPlan[] = [
    {
      id: "trial",
      name: "Trial",
      description: "60-day risk-free trial",
      monthlyFee: 0,
      successFee: 399,
      features: [
        "Up to 15 job postings",
        "AI-powered Gen Z matching",
        "Multi-platform candidate sourcing",
        "Mobile-optimized candidate profiles",
        "Basic analytics and reporting",
        "Email and chat support",
        "Platform messaging system",
      ],
      limits: {
        jobPostings: 15,
        users: 1,
        duration: "60 days",
      },
    },
    {
      id: "starter",
      name: "Starter",
      description: "For Small Training Providers",
      monthlyFee: 49,
      successFeeRate: 12,
      features: [
        "Up to 5 job postings per month",
        "Basic Gen Z matching algorithm",
        "Standard candidate profiles",
        "Email support",
        "Basic analytics dashboard",
        "Social media integration (LinkedIn, Instagram)",
      ],
      limits: {
        jobPostings: 5,
        users: 1,
      },
    },
    {
      id: "professional",
      name: "Professional",
      description: "For Growing Organizations",
      monthlyFee: 99,
      successFeeRate: 12,
      popular: true,
      features: [
        "Up to 15 job postings per month",
        "Advanced AI-powered matching",
        "Premium candidate profiles with video",
        "Priority email + chat support",
        "Advanced analytics & reporting",
        "Custom branding",
        "Multi-platform social posting",
        "Basic automation workflows",
        "Candidate pool building tools",
      ],
      limits: {
        jobPostings: 15,
        users: 3,
      },
    },
    {
      id: "business",
      name: "Business",
      description: "For High-Volume Recruitment",
      monthlyFee: 149,
      successFeeRate: 12,
      features: [
        "Up to 30 job postings per month",
        "Premium Gen Z targeting & matching",
        "White-label career pages",
        "Phone + priority support",
        "Custom reporting & insights",
        "Advanced automation workflows",
        "Full social media marketing suite",
        "API access",
        "Bulk candidate messaging",
      ],
      limits: {
        jobPostings: 30,
        users: 5,
      },
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For Large-Scale Operations",
      monthlyFee: "Custom",
      successFeeRate: 12,
      features: [
        "Unlimited job postings",
        "Dedicated account manager",
        "Custom AI training & matching",
        "24/7 phone support",
        "Advanced security features",
        "Unlimited users",
        "Custom integrations",
        "White-glove service",
        "SLA guarantees",
      ],
      limits: {
        jobPostings: "Unlimited",
        users: "Unlimited",
      },
    },
  ];

  const formatCurrency = (amount: number | string) => {
    if (typeof amount === "string") return amount;
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <WebLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4">
          <div className="container mx-auto max-w-6xl text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-400/20 via-pink-500/20 to-blue-500/20 border border-white/20 rounded-full text-orange-300 text-sm font-bold mb-6 backdrop-blur-sm">
              <Zap className="w-4 h-4 mr-2" />
              Risk-Free Apprentice Recruitment
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
              Pay Only When You{" "}
              <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
                Hire
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto font-medium">
              Start with our 60-day risk-free trial. No monthly fees, no setup
              costs. Only pay £399 when you successfully hire an apprentice
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/company/signup"
                className="px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>

              <Link
                to="/contact"
                className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-200 hover:scale-105 flex items-center justify-center"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact Sales
              </Link>
            </div>
          </div>
        </section>

        {/* Trial Offer Highlight */}
        <section className="py-16 px-4 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border-y border-white/10">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                Launch Offer - First 60 Days
              </h2>
              <p className="text-xl text-gray-300 font-medium">
                Perfect for testing ApprenticeApex risk-free
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-white/20 shadow-xl backdrop-blur-sm group hover:scale-105 transition-all duration-300">
                <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-200">
                  £0
                </div>
                <div className="text-white font-bold mb-2">Setup Costs</div>
                <div className="text-gray-300 text-sm">
                  No upfront fees or monthly charges
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-gradient-to-br from-orange-400/20 to-pink-500/20 border border-white/20 shadow-xl backdrop-blur-sm group hover:scale-105 transition-all duration-300">
                <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-300 via-orange-400 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-200">
                  £399
                </div>
                <div className="text-white font-bold mb-2">
                  Per Successful Hire
                </div>
                <div className="text-gray-300 text-sm">
                  Only pay when candidate starts
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/20 shadow-xl backdrop-blur-sm group hover:scale-105 transition-all duration-300">
                <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-200">
                  777%
                </div>
                <div className="text-white font-bold mb-2">Average ROI</div>
                <div className="text-gray-300 text-sm">
                  vs traditional recruitment
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                Choose Your Plan
              </h2>
              <p className="text-xl text-gray-300">
                Flexible pricing that grows with your business
              </p>
            </div>

            <div className="grid lg:grid-cols-5 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative p-6 rounded-xl border transition-all duration-300 hover:scale-105 shadow-xl backdrop-blur-sm flex flex-col h-full ${
                    plan.id === "trial"
                      ? "bg-gradient-to-br from-orange-400/20 via-pink-500/20 to-red-500/20 border-orange-400/30"
                      : plan.popular
                        ? "bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 border-white/20"
                        : "bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 border-white/20"
                  }`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {plan.description}
                    </p>

                    <div className="mb-4">
                      <div className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-orange-400 to-pink-500 bg-clip-text text-transparent">
                        {typeof plan.monthlyFee === "number"
                          ? formatCurrency(plan.monthlyFee)
                          : plan.monthlyFee}
                      </div>
                      <div className="text-gray-300 text-sm">per month</div>
                    </div>

                    <div className="text-center">
                      <div className="font-semibold text-orange-400">
                        {plan.successFee
                          ? `+ ${formatCurrency(plan.successFee)} per hire`
                          : `+ ${plan.successFeeRate}% of first year salary`}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 flex-grow">
                    {plan.features.slice(0, 6).map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 6 && (
                      <div className="text-gray-400 text-sm">
                        +{plan.features.length - 6} more features
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/20 pt-4 mb-6 mt-auto">
                    <div className="text-gray-400 text-sm mb-2">Limits:</div>
                    <div className="space-y-1">
                      <div className="text-white text-sm">
                        {plan.limits.jobPostings} job postings
                      </div>
                      <div className="text-white text-sm">
                        {plan.limits.users} user
                        {plan.limits.users !== 1 ? "s" : ""}
                      </div>
                      {plan.limits.duration && (
                        <div className="text-white text-sm">
                          {plan.limits.duration}
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    to={
                      plan.id === "enterprise" ? "/contact" : "/company/signup"
                    }
                    className={`w-full py-4 px-4 rounded-lg font-semibold transition-all duration-200 text-center block hover:scale-105 ${
                      plan.id === "trial"
                        ? "bg-pink-500 hover:bg-pink-600 text-white"
                        : "bg-cyan-500 hover:bg-cyan-600 text-white"
                    }`}
                  >
                    {plan.id === "trial"
                      ? "Start Free Trial"
                      : plan.id === "enterprise"
                        ? "Contact Sales"
                        : "Get Started"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                Why Choose ApprenticeApex?
              </h2>
              <p className="text-xl text-gray-300">
                Compare us against traditional recruitment methods
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full rounded-xl border border-white/30 shadow-2xl backdrop-blur-sm bg-gradient-to-br from-orange-400/10 via-pink-500/10 to-blue-500/10">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-4 text-white font-semibold">
                      Method
                    </th>
                    <th className="text-center p-4 text-white font-semibold">
                      Cost per Hire
                    </th>
                    <th className="text-center p-4 text-white font-semibold">
                      Setup Costs
                    </th>
                    <th className="text-center p-4 text-white font-semibold">
                      Risk Level
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/20 bg-gradient-to-r from-orange-400/20 to-pink-500/20">
                    <td className="p-4 text-white font-semibold">
                      ApprenticeApex Trial
                    </td>
                    <td className="p-4 text-center text-orange-500 font-bold">
                      £399
                    </td>
                    <td className="p-4 text-center text-green-400 font-bold">
                      £0
                    </td>
                    <td className="p-4 text-center text-green-400 font-bold">
                      No Risk
                    </td>
                  </tr>
                  <tr className="border-b border-white/20">
                    <td className="p-4 text-gray-300">Traditional Recruiter</td>
                    <td className="p-4 text-center text-gray-300">
                      £3,000-6,000
                    </td>
                    <td className="p-4 text-center text-gray-300">£0</td>
                    <td className="p-4 text-center text-red-400">High Risk</td>
                  </tr>
                  <tr className="border-b border-white/20">
                    <td className="p-4 text-gray-300">
                      Job Boards + Internal HR
                    </td>
                    <td className="p-4 text-center text-gray-300">
                      £1,500-3,000
                    </td>
                    <td className="p-4 text-center text-gray-300">£500+</td>
                    <td className="p-4 text-center text-yellow-400">
                      Medium Risk
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-300">
                      Training Provider Markup
                    </td>
                    <td className="p-4 text-center text-gray-300">
                      £1,000-2,500
                    </td>
                    <td className="p-4 text-center text-gray-300">Variable</td>
                    <td className="p-4 text-center text-yellow-400">
                      Medium Risk
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ROI Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                Proven ROI for Our Clients
              </h2>
              <p className="text-xl text-gray-300">
                Real results from employers using ApprenticeApex
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-xl border border-white/20 shadow-xl text-center bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-sm hover:scale-105 transition-all duration-300">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
                <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
                  777%
                </div>
                <div className="text-white font-semibold mb-2">Average ROI</div>
                <div className="text-gray-300">
                  during 60-day trial vs traditional recruitment
                </div>
              </div>

              <div className="p-8 rounded-xl border border-white/20 shadow-xl text-center bg-gradient-to-br from-orange-400/20 to-pink-500/20 backdrop-blur-sm hover:scale-105 transition-all duration-300">
                <Clock className="w-12 h-12 mx-auto mb-4 text-orange-400" />
                <div className="text-3xl font-bold mb-2 text-white">
                  14 days
                </div>
                <div className="text-white font-semibold mb-2">
                  Average Time to Hire
                </div>
                <div className="text-gray-300">
                  vs 45+ days for traditional methods
                </div>
              </div>

              <div className="p-8 rounded-xl border border-white/20 shadow-xl text-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm hover:scale-105 transition-all duration-300">
                <Users className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  92%
                </div>
                <div className="text-white font-semibold mb-2">
                  Hire Success Rate
                </div>
                <div className="text-gray-300">
                  apprentices who complete their programs
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-orange-400/90 via-pink-500/90 to-red-500/90 backdrop-blur-sm">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Ready to Revolutionize Your Apprentice Recruitment?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Start your 60-day risk-free trial today. No setup fees, no monthly
              costs, pay only for results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/company/signup"
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white transition-colors flex items-center justify-center"
                style={{ borderColor: "#ffffff", color: "#ffffff" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.color = "#da6927";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#ffffff";
                }}
              >
                Start Free Trial Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>

              <Link
                to="/contact"
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white transition-colors flex items-center justify-center"
                style={{ borderColor: "#ffffff", color: "#ffffff" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.color = "#da6927";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#ffffff";
                }}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact Sales
              </Link>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-6 justify-center text-white/90">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                No long-term contracts
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Cancel anytime after trial
              </div>
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Free setup & support
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 drop-shadow-lg">
              Have Questions? We're Here to Help
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-white/20 shadow-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-sm hover:scale-105 transition-all duration-300">
                <Mail className="w-8 h-8 mx-auto mb-4 text-cyan-400" />
                <h3 className="font-semibold mb-2 text-white">Email Support</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Get help within 2 hours
                </p>
                <a
                  href="mailto:hello@apprenticeapex.co.uk"
                  className="hover:opacity-80 text-cyan-400"
                >
                  hello@apprenticeapex.co.uk
                </a>
              </div>

              <div className="p-6 rounded-xl border border-white/20 shadow-xl bg-gradient-to-br from-orange-400/20 to-pink-500/20 backdrop-blur-sm hover:scale-105 transition-all duration-300">
                <MessageCircle className="w-8 h-8 mx-auto mb-4 text-orange-400" />
                <h3 className="font-semibold mb-2 text-white">Sales Call</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Schedule a quick intro call
                </p>
                <a href="/contact" className="hover:opacity-80 text-orange-400">
                  Book a call
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </WebLayout>
  );
}
