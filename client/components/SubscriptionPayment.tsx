import React, { useState, useEffect } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  BarChart3,
  Headphones,
  Palette,
  Code,
  Star,
  Crown,
  Building,
} from "lucide-react";

interface SubscriptionPlan {
  type: string;
  name: string;
  price: number;
  currency: string;
  features: {
    maxJobListings: number;
    maxApplications: number;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    successFeeDiscount: number;
  };
}

interface SubscriptionPaymentProps {
  onSubscriptionSuccess: () => void;
  onCancel: () => void;
  currentPlan?: string | null;
}

// Stripe promise
let stripePromise: Promise<any> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe("pk_test_placeholder");
  }
  return stripePromise;
};

const SubscriptionForm: React.FC<{
  plan: SubscriptionPlan;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ plan, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found");
      setProcessing(false);
      return;
    }

    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: "Company Account",
          },
        });

      if (paymentMethodError) {
        setError(
          paymentMethodError.message || "Failed to create payment method",
        );
        setProcessing(false);
        return;
      }

      // Create subscription
      const response = await fetch("/api/payments/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          planType: plan.type,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const { clientSecret, status } = data.data;

        if (status === "incomplete" && clientSecret) {
          // Confirm payment if required
          const { error: confirmError } =
            await stripe.confirmCardPayment(clientSecret);

          if (confirmError) {
            setError(confirmError.message || "Payment confirmation failed");
            setProcessing(false);
          } else {
            onSuccess();
          }
        } else if (status === "active") {
          onSuccess();
        } else {
          setError("Subscription creation failed");
          setProcessing(false);
        }
      } else {
        setError(data.error || "Failed to create subscription");
        setProcessing(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Subscribe to {plan.name}
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-blue-900">{plan.name} Plan</span>
            <span className="text-lg font-bold text-blue-900">
              £{(plan.price / 100).toFixed(2)}/month
            </span>
          </div>
          <p className="text-sm text-blue-700">
            Billed monthly • Cancel anytime
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="p-3 border border-gray-300 rounded-lg">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="mb-4 text-xs text-gray-500">
          By subscribing, you agree to our Terms of Service and Privacy Policy.
          Your subscription will auto-renew monthly until cancelled.
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || processing}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Subscribe
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Your payment is secured by Stripe. We never store your card details.
      </div>
    </div>
  );
};

