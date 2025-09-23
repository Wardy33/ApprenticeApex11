import Stripe from "stripe";

// Production Stripe Configuration
const stripeConfig = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,

  // Production settings
  currency: "gbp",
  country: "GB",

  // Live subscription plans (These would be created in Stripe Dashboard)
  plans: {
    basic: {
      priceId: "price_1QPROD_basic_monthly_2999", // Set in Stripe dashboard
      amount: 2999, // £29.99
      interval: "month" as const,
      features: [
        "Up to 10 active job postings",
        "Access to candidate database",
        "Basic AI matching",
        "Standard support",
      ],
    },
    premium: {
      priceId: "price_1QPROD_premium_monthly_4999", // Set in Stripe dashboard
      amount: 4999, // £49.99
      interval: "month" as const,
      features: [
        "Unlimited job postings",
        "Premium candidate access",
        "Advanced AI matching",
        "Video interview scheduling",
        "Priority support",
        "Analytics dashboard",
      ],
    },
    enterprise: {
      priceId: "price_1QPROD_enterprise_monthly_9999", // Set in Stripe dashboard
      amount: 9999, // £99.99
      interval: "month" as const,
      features: [
        "All Premium features",
        "Dedicated account manager",
        "Custom integrations",
        "Advanced analytics",
        "White-label options",
        "24/7 phone support",
      ],
    },
  },

  // Trial configuration
  trialPeriodDays: 14, // 14-day free trial

  // Payment methods
  paymentMethods: ["card", "sepa_debit", "bancontact"],

  // Tax configuration
  automaticTax: {
    enabled: true,
  },

  // Billing configuration
  billing: {
    invoiceSettings: {
      defaultPaymentMethod: null,
    },
    collectionMethod: "charge_automatically",
  },
};

import Stripe from "stripe";
// Initialize Stripe with live keys
export const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: "2025-06-30.basil",
});

// Create customer with trial
export async function createCustomerWithTrial(
  email: string,
  name: string,
  planId: string,
): Promise<{ customer: Stripe.Customer; subscription: Stripe.Subscription }> {
  try {
    // Create customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        environment: "production",
        created_via: "apprenticeapex",
      },
    });

    // Create subscription with trial
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: planId }],
      trial_period_days: stripeConfig.trialPeriodDays,
      automatic_tax: {
        enabled: stripeConfig.automaticTax.enabled,
      },
      collection_method: "charge_automatically",
      metadata: {
        plan_type: getPlanTypeFromPriceId(planId),
        company_id: "", // Would be set from app context
      },
    });

    return { customer, subscription };
  } catch (error) {
    console.error("Error creating customer with trial:", error);
    throw error;
  }
}

// Get plan type from price ID
function getPlanTypeFromPriceId(priceId: string): string {
  if (priceId.includes("basic")) return "basic";
  if (priceId.includes("premium")) return "premium";
  if (priceId.includes("enterprise")) return "enterprise";
  return "unknown";
}

// Handle successful payment
export async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscription = await stripe.subscriptions.retrieve(
      (invoice as any).subscription as string,
    );
    const customer = await stripe.customers.retrieve(
      subscription.customer as string,
    );

    console.log(`✅ Payment succeeded for customer: ${customer.id}`);

    // Update user subscription status in database
    // This would integrate with your Neon database

    return true;
  } catch (error) {
    console.error("Error handling payment success:", error);
    return false;
  }
}

// Handle failed payment
export async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscription = await stripe.subscriptions.retrieve(
      (invoice as any).subscription as string,
    );
    const customer = await stripe.customers.retrieve(
      subscription.customer as string,
    );

    console.log(`❌ Payment failed for customer: ${customer.id}`);

    // Send payment failure notification
    // Potentially downgrade account access

    return true;
  } catch (error) {
    console.error("Error handling payment failure:", error);
    return false;
  }
}

// Create checkout session for new subscription
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<Stripe.Checkout.Session> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types:
        stripeConfig.paymentMethods as unknown as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      automatic_tax: {
        enabled: stripeConfig.automaticTax.enabled,
      },
      subscription_data: {
        trial_period_days: stripeConfig.trialPeriodDays,
        metadata: {
          plan_type: getPlanTypeFromPriceId(priceId),
        },
      },
    });

    return session;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

// Webhook handler for production
export async function handleStripeWebhook(
  payload: string | Buffer,
  signature: string,
): Promise<void> {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeConfig.webhookSecret,
    );

    console.log(`🎣 Webhook received: ${event.type}`);

    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionCancelled(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("Webhook error:", error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`📋 Subscription created: ${subscription.id}`);
  // Activate user account features
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`📝 Subscription updated: ${subscription.id}`);
  // Update user plan features
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  console.log(`❌ Subscription cancelled: ${subscription.id}`);
  // Downgrade user account
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`✅ Checkout completed: ${session.id}`);
  // Final setup after successful payment
}

export { stripeConfig };
export default stripe;
