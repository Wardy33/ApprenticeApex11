import React, { useState, useEffect } from 'react';
import { safeGetFromLocalStorage } from '../lib/safeJsonParse';
import {
  CreditCard,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Briefcase,
  ArrowUp,
  Download,
  X,
  PoundSterling,
  XCircle
} from 'lucide-react';
import NotificationModal from './NotificationModal';

interface SubscriptionData {
  subscription: {
    planType: string;
    status: string;
    isInTrial: boolean;
    monthlyFee: number;
    successFeeRate: number;
    features: any;
    usage: {
      jobPostingsThisMonth: number;
      usersActive: number;
      hiresThisMonth: number;
    };
    trialEndDate?: string;
  };
  outstandingBalance: {
    totalAmount: number;
    count: number;
  };
  isTrialExpired: boolean;
  daysLeftInTrial: number;
  limits: {
    canCreateJobPosting: boolean;
    canAddUser: boolean;
  };
}

export default function SubscriptionManager() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info' | 'payment';
    title: string;
    message: string;
    action?: { label: string; onClick: () => void };
  }>({ isOpen: false, type: 'info', title: '', message: '' });
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
    loadBillingHistory();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      // Load real subscription data from API
      const response = await fetch('/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      } else {
        // No subscription data means user needs to choose a plan
        setSubscriptionData(null);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setSubscriptionData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadBillingHistory = async () => {
    try {
      // Load real billing history from Stripe API
      const response = await fetch('/api/billing/history');
      if (response.ok) {
        const data = await response.json();
        setBillingHistory(data.invoices || []);
      } else {
        setBillingHistory([]);
      }
    } catch (error) {
      console.error('Error loading billing history:', error);
      setBillingHistory([]);
    }
  };

  const startTrial = async () => {
    try {
      if (confirm('Start your 60-day free trial? You will have full access to all features.')) {
        setLoading(true);

        // Create real trial subscription via Stripe API
        const response = await fetch('/api/subscription/start-trial', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planType: 'trial'
          })
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptionData(data);

          // Show success notification
          setNotification({
            isOpen: true,
            type: 'success',
            title: 'Trial Started Successfully!',
            message: 'You now have 60 days of full access to all features. Start posting jobs and finding the perfect apprentices for your company.'
          });

          // Trigger event to refresh subscription limits across the app
          window.dispatchEvent(new Event('subscriptionUpdated'));
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to start trial');
        }
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Trial Start Failed',
        message: error instanceof Error ? error.message : 'Failed to start trial. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const upgradePlan = async (planType: string) => {
    try {
      if (confirm(`Upgrade to ${getPlanDisplayName(planType)} plan?`)) {
        setLoading(true);

        // Create Stripe checkout session for plan upgrade
        const response = await fetch('/api/subscription/upgrade', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planType: planType
          })
        });

        if (response.ok) {
          const data = await response.json();

          if (data.checkoutUrl) {
            // Redirect to Stripe checkout
            window.location.href = data.checkoutUrl;
          } else {
            // Update subscription immediately for instant upgrades
            setSubscriptionData(data);
            setShowUpgradeModal(false);

            setNotification({
              isOpen: true,
              type: 'success',
              title: 'Plan Updated Successfully!',
              message: `You've been upgraded to the ${getPlanDisplayName(planType)} plan. Your new features are now active.`
            });

            // Trigger event to refresh subscription limits across the app
            window.dispatchEvent(new Event('subscriptionUpdated'));
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to upgrade plan');
        }
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Upgrade Failed',
        message: error instanceof Error ? error.message : 'Failed to upgrade plan. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      if (confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.')) {
        setLoading(true);

        // Cancel subscription via Stripe API
        const response = await fetch('/api/subscription/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptionData(data);
          setShowCancelModal(false);

          setNotification({
            isOpen: true,
            type: 'info',
            title: 'Subscription Cancelled',
            message: 'Your subscription has been cancelled and will remain active until the end of your current billing period.'
          });

          // Trigger event to refresh subscription limits across the app
          window.dispatchEvent(new Event('subscriptionUpdated'));
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to cancel subscription');
        }
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Cancellation Failed',
        message: error instanceof Error ? error.message : 'Failed to cancel subscription. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoices = () => {
    try {
      // For demo purposes, simulate PDF download
      setNotification({
        isOpen: true,
        type: 'info',
        title: 'Downloading Invoices',
        message: 'Your billing history is being prepared as a PDF. In a real application, this would download all your invoices.'
      });

      // Simulate file download
      setTimeout(() => {
        const element = document.createElement('a');
        const file = new Blob(['Demo Invoice PDF Content'], { type: 'application/pdf' });
        element.href = URL.createObjectURL(file);
        element.download = 'apprentice-apex-invoices.pdf';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }, 1000);
    } catch (error) {
      console.error('Error downloading invoices:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getPlanDisplayName = (planType: string) => {
    const names = {
      trial: 'Trial',
      starter: 'Starter',
      professional: 'Professional',
      business: 'Business',
      enterprise: 'Enterprise'
    };
    return names[planType as keyof typeof names] || planType;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-600 bg-green-100 px-2 py-1 rounded-lg',
      expired: 'text-red-600 bg-red-100 px-2 py-1 rounded-lg',
      cancelled: 'text-gray-600 bg-gray-100 px-2 py-1 rounded-lg'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100 px-2 py-1 rounded-lg';
  };

  const getBillingStatusColor = (status: string) => {
    const colors = {
      paid: 'text-green-700 bg-green-100',
      pending: 'text-yellow-700 bg-yellow-100',
      overdue: 'text-red-700 bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-700 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const subscriptionPlans = [
    {
      id: 'trial',
      name: '60-Day Risk-Free Trial',
      price: 'FREE',
      period: '',
      description: 'No monthly fees, no setup costs',
      features: [
        'Unlimited job postings during trial',
        'Full platform access including AI matching',
        'Access to all Gen Z candidates',
        'Basic analytics & reporting',
        'Email support',
        'Cancel anytime after 60-day period',
        'Pay only £399 per successful apprentice placement'
      ],
      buttonText: 'Start Free Trial',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      popular: false,
      action: startTrial,
      monthlyFee: 0,
      successFee: '£399 per placement'
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '£49',
      period: 'month',
      description: 'Perfect for small businesses',
      features: [
        'Up to 5 job postings per month',
        'Basic Gen Z matching algorithm',
        'Access to verified candidates',
        'Email support',
        '1 admin user',
        'Social media integration (LinkedIn, Instagram)',
        '12% of first year salary per hire'
      ],
      buttonText: 'Choose Starter',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      popular: false,
      stripeLink: 'https://buy.stripe.com/test_00g6ou2hP5qO8Ug144',
      monthlyFee: 49,
      successFee: '12% of first year salary'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '£99',
      period: 'month',
      description: 'Most popular for growing teams',
      features: [
        'Up to 15 job postings per month',
        'Advanced AI-powered matching',
        'Priority candidate matching',
        'Priority email + chat support',
        'Custom branding',
        '3 admin users',
        'Multi-platform social posting (TikTok, Instagram, Snapchat)',
        '12% of first year salary per hire'
      ],
      buttonText: 'Choose Professional',
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
      popular: true,
      stripeLink: 'https://buy.stripe.com/test_00g6ou2hP5qO8Ug299',
      monthlyFee: 99,
      successFee: '12% of first year salary'
    },
    {
      id: 'business',
      name: 'Business',
      price: '£149',
      period: 'month',
      description: 'For established enterprises',
      features: [
        'Up to 30 job postings per month',
        'Premium Gen Z targeting',
        'Advanced AI-powered matching',
        'Phone + priority support',
        '5 admin users',
        'API access',
        'Integration with major ATS systems',
        'Custom branding & reporting',
        '12% of first year salary per hire'
      ],
      buttonText: 'Choose Business',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      popular: false,
      stripeLink: 'https://buy.stripe.com/test_00g6ou2hP5qO8Ug149',
      monthlyFee: 149,
      successFee: '12% of first year salary'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Tailored for large organizations',
      features: [
        'Unlimited job postings',
        'Dedicated account manager',
        'Custom integrations',
        'White-label solution',
        'Unlimited users',
        'Priority phone support',
        'SLA guarantees',
        '12% of first year salary per hire'
      ],
      buttonText: 'Contact Sales',
      buttonColor: 'bg-gray-600 hover:bg-gray-700',
      popular: false,
      action: () => window.open('mailto:sales@apprenticeapex.co.uk?subject=Enterprise Plan Inquiry', '_blank'),
      monthlyFee: 0,
      successFee: '12% of first year salary'
    }
  ];

  const handlePlanSelection = async (plan: any) => {
    if (plan.action) {
      plan.action();
    } else if (plan.stripeLink || plan.id) {
      try {
        const periodText = plan.period ? '/' + plan.period : '';
        const confirmMessage = `You will be redirected to Stripe to securely purchase the ${plan.name} plan for ${plan.price}${periodText}. Continue?`;

        if (confirm(confirmMessage)) {
          setLoading(true);

          // Create Stripe checkout session
          const response = await fetch('/api/subscription/create-checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              planType: plan.id,
              planName: plan.name,
              priceId: plan.stripePriceId || plan.stripeLink,
              successUrl: `${window.location.origin}/company/subscription?success=true`,
              cancelUrl: `${window.location.origin}/company/subscription?canceled=true`
            })
          });

          if (response.ok) {
            const data = await response.json();

            if (data.checkoutUrl) {
              // Show processing notification
              setNotification({
                isOpen: true,
                type: 'payment',
                title: 'Redirecting to Checkout',
                message: `Taking you to secure Stripe checkout for ${plan.name} plan...`
              });

              // Redirect to Stripe checkout
              window.location.href = data.checkoutUrl;
            } else {
              throw new Error('No checkout URL received');
            }
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create checkout session');
          }
        }
      } catch (error) {
        console.error('Error creating checkout session:', error);
        setNotification({
          isOpen: true,
          type: 'error',
          title: 'Checkout Failed',
          message: error instanceof Error ? error.message : 'Failed to initiate checkout. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (!subscriptionData) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
            Start with our 60-day risk-free trial or choose a plan that fits your hiring needs.
            All paid plans include 12% of first year salary per successful hire.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-2xl mx-auto">
            <p className="text-blue-800 text-sm font-medium">
              🎆 New Pricing Structure: All plans now feature competitive monthly rates plus a consistent 12% success fee,
              ensuring you only pay when we deliver results!
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-all duration-200 ${
                plan.popular ? 'border-orange-500 shadow-orange-100' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-600">/{plan.period}</span>}
                </div>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelection(plan)}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors ${plan.buttonColor}`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What's included in the free trial?</h4>
              <p className="text-gray-600 text-sm">Full access to our platform for 60 days. No monthly fees - only pay £399 when you successfully hire.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-600 text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600 text-sm">We accept all major credit cards, debit cards, and bank transfers through our secure Stripe integration.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Is there a setup fee?</h4>
              <p className="text-gray-600 text-sm">No setup fees ever. Start immediately with your chosen plan.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { subscription, outstandingBalance, isTrialExpired, daysLeftInTrial } = subscriptionData;

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Subscription Overview</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center"
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Upgrade Plan
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 transition-colors flex items-center"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Subscription
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Plan Details */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 ml-3">Current Plan</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {getPlanDisplayName(subscription.planType)}
            </div>
            <div className={`text-sm font-medium mb-3 ${getStatusColor(subscription.status)}`}>
              {subscription.status} {subscription.isInTrial && '(Trial)'}
            </div>
            <div className="text-gray-600 text-sm mb-1">
              Monthly: {formatCurrency(subscription.monthlyFee)}
            </div>
            <div className="text-gray-600 text-sm">
              Success Fee: {subscription.successFeeRate}% of first year salary
            </div>
          </div>

          {/* Trial Status */}
          {subscription.isInTrial && (
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 ml-3">Trial Status</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {daysLeftInTrial} days
              </div>
              <div className="text-gray-600 text-sm mb-3">remaining in trial</div>
              {isTrialExpired && (
                <div className="flex items-center mt-2 text-red-600 bg-red-100 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Trial expired</span>
                </div>
              )}
            </div>
          )}

          {/* Outstanding Balance */}
          <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <PoundSterling className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 ml-3">Outstanding</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(outstandingBalance.totalAmount)}
            </div>
            <div className="text-gray-600 text-sm mb-3">
              {outstandingBalance.count} invoice{outstandingBalance.count !== 1 ? 's' : ''}
            </div>
            {outstandingBalance.totalAmount > 0 && (
              <button className="mt-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                Pay Now →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">This Month's Usage</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-3">
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {subscription.usage.jobPostingsThisMonth}
            </div>
            <div className="text-gray-600 text-sm font-medium">Job Postings</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="p-3 bg-green-100 rounded-xl w-fit mx-auto mb-3">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {subscription.usage.usersActive}
            </div>
            <div className="text-gray-600 text-sm font-medium">Active Users</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <div className="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {subscription.usage.hiresThisMonth}
            </div>
            <div className="text-gray-600 text-sm font-medium">Successful Hires</div>
          </div>
        </div>
      </div>

      {/* Recent Billing */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Billing</h3>
          <button
            onClick={downloadInvoices}
            className="text-blue-600 hover:text-blue-700 flex items-center font-medium transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download All
          </button>
        </div>
        
        {billingHistory.length > 0 ? (
          <div className="space-y-3">
            {billingHistory.slice(0, 5).map((bill) => (
              <div key={bill._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex-1">
                  <div className="text-gray-900 font-medium mb-1">{bill.description}</div>
                  <div className="text-gray-600 text-sm">
                    {formatDate(bill.createdAt)} • Due: {formatDate(bill.dueDate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-900 font-semibold mb-1">
                    {formatCurrency(bill.amount)}
                  </div>
                  <div className={`text-xs px-3 py-1 rounded-full font-medium ${getBillingStatusColor(bill.status)}`}>
                    {bill.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">
            <div className="text-gray-400 mb-2">
              <Calendar className="w-12 h-12 mx-auto mb-3" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">No billing history yet</h4>
            <p className="text-sm">Your invoices and payment history will appear here</p>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Upgrade Your Plan</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
              {subscriptionPlans.filter(p => p.id !== 'trial').map((plan) => (
                <div
                  key={plan.id}
                  className={`border-2 rounded-xl p-6 ${
                    plan.popular ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <span className="inline-block bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
                      Recommended
                    </span>
                  )}
                  <h4 className="font-bold text-gray-900 text-xl mb-2">{plan.name}</h4>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-gray-600 text-lg">/{plan.period}</span>}
                  </div>
                  <p className="text-gray-600 mb-4">{plan.description}</p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      setShowUpgradeModal(false);
                      handlePlanSelection(plan);
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors ${plan.buttonColor}`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Need help choosing? <button
                  onClick={() => window.open('mailto:sales@apprenticeapex.co.uk?subject=Plan Selection Help', '_blank')}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Contact our sales team
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Cancel Subscription</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-800 font-medium mb-1">Important Information</h4>
                    <p className="text-yellow-700 text-sm">
                      Your subscription will remain active until the end of your current billing period
                      (30 days from your last payment). You'll continue to have full access during this time.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600">
                Are you sure you want to cancel your subscription? You can reactivate it anytime before
                the billing period ends.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={cancelSubscription}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        action={notification.action}
      />
    </div>
  );
}