const PlanSelector: React.FC<{
  plans: SubscriptionPlan[];
  selected: SubscriptionPlan | null;
  onSelect: (plan: SubscriptionPlan) => void;
  currentPlan?: string | null;
}> = ({ plans, selected, onSelect, currentPlan }) => {
  const getPlanIcon = (type: string) => {
    switch (type) {
      case "professional":
        return <Users className="h-8 w-8" />;
      case "business":
        return <Building className="h-8 w-8" />;
      case "enterprise":
        return <Crown className="h-8 w-8" />;
      default:
        return <Users className="h-8 w-8" />;
    }
  };

  const getPlanColor = (type: string) => {
    switch (type) {
      case "professional":
        return {
          border: "border-blue-300 hover:border-blue-400",
          bg: "bg-blue-50",
          icon: "bg-blue-100 text-blue-600",
          badge: "bg-blue-500",
        };
      case "business":
        return {
          border: "border-purple-300 hover:border-purple-400",
          bg: "bg-purple-50",
          icon: "bg-purple-100 text-purple-600",
          badge: "bg-purple-500",
        };
      case "enterprise":
        return {
          border: "border-orange-300 hover:border-orange-400",
          bg: "bg-orange-50",
          icon: "bg-orange-100 text-orange-600",
          badge: "bg-orange-500",
        };
      default:
        return {
          border: "border-gray-300 hover:border-gray-400",
          bg: "bg-gray-50",
          icon: "bg-gray-100 text-gray-600",
          badge: "bg-gray-500",
        };
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case "advancedAnalytics":
        return <BarChart3 className="h-4 w-4" />;
      case "prioritySupport":
        return <Headphones className="h-4 w-4" />;
      case "customBranding":
        return <Palette className="h-4 w-4" />;
      case "apiAccess":
        return <Code className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const formatFeatureName = (feature: string, value: any) => {
    switch (feature) {
      case "maxJobListings":
        return `${value === -1 ? "Unlimited" : value} job listings`;
      case "maxApplications":
        return `${value === -1 ? "Unlimited" : value.toLocaleString()} applications`;
      case "advancedAnalytics":
        return "Advanced analytics";
      case "prioritySupport":
        return "Priority support";
      case "customBranding":
        return "Custom branding";
      case "apiAccess":
        return "API access";
      case "successFeeDiscount":
        return value > 0 ? `${value * 100}% success fee discount` : null;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {plans.map((plan) => {
        const colors = getPlanColor(plan.type);
        const isCurrentPlan = currentPlan === plan.type;
        const isPopular = plan.type === "business";

        return (
          <div
            key={plan.type}
            className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
              selected?.type === plan.type
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : colors.border
            } ${isPopular ? "ring-2 ring-purple-200" : ""}`}
            onClick={() => !isCurrentPlan && onSelect(plan)}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {isCurrentPlan && (
              <div className="absolute -top-3 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <div
                className={`inline-flex p-3 rounded-full mb-4 ${colors.icon}`}
              >
                {getPlanIcon(plan.type)}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                £{(plan.price / 100).toFixed(0)}
              </div>
              <div className="text-sm text-gray-500">per month</div>
            </div>

            <div className="space-y-3 mb-6">
              {Object.entries(plan.features).map(([feature, value]) => {
                const featureName = formatFeatureName(feature, value);
                if (!featureName || (typeof value === "boolean" && !value))
                  return null;

                return (
                  <div key={feature} className="flex items-center text-sm">
                    <div className="text-green-500 mr-3">
                      {getFeatureIcon(feature)}
                    </div>
                    <span className="text-gray-700">{featureName}</span>
                  </div>
                );
              })}
            </div>

            {isCurrentPlan ? (
              <div className="w-full py-2 text-center text-gray-500 border border-gray-300 rounded-lg">
                Current Plan
              </div>
            ) : (
              <div
                className={`absolute inset-0 border-2 rounded-xl transition-opacity ${
                  selected?.type === plan.type
                    ? "border-blue-500 bg-blue-50 bg-opacity-50"
                    : "opacity-0 hover:opacity-100 bg-white bg-opacity-50"
                }`}
              >
                {selected?.type === plan.type && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-blue-500 text-white p-3 rounded-full">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const SubscriptionPayment: React.FC<SubscriptionPaymentProps> = ({
  onSubscriptionSuccess,
  onCancel,
  currentPlan,
}) => {
  const [step, setStep] = useState<"select" | "payment" | "success">("select");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeConfig, setStripeConfig] = useState<any>(null);

  // Static plans - in real app these would come from API
  const plans: SubscriptionPlan[] = [
    {
      type: "professional",
      name: "Professional",
      price: 4900, // £49.00
      currency: "gbp",
      features: {
        maxJobListings: 15,
        maxApplications: 250,
        advancedAnalytics: true,
        prioritySupport: false,
        customBranding: false,
        apiAccess: false,
        successFeeDiscount: 0,
      },
    },
    {
      type: "business",
      name: "Business",
      price: 9900, // £99.00
      currency: "gbp",
      features: {
        maxJobListings: 50,
        maxApplications: 1000,
        advancedAnalytics: true,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        successFeeDiscount: 0.02,
      },
    },
    {
      type: "enterprise",
      name: "Enterprise",
      price: 14900, // £149.00
      currency: "gbp",
      features: {
        maxJobListings: -1, // unlimited
        maxApplications: -1, // unlimited
        advancedAnalytics: true,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        successFeeDiscount: 0.04,
      },
    },
  ];

  useEffect(() => {
    loadStripeConfig();
  }, []);

  const loadStripeConfig = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/payments/config", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const data = await response.json();

      if (data.success) {
        setStripeConfig(data.data);
        stripePromise = loadStripe(data.data.publishableKey);
      } else {
        setError("Failed to load payment configuration");
      }
    } catch (err) {
      setError("Failed to load payment configuration");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (currentPlan !== plan.type) {
      setSelectedPlan(plan);
    }
  };

  const proceedToPayment = () => {
    if (selectedPlan) {
      setStep("payment");
    }
  };

  const handleSubscriptionSuccess = () => {
    setStep("success");
    setTimeout(() => {
      onSubscriptionSuccess();
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">
          Loading subscription plans...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Configuration Error
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="text-center p-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription Active!
        </h3>
        <p className="text-gray-600 mb-4">
          Welcome to {selectedPlan?.name}! Your subscription is now active and
          you can access all plan features.
        </p>
        <div className="animate-pulse text-blue-600">
          <Loader2 className="h-5 w-5 inline mr-2 animate-spin" />
          Redirecting to your dashboard...
        </div>
      </div>
    );
  }

  if (step === "payment" && selectedPlan && stripeConfig) {
    const elementsOptions: StripeElementsOptions = {
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#2563eb",
        },
      },
    };

    return (
      <Elements stripe={getStripe()} options={elementsOptions}>
        <SubscriptionForm
          plan={selectedPlan}
          onSuccess={handleSubscriptionSuccess}
          onCancel={() => setStep("select")}
        />
      </Elements>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Plan
        </h2>
        <p className="text-gray-600">
          Select the subscription plan that best fits your hiring needs
        </p>
      </div>

      <PlanSelector
        plans={plans}
        selected={selectedPlan}
        onSelect={handlePlanSelect}
        currentPlan={currentPlan}
      />

      <div className="flex justify-center gap-4">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={proceedToPayment}
          disabled={!selectedPlan}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {selectedPlan ? `Subscribe to ${selectedPlan.name}` : "Select a Plan"}
          {selectedPlan && <Star className="h-4 w-4 ml-2" />}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPayment;
