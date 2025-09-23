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
  ArrowRight,
  Star,
  Zap,
  Megaphone,
  Clock,
} from "lucide-react";

interface PaymentPackage {
  id: number;
  type: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_days: number;
  features: Record<string, any>;
  popular?: boolean;
  savings?: string;
}

interface JobPostingPaymentProps {
  jobId: number;
  jobTitle: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

// Stripe promise - initialize outside component to avoid recreation
let stripePromise: Promise<any> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    // This will be set from the API call
    stripePromise = loadStripe("pk_test_placeholder");
  }
  return stripePromise;
};

const PaymentForm: React.FC<{
  package: PaymentPackage;
  jobId: number;
  jobTitle: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ package: selectedPackage, jobId, jobTitle, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, [selectedPackage.type]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch("/api/payments/job-posting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          jobId,
          packageType: selectedPackage.type,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setClientSecret(data.data.clientSecret);
      } else {
        setError(data.error || "Failed to initialize payment");
      }
    } catch (err) {
      setError("Failed to initialize payment");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
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

    const { error: stripeError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "Employer Account",
          },
        },
      });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      setProcessing(false);
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess();
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
          Complete Payment for "{jobTitle}"
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-blue-900">
              {selectedPackage.name}
            </span>
            <span className="text-lg font-bold text-blue-900">
              £{(selectedPackage.price / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-blue-700">{selectedPackage.description}</p>
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
            disabled={!stripe || processing || !clientSecret}
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
                Pay £{(selectedPackage.price / 100).toFixed(2)}
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

const PackageSelector: React.FC<{
  packages: PaymentPackage[];
  selected: PaymentPackage | null;
  onSelect: (pkg: PaymentPackage) => void;
}> = ({ packages, selected, onSelect }) => {
  const getPackageIcon = (type: string) => {
    switch (type) {
      case "basic":
        return <CreditCard className="h-6 w-6" />;
      case "featured":
        return <Star className="h-6 w-6" />;
      case "premium":
        return <Megaphone className="h-6 w-6" />;
      case "urgent":
        return <Zap className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  const getPackageColor = (type: string) => {
    switch (type) {
      case "basic":
        return "border-gray-300 hover:border-gray-400";
      case "featured":
        return "border-blue-300 hover:border-blue-400";
      case "premium":
        return "border-purple-300 hover:border-purple-400";
      case "urgent":
        return "border-orange-300 hover:border-orange-400";
      default:
        return "border-gray-300 hover:border-gray-400";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
          className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
            selected?.id === pkg.id
              ? "border-blue-500 bg-blue-50"
              : getPackageColor(pkg.type)
          } ${pkg.popular ? "ring-2 ring-blue-200" : ""}`}
          onClick={() => onSelect(pkg)}
        >
          {pkg.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Most Popular
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg mr-3 ${
                  pkg.type === "basic"
                    ? "bg-gray-100 text-gray-600"
                    : pkg.type === "featured"
                      ? "bg-blue-100 text-blue-600"
                      : pkg.type === "premium"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-orange-100 text-orange-600"
                }`}
              >
                {getPackageIcon(pkg.type)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                <p className="text-sm text-gray-600">
                  {pkg.duration_days} days
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                £{(pkg.price / 100).toFixed(0)}
              </div>
              <div className="text-sm text-gray-500">one-time</div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>

          <div className="space-y-2">
            {Object.entries(pkg.features).map(
              ([feature, enabled]) =>
                enabled && (
                  <div key={feature} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-700 capitalize">
                      {feature.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </span>
                  </div>
                ),
            )}
          </div>

          {selected?.id === pkg.id && (
            <div className="absolute inset-0 border-2 border-blue-500 rounded-xl bg-blue-50 bg-opacity-50 flex items-center justify-center">
              <div className="bg-blue-500 text-white p-2 rounded-full">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const JobPostingPayment: React.FC<JobPostingPaymentProps> = ({
  jobId,
  jobTitle,
  onPaymentSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<"select" | "payment" | "success">("select");
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeConfig, setStripeConfig] = useState<any>(null);

  useEffect(() => {
    loadPaymentConfig();
  }, []);

  const loadPaymentConfig = async () => {
    try {
      setLoading(true);

      // Load Stripe config and packages in parallel
      const [configResponse, packagesResponse] = await Promise.all([
        fetch("/api/payments/config", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch("/api/payments/packages", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);

      const configData = await configResponse.json();
      const packagesData = await packagesResponse.json();

      if (configData.success && packagesData.success) {
        setStripeConfig(configData.data);
        setPackages(packagesData.data.packages);

        // Initialize Stripe with the publishable key
        stripePromise = loadStripe(configData.data.publishableKey);
      } else {
        setError("Failed to load payment configuration");
      }
    } catch (err) {
      setError("Failed to load payment configuration");
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: PaymentPackage) => {
    setSelectedPackage(pkg);
  };

  const proceedToPayment = () => {
    if (selectedPackage) {
      setStep("payment");
    }
  };

  const handlePaymentSuccess = () => {
    setStep("success");
    setTimeout(() => {
      onPaymentSuccess();
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading payment options...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Payment Error
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
          Payment Successful!
        </h3>
        <p className="text-gray-600 mb-4">
          Your job posting "{jobTitle}" is now live and will be featured
          according to your selected package.
        </p>
        <div className="animate-pulse text-blue-600">
          <Clock className="h-5 w-5 inline mr-2" />
          Redirecting to your dashboard...
        </div>
      </div>
    );
  }

  if (step === "payment" && selectedPackage && stripeConfig) {
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
        <PaymentForm
          package={selectedPackage}
          jobId={jobId}
          jobTitle={jobTitle}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setStep("select")}
        />
      </Elements>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Publish Your Job Posting
        </h2>
        <p className="text-gray-600">
          Choose a package to make "{jobTitle}" visible to qualified candidates
        </p>
      </div>

      <PackageSelector
        packages={packages}
        selected={selectedPackage}
        onSelect={handlePackageSelect}
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
          disabled={!selectedPackage}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          Continue to Payment
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default JobPostingPayment;
