import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import Stripe from "stripe";
import { getSecureEnvConfig } from "../config/secureEnv";

interface StripeConfig {
  secretKey: string;
  publishableKey?: string;
  webhookSecret?: string;
}

interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
  description?: string;
  paymentMethodTypes?: string[];
}

interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
}

interface JobPostingPaymentParams {
  userId: string;
  jobId: number;
  packageType: "basic" | "featured" | "premium" | "urgent";
  metadata?: Record<string, string>;
}

export class NeonPaymentService {
  private static instance: NeonPaymentService;
  public stripe: Stripe;
  private config: StripeConfig;
  public sql: any; // Neon SQL connection

  // Job posting payment packages
  public static readonly JOB_PACKAGES = {
    basic: {
      name: "Basic Job Posting",
      price: 4900, // £49.00 in pence
      currency: "gbp",
      duration_days: 30,
      features: {
        featured: false,
        priority_placement: false,
        highlighted: false,
        logo_display: false,
        social_media_promotion: false,
        email_blast: false,
        applicant_tracking: true,
        basic_analytics: true,
      },
    },
    featured: {
      name: "Featured Job Posting",
      price: 9900, // ��99.00 in pence
      currency: "gbp",
      duration_days: 30,
      features: {
        featured: true,
        priority_placement: true,
        highlighted: true,
        logo_display: true,
        social_media_promotion: false,
        email_blast: false,
        applicant_tracking: true,
        advanced_analytics: true,
        priority_support: true,
      },
    },
    premium: {
      name: "Premium Job Posting",
      price: 14900, // £149.00 in pence
      currency: "gbp",
      duration_days: 45,
      features: {
        featured: true,
        priority_placement: true,
        highlighted: true,
        logo_display: true,
        social_media_promotion: true,
        email_blast: true,
        applicant_tracking: true,
        advanced_analytics: true,
        priority_support: true,
        extended_duration: true,
      },
    },
    urgent: {
      name: "Urgent Hiring",
      price: 19900, // £199.00 in pence
      currency: "gbp",
      duration_days: 60,
      features: {
        featured: true,
        priority_placement: true,
        highlighted: true,
        logo_display: true,
        social_media_promotion: true,
        email_blast: true,
        candidate_alerts: true,
        applicant_tracking: true,
        advanced_analytics: true,
        priority_support: true,
        extended_duration: true,
        urgent_badge: true,
      },
    },
  };

  // Subscription plan configuration
  public static readonly SUBSCRIPTION_PLANS = {
    professional: {
      name: "Professional",
      price: 4900, // £49.00 in pence
      currency: "gbp",
      interval: "month",
      stripePriceId:
        process.env.STRIPE_PROFESSIONAL_PRICE_ID || "price_professional",
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
    business: {
      name: "Business",
      price: 9900, // £99.00 in pence
      currency: "gbp",
      interval: "month",
      stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || "price_business",
      features: {
        maxJobListings: 50,
        maxApplications: 1000,
        advancedAnalytics: true,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        successFeeDiscount: 0.02, // 2% discount on success fees
      },
    },
    enterprise: {
      name: "Enterprise",
      price: 14900, // £149.00 in pence
      currency: "gbp",
      interval: "month",
      stripePriceId:
        process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
      features: {
        maxJobListings: -1, // unlimited
        maxApplications: -1, // unlimited
        advancedAnalytics: true,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        successFeeDiscount: 0.04, // 4% discount on success fees
      },
    },
  };

  private constructor() {
    const env = getSecureEnvConfig();

    // Validate Stripe configuration
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is required for payment processing");
    }

    // Get database connection string
    const DATABASE_URL = env.DATABASE_URL;
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL is required for payment service");
    }

    this.config = {
      secretKey: env.STRIPE_SECRET_KEY,
      publishableKey: env.STRIPE_PUBLISHABLE_KEY || "",
      webhookSecret: env.STRIPE_WEBHOOK_SECRET || "",
    };

    this.stripe = new Stripe(this.config.secretKey, {
      apiVersion: "2025-06-30.basil",
      timeout: 10000,
      maxNetworkRetries: 3,
      telemetry: false,
      appInfo: {
        name: "ApprenticeApex",
        version: "1.0.0",
        url: env.FRONTEND_URL,
      },
    });

    // Initialize Neon connection
    this.sql = neon(DATABASE_URL);

