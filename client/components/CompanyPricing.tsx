import React, { useState, useEffect } from "react";
import {
  Check,
  Star,
  CreditCard,
  Users,
  BarChart3,
  Headphones,
  Crown,
  Building2,
  Zap,
  MessageCircle,
  Phone,
  Mail,
  Shield,
  Infinity,
  ArrowRight,
} from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  description: string;
  badge?: string;
  popular?: boolean;
  features: string[];
  limits: {
    jobPostings: number | "unlimited";
    users: number | "unlimited";
    duration: string;
  };
  buttonText: string;
  buttonAction: "trial" | "subscription" | "contact";
}

interface CompanyPricingProps {
  onStartTrial?: () => void;
  onSubscribe?: (planType: string) => void;
  onContactSales?: () => void;
}

const CompanyPricing: React.FC<CompanyPricingProps> = ({
  onStartTrial,
  onSubscribe,
  onContactSales,
}) => {
  const [paymentMode, setPaymentMode] = useState<"monthly" | "per-hire">(
    "monthly",
  );
  const [loading, setLoading] = useState(false);

  const pricingPlans: PricingPlan[] = [
    {
      id: "trial",
      name: "Trial Plan",
      price: 0,
      period: "FREE",
      description: "For Small Training Providers",
      badge: "60-Day Free Trial",
      features: [
        "60-day risk-free trial",
        "Up to 15 job postings",
        "AI-powered Gen Z matching",
        "Multi-platform candidate sourcing",
        "Mobile-optimized candidate profiles",
        "Basic analytics and reporting",
        "Email and chat support",
      ],
      limits: {
        jobPostings: 15,
        users: 1,
        duration: "60 days",
      },
      buttonText: "Start Free Trial",
      buttonAction: "trial",
    },
    {
      id: "starter",
      name: "Starter Plan",
      price: 49,
      period: "month",
      description: "For Small Training Providers",
      features: [
        "Up to 5 job postings per month",
        "Basic Gen Z matching algorithm",
        "Standard candidate profiles",
        "Email support",
        "Basic analytics dashboard",
        "Social media integration (LinkedIn, Instagram)",
        "+ 12% of first year salary",
        paymentMode === "per-hire"
          ? "+ £399 per hire (one-off payment option)"
          : "",
      ].filter(Boolean),
      limits: {
        jobPostings: 5,
        users: 1,
        duration: "monthly",
      },
      buttonText: "Get Started",
      buttonAction: "subscription",
    },
    {
      id: "professional",
      name: "Professional Plan",
      price: 99,
      period: "month",
      description: "For Growing Organizations",
      popular: true,
      badge: "Most Popular",
      features: [
        "Up to 15 job postings per month",
        "Premium AI-powered matching",
        "Premium candidate profiles with video",
        "Priority email + chat support",
        "Advanced analytics & reporting",
        "Custom branding",
        "+ 12% of first year salary",
      ],
      limits: {
        jobPostings: 15,
        users: 3,
        duration: "monthly",
      },
      buttonText: "Get Started",
      buttonAction: "subscription",
    },
    {
      id: "business",
      name: "Business Plan",
      price: 149,
      period: "month",
      description: "For High-Volume Recruitment",
      features: [
        "Up to 30 job postings per month",
        "Premium Gen Z targeting & matching",
        "White-label career pages",
        "Phone + priority support",
        "Custom reporting & insights",
        "Advanced automation workflows",
        "+ 12% of first year salary",
      ],
      limits: {
        jobPostings: 30,
        users: 5,
        duration: "monthly",
      },
      buttonText: "Get Started",
      buttonAction: "subscription",
    },
    {
      id: "enterprise",
      name: "Enterprise Plan",
      price: 0,
      period: "Custom",
      description: "For Large-Scale Operations",
      features: [
        "Unlimited job postings",
        "Dedicated account manager",
        "Custom AI training & matching",
        "24/7 phone support",
        "Advanced security features",
        "Unlimited users",
        "+ 12% of first year salary",
      ],
      limits: {
        jobPostings: "unlimited",
        users: "unlimited",
        duration: "custom",
      },
      buttonText: "Contact Sales",
      buttonAction: "contact",
    },
  ];

  const handlePlanAction = async (plan: PricingPlan) => {
    setLoading(true);

    try {
      switch (plan.buttonAction) {
        case "trial":
          if (onStartTrial) {
            await onStartTrial();
          } else {
            // Direct Stripe checkout for trial
            window.location.href = "/api/payments/checkout/trial";
          }
          break;

        case "subscription":
          if (onSubscribe) {
            await onSubscribe(plan.id);
          } else {
            // Direct Stripe checkout for subscription
            const paymentType =
              paymentMode === "per-hire" && plan.id === "starter"
                ? "per-hire"
                : "monthly";
            window.location.href = `/api/payments/checkout/${plan.id}?mode=${paymentType}`;
          }
          break;

        case "contact":
          if (onContactSales) {
            await onContactSales();
          } else {
            // Direct Stripe checkout for enterprise
            window.location.href = "/api/payments/checkout/enterprise";
          }
          break;
      }
    } catch (error) {
      console.error("Error handling plan action:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "trial":
        return <Zap className="h-6 w-6" />;
      case "starter":
        return <Users className="h-6 w-6" />;
      case "professional":
        return <Star className="h-6 w-6" />;
      case "business":
        return <Building2 className="h-6 w-6" />;
      case "enterprise":
        return <Crown className="h-6 w-6" />;
      default:
        return <Users className="h-6 w-6" />;
    }
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.includes("analytics") || feature.includes("reporting"))
      return <BarChart3 className="h-4 w-4" />;
    if (feature.includes("support")) return <Headphones className="h-4 w-4" />;
    if (feature.includes("security")) return <Shield className="h-4 w-4" />;
    if (feature.includes("phone")) return <Phone className="h-4 w-4" />;
    if (feature.includes("email") || feature.includes("chat"))
      return <MessageCircle className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Scale your apprentice recruitment with our AI-powered platform. Find
            the perfect Gen Z talent for your organization.
          </p>

          {/* Payment Mode Toggle */}
          <div className="inline-flex items-center bg-gray-800 rounded-xl p-1 border border-gray-700">
            <button
              onClick={() => setPaymentMode("monthly")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                paymentMode === "monthly"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Pay Monthly
            </button>
            <button
              onClick={() => setPaymentMode("per-hire")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                paymentMode === "per-hire"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Pay Per Hire (£399)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? "bg-gradient-to-br from-blue-900/80 to-purple-900/80 border-blue-500/50 ring-2 ring-blue-500/30"
                  : "bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 hover:border-gray-600/50"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Trial Badge */}
              {plan.badge && !plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div
                    className={`inline-flex p-3 rounded-xl mb-4 ${
                      plan.popular
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-700/50 text-gray-400"
                    }`}
                  >
                    {getPlanIcon(plan.id)}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-4">
                    {plan.period === "Custom" ? (
                      <div>
                        <div className="text-3xl font-bold text-white">
                          Custom
                        </div>
                        <div className="text-gray-400 text-sm">
                          Contact us for pricing
                        </div>
                      </div>
                    ) : plan.price === 0 ? (
                      <div>
                        <div className="text-3xl font-bold text-white">
                          FREE
                        </div>
                        <div className="text-gray-400 text-sm">
                          {plan.period}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-3xl font-bold text-white">
                          £{plan.price}
                          {paymentMode === "per-hire" &&
                            plan.id === "starter" && (
                              <span className="text-lg"> + £399</span>
                            )}
                        </div>
                        <div className="text-gray-400 text-sm">
                          per{" "}
                          {paymentMode === "per-hire" && plan.id === "starter"
                            ? "hire"
                            : plan.period}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <div className="text-green-400 mr-3 mt-0.5 flex-shrink-0">
                        {getFeatureIcon(feature)}
                      </div>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limits */}
                <div className="bg-gray-800/50 rounded-lg p-3 mb-6 border border-gray-700/50">
                  <div className="text-xs text-gray-400 mb-2">Plan Limits:</div>
                  <div className="space-y-1 text-xs text-gray-300">
                    <div>
                      Job postings:{" "}
                      {plan.limits.jobPostings === "unlimited" ? (
                        <span className="text-blue-400 flex items-center inline">
                          <Infinity className="h-3 w-3 mr-1" />
                          Unlimited
                        </span>
                      ) : (
                        plan.limits.jobPostings
                      )}
                    </div>
                    <div>
                      Users:{" "}
                      {plan.limits.users === "unlimited" ? (
                        <span className="text-blue-400 flex items-center inline">
                          <Infinity className="h-3 w-3 mr-1" />
                          Unlimited
                        </span>
                      ) : (
                        plan.limits.users
                      )}
                    </div>
                    <div>Duration: {plan.limits.duration}</div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanAction(plan)}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                      : plan.buttonAction === "trial"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      {plan.buttonAction === "contact" ? (
                        <Mail className="h-4 w-4 mr-2" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      {plan.buttonText}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Why Choose ApprenticeApex?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-500/20 p-4 rounded-xl inline-block mb-4">
                <Zap className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                AI-Powered Matching
              </h3>
              <p className="text-gray-400 text-sm">
                Our advanced AI understands Gen Z candidates and matches them
                with the perfect apprenticeship opportunities.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-500/20 p-4 rounded-xl inline-block mb-4">
                <BarChart3 className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Advanced Analytics
              </h3>
              <p className="text-gray-400 text-sm">
                Get detailed insights into your recruitment performance and
                optimize your hiring strategy.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-500/20 p-4 rounded-xl inline-block mb-4">
                <Headphones className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Expert Support
              </h3>
              <p className="text-gray-400 text-sm">
                Our team of recruitment experts is here to help you succeed with
                dedicated support.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Questions About Pricing?
          </h2>
          <p className="text-gray-400 mb-6">
            Our team is here to help you choose the right plan for your
            organization.
          </p>
          <button
            onClick={() =>
              (window.location.href = "mailto:sales@apprenticeapex.co.uk")
            }
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center mx-auto"
          >
            <Mail className="h-5 w-5 mr-2" />
            Contact Sales Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyPricing;