    console.log(
      `✅ Neon Payment Service initialized successfully (${env.NODE_ENV} mode)`,
    );
    console.log(
      `🔐 Using ${env.STRIPE_SECRET_KEY.startsWith("sk_live_") ? "LIVE" : "TEST"} Stripe keys`,
    );
  }

  public static getInstance(): NeonPaymentService {
    if (!NeonPaymentService.instance) {
      NeonPaymentService.instance = new NeonPaymentService();
    }
    return NeonPaymentService.instance;
  }

  // Customer Management
  public async createCustomer(userId: string): Promise<Stripe.Customer> {
    try {
      // Get user from Neon database
      const users = await this.sql("SELECT * FROM users WHERE id = $1", [
        userId,
      ]);
      if (!users.length) {
        throw new Error("User not found");
      }
      const user = users[0];

      const customerData: Stripe.CustomerCreateParams = {
        email: user.email,
        metadata: {
          userId,
          role: user.role,
          createdVia: "apprenticeapex-platform",
        },
      };

      // Add name based on user profile
      if (user.profile) {
        const profile =
          typeof user.profile === "string"
            ? JSON.parse(user.profile)
            : user.profile;

        if (
          user.role === "candidate" &&
          profile.firstName &&
          profile.lastName
        ) {
          customerData.name = `${profile.firstName} ${profile.lastName}`;
        } else if (user.role === "company" && profile.companyName) {
          customerData.name = profile.companyName;
          customerData.description = `Company: ${profile.companyName}`;
        }

        // Add address if available
        if (profile.location) {
          customerData.address = {
            city: profile.location.city,
            postal_code: profile.location.postcode,
            country: profile.location.country || "GB",
          };
        }
      }

      const customer = await this.stripe.customers.create(customerData);

      // Update user with Stripe customer ID
      await this.sql("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [
        customer.id,
        userId,
      ]);

      console.log(
        `✅ Stripe customer created: ${customer.id} for user ${userId}`,
      );
      return customer;
    } catch (error) {
      console.error("❌ Failed to create Stripe customer:", error);
      throw error;
    }
  }

  public async getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
    try {
      // Check if user already has a Stripe customer ID
      const users = await this.sql(
        "SELECT stripe_customer_id FROM users WHERE id = $1",
        [userId],
      );
      if (!users.length) {
        throw new Error("User not found");
      }

      const user = users[0];
      if (user.stripe_customer_id) {
        try {
          const customer = await this.stripe.customers.retrieve(
            user.stripe_customer_id,
          );
          if (!customer.deleted) {
            return customer as Stripe.Customer;
          }
        } catch (error) {
          console.warn(
            `Stripe customer ${user.stripe_customer_id} not found, creating new one`,
          );
        }
      }

      // Create new customer
      return await this.createCustomer(userId);
    } catch (error) {
      console.error("❌ Failed to get or create Stripe customer:", error);
      throw error;
    }
  }

  // Job Posting Payment Processing
  public async createJobPostingPayment(
    params: JobPostingPaymentParams,
  ): Promise<{
    paymentIntent: Stripe.PaymentIntent;
    clientSecret: string;
    paymentRecord: any;
  }> {
    try {
      const { userId, jobId, packageType, metadata = {} } = params;

      const packageInfo = NeonPaymentService.JOB_PACKAGES[packageType];
      if (!packageInfo) {
        throw new Error(`Invalid package type: ${packageType}`);
      }

      const customer = await this.getOrCreateCustomer(userId);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: packageInfo.price,
        currency: packageInfo.currency,
        customer: customer.id,
        description: `${packageInfo.name} - Job Posting`,
        metadata: {
          type: "job_posting",
          userId,
          jobId: jobId.toString(),
          packageType,
          ...metadata,
        },
        payment_method_types: ["card"],
        setup_future_usage: "off_session",
      });

      // Create payment record in Neon database
      const paymentResults = await this.sql(
        `INSERT INTO payments (
          user_id, payment_type, stripe_payment_intent_id, stripe_customer_id,
          amount, currency, description, status, job_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          userId,
          "job_posting",
          paymentIntent.id,
          customer.id,
          packageInfo.price,
          packageInfo.currency,
          `${packageInfo.name} - Job Posting`,
          "pending",
          jobId,
          JSON.stringify({
            packageType,
            packageName: packageInfo.name,
            features: packageInfo.features,
            ...metadata,
          }),
        ],
      );

      const paymentRecord = paymentResults[0];

      // Create job payment record
      await this.sql(
        `INSERT INTO job_payments (
          job_id, payment_id, user_id, package_type, package_name, package_price,
          payment_status, job_status, features, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          jobId,
          paymentRecord.id,
          userId,
          packageType,
          packageInfo.name,
          packageInfo.price,
          "pending",
          "pending_payment",
          JSON.stringify(packageInfo.features),
          new Date(
            Date.now() + packageInfo.duration_days * 24 * 60 * 60 * 1000,
          ), // Calculate expiry
        ],
      );

      // Update job with payment info
      await this.sql(
        "UPDATE jobs SET payment_status = $1, payment_package = $2, payment_id = $3 WHERE id = $4",
        ["pending", packageType, paymentRecord.id, jobId],
      );

      console.log(
        `✅ Job posting payment intent created: ${paymentIntent.id} for job ${jobId}`,
      );

      return {
        paymentIntent,
        clientSecret: paymentIntent.client_secret!,
        paymentRecord,
      };
    } catch (error) {
      console.error("❌ Failed to create job posting payment:", error);
      throw error;
    }
  }

  // Subscription Processing
  public async createSubscription(
    userId: string,
    planType: "professional" | "business" | "enterprise",
    paymentMethodId?: string,
  ): Promise<{
    subscription: Stripe.Subscription;
    subscriptionRecord: any;
  }> {
    try {
      const customer = await this.getOrCreateCustomer(userId);
      const plan = NeonPaymentService.SUBSCRIPTION_PLANS[planType];

      if (!plan) {
        throw new Error(`Invalid plan type: ${planType}`);
      }

      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: [
          {
            price: plan.stripePriceId,
          },
        ],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          userId,
          planType,
          createdVia: "apprenticeapex-platform",
        },
      };

      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      const subscription =
        await this.stripe.subscriptions.create(subscriptionParams);

      // Create subscription record in Neon database
      const subscriptionResults = await this.sql(
        `INSERT INTO subscriptions (
          user_id, stripe_subscription_id, stripe_customer_id, stripe_price_id,
          plan_type, plan_name, status, amount, currency, billing_period,
          current_period_start, current_period_end, next_billing_date,
          features, usage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
        [
          userId,
          subscription.id,
          customer.id,
          plan.stripePriceId,
          planType,
          plan.name,
          subscription.status,
          plan.price,
          plan.currency,
          "monthly",
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
          new Date(subscription.current_period_end * 1000),
          JSON.stringify(plan.features),
          JSON.stringify({
            jobListings: {
              current: 0,
              limit: plan.features.maxJobListings,
              resetDate: new Date(subscription.current_period_end * 1000),
            },
            applications: {
              current: 0,
              limit: plan.features.maxApplications,
              resetDate: new Date(subscription.current_period_end * 1000),
            },
          }),
        ],
      );

      const subscriptionRecord = subscriptionResults[0];

      // Update user with subscription info
      await this.sql(
        `UPDATE users SET 
          subscription_status = $1, 
          subscription_plan = $2, 
          subscription_id = $3,
          stripe_customer_id = $4 
        WHERE id = $5`,
        [
          subscription.status,
          planType,
          subscriptionRecord.id,
          customer.id,
          userId,
        ],
      );

      console.log(
        `✅ Subscription created: ${subscription.id} for user ${userId} (${planType})`,
      );

      return {
        subscription,
        subscriptionRecord,
      };
    } catch (error) {
      console.error("❌ Failed to create subscription:", error);
      throw error;
    }
  }

  // Webhook Event Processing
  public async processWebhookEvent(
    body: Buffer,
    signature: string,
  ): Promise<void> {
    try {
      if (!this.config.webhookSecret) {
        throw new Error("Webhook secret not configured");
      }

      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.config.webhookSecret,
      );

      console.log(`🪝 Processing webhook event: ${event.type}`);

      // Log billing event
      await this.logBillingEvent(event);

      switch (event.type) {
        case "payment_intent.succeeded":
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case "customer.subscription.created":
          await this.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case "invoice.payment_failed":
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice,
          );
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        default:
          console.log(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      console.error("❌ Webhook processing failed:", error);
      throw error;
    }
  }

  private async logBillingEvent(event: Stripe.Event): Promise<void> {
    try {
      let userId = null;

      // Extract user ID from event
      if (
        event.data.object &&
        "metadata" in event.data.object &&
        event.data.object.metadata
      ) {
        userId = event.data.object.metadata.userId;
      }

      await this.sql(
        `INSERT INTO billing_events (user_id, event_type, event_data) VALUES ($1, $2, $3)`,
        [userId, event.type, JSON.stringify(event.data)],
      );
    } catch (error) {
      console.warn("Failed to log billing event:", error);
    }
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    try {
      // Update payment record
      const paymentResults = await this.sql(
        `UPDATE payments SET 
          status = 'succeeded', 
          processed_at = NOW(),
          receipt_sent = true,
          customer_notified = true,
          stripe_charge_id = $1
        WHERE stripe_payment_intent_id = $2 RETURNING *`,
        [ (typeof paymentIntent.latest_charge === "string"
            ? paymentIntent.latest_charge
            : (paymentIntent.latest_charge as any)?.id) || (paymentIntent as any).charges?.data?.[0]?.id || null,
          paymentIntent.id],
      );

      if (!paymentResults.length) {
        console.warn(
          `Payment record not found for payment intent: ${paymentIntent.id}`,
        );
        return;
      }

      const payment = paymentResults[0];

      // Handle job posting payments
      if (payment.payment_type === "job_posting" && payment.job_id) {
        await this.activateJobPosting(payment.job_id, payment.id);
      }

      console.log(`✅ Payment intent succeeded processed: ${paymentIntent.id}`);
    } catch (error) {
      console.error(
        `❌ Failed to handle payment intent succeeded: ${paymentIntent.id}`,
        error,
      );
      throw error;
    }
  }

  private async activateJobPosting(
    jobId: number,
    paymentId: number,
  ): Promise<void> {
    try {
      // Update job status to active
      await this.sql(
        `UPDATE jobs SET 
          payment_status = 'paid',
          status = 'active',
          published_at = NOW()
        WHERE id = $1`,
        [jobId],
      );

      // Update job payment status
      await this.sql(
        `UPDATE job_payments SET 
          payment_status = 'paid',
          job_status = 'active',
          activated_at = NOW()
        WHERE job_id = $1 AND payment_id = $2`,
        [jobId, paymentId],
      );

      console.log(`✅ Job posting activated: ${jobId}`);
    } catch (error) {
      console.error(`❌ Failed to activate job posting: ${jobId}`, error);
      throw error;
    }
  }

  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    try {
      await this.sql(
        `UPDATE subscriptions SET 
          status = $1,
          current_period_start = $2,
          current_period_end = $3,
          next_billing_date = $4
        WHERE stripe_subscription_id = $5`,
        [
          subscription.status,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
          new Date(subscription.current_period_end * 1000),
          subscription.id,
        ],
      );

      console.log(`✅ Subscription created processed: ${subscription.id}`);
    } catch (error) {
      console.error(
        `❌ Failed to handle subscription created: ${subscription.id}`,
        error,
      );
      throw error;
    }
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    try {
      await this.sql(
        `UPDATE subscriptions SET 
          status = $1,
          current_period_start = $2,
          current_period_end = $3,
          next_billing_date = $4,
          cancelled_at = $5
        WHERE stripe_subscription_id = $6`,
        [
          subscription.status,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
          new Date(subscription.current_period_end * 1000),
          subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : null,
          subscription.id,
        ],
      );

      console.log(`✅ Subscription updated processed: ${subscription.id}`);
    } catch (error) {
      console.error(
        `❌ Failed to handle subscription updated: ${subscription.id}`,
        error,
      );
      throw error;
    }
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    try {
      if (invoice.subscription) {
        await this.sql(
          "UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2",
          ["past_due", invoice.subscription],
        );
        console.log(
          `⚠️ Payment failed for subscription: ${invoice.subscription}`,
        );
      }
    } catch (error) {
      console.error(
        `❌ Failed to handle invoice payment failed: ${invoice.id}`,
        error,
      );
      throw error;
    }
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    try {
      await this.sql(
        `UPDATE subscriptions SET 
          status = 'cancelled',
          cancelled_at = NOW()
        WHERE stripe_subscription_id = $1`,
        [subscription.id],
      );

      console.log(`✅ Subscription deleted processed: ${subscription.id}`);
    } catch (error) {
      console.error(
        `❌ Failed to handle subscription deleted: ${subscription.id}`,
        error,
      );
      throw error;
    }
  }

  // Utility Methods
  public async getPublishableKey(): Promise<string> {
    if (!this.config.publishableKey) {
      throw new Error("Stripe publishable key not configured");
    }
    return this.config.publishableKey;
  }

  public async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const payments = await this.sql(
        `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [userId],
      );
      return payments;
    } catch (error) {
      console.error("❌ Failed to get payment history:", error);
      throw error;
    }
  }

  public async getJobPaymentPackages(): Promise<any[]> {
    try {
      const packages = await this.sql(
        "SELECT * FROM payment_packages WHERE active = true ORDER BY sort_order, price",
      );
      return packages;
    } catch (error) {
      console.error("❌ Failed to get payment packages:", error);
      throw error;
    }
  }
}

export default NeonPaymentService;
