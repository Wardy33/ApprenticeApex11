import Stripe from 'stripe';
import Stripe from 'stripe';
import { getSecureEnvConfig } from '../config/secureEnv';
import { User } from '../models/User';
import { Payment } from '../models/Payment';
import { Subscription } from '../models/Subscription';
import { Application } from '../models/Application';
import { Apprenticeship } from '../models/Apprenticeship';
import EmailService from './emailService';

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

interface SuccessFeeCalculation {
  applicationId: string;
  baseAmount: number;
  feePercentage: number;
  calculatedFee: number;
  currency: string;
}

export class StripeService {
  private static instance: StripeService;
  private stripe: Stripe;
  private config: StripeConfig;

  // Subscription plan configuration aligned with your requirements
  public static readonly SUBSCRIPTION_PLANS = {
    professional: {
      name: 'Professional',
      price: 4900, // £49.00 in pence
      currency: 'gbp',
      interval: 'month',
      stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
      features: {
        maxJobListings: 15,
        maxApplications: 250,
        advancedAnalytics: true,
        prioritySupport: false,
        customBranding: false,
        apiAccess: false,
        successFeeDiscount: 0
      }
    },
    business: {
      name: 'Business',
      price: 9900, // £99.00 in pence
      currency: 'gbp',
      interval: 'month',
      stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business',
      features: {
        maxJobListings: 50,
        maxApplications: 1000,
        advancedAnalytics: true,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        successFeeDiscount: 0.02 // 2% discount on success fees
      }
    },
    enterprise: {
      name: 'Enterprise',
      price: 14900, // £149.00 in pence
      currency: 'gbp',
      interval: 'month',
      stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
      features: {
        maxJobListings: -1, // unlimited
        maxApplications: -1, // unlimited
        advancedAnalytics: true,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        successFeeDiscount: 0.04 // 4% discount on success fees
      }
    }
  };

  // Trial placement fee configuration
  public static readonly TRIAL_PLACEMENT_FEE = {
    amount: 39900, // £399.00 in pence
    currency: 'gbp',
    description: 'Trial Apprentice Placement Fee'
  };

  // Success fee configuration (12% of first-year salary)
  public static readonly SUCCESS_FEE_PERCENTAGE = 0.12; // 12%

  private constructor() {
    const env = getSecureEnvConfig();

    // Validate Stripe configuration
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required for payment processing');
    }

    // Production security validation
    if (env.NODE_ENV === 'production') {
      if (!env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
        throw new Error('Production requires live Stripe secret key (sk_live_...)');
      }
      if (!env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_')) {
        throw new Error('Production requires live Stripe publishable key (pk_live_...)');
      }
      if (!env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')) {
        throw new Error('Production requires valid Stripe webhook secret (whsec_...)');
      }
    } else {
      // Development validation
      if (!env.STRIPE_SECRET_KEY.startsWith('sk_test_') && !env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
        throw new Error('Invalid Stripe secret key format');
      }
    }

    this.config = {
      secretKey: env.STRIPE_SECRET_KEY,
      publishableKey: env.STRIPE_PUBLISHABLE_KEY || '',
      webhookSecret: env.STRIPE_WEBHOOK_SECRET || ''
    };

    this.stripe = new Stripe(this.config.secretKey, {
      apiVersion: '2025-06-30.basil',
      timeout: 10000, // 10 second timeout
      maxNetworkRetries: 3,
      telemetry: false, // Disable telemetry for privacy
      appInfo: {
        name: 'ApprenticeApex',
        version: '1.0.0',
        url: env.FRONTEND_URL
      }
    });

    console.log(`✅ Stripe service initialized successfully (${env.NODE_ENV} mode)`);
    console.log(`🔐 Using ${env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST'} Stripe keys`);
  }

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  // Customer Management
  public async createCustomer(userId: string): Promise<Stripe.Customer> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const customerData: Stripe.CustomerCreateParams = {
        email: user.email,
        metadata: {
          userId,
          role: user.role,
          createdVia: 'apprenticeapex-platform'
        }
      };

      // Add name based on user role
      if (user.role === 'student' && user.profile.firstName && user.profile.lastName) {
        customerData.name = `${user.profile.firstName} ${user.profile.lastName}`;
      } else if (user.role === 'company' && user.profile.companyName) {
        customerData.name = user.profile.companyName;
        customerData.description = `Company: ${user.profile.companyName}`;
      }

      // Add address if available
      if (user.profile.location) {
        customerData.address = {
          city: user.profile.location.city,
          postal_code: user.profile.location.postcode,
          country: user.profile.location.country || 'GB'
        };
      }

      const customer = await this.stripe.customers.create(customerData);

      // Update user with Stripe customer ID
      await User.findByIdAndUpdate(userId, {
        'stripeCustomerId': customer.id
      });

      console.log(`✅ Stripe customer created: ${customer.id} for user ${userId}`);
      return customer;

    } catch (error) {
      console.error('❌ Failed to create Stripe customer:', error);
      throw error;
    }
  }

  public async getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user already has a Stripe customer ID
      if (user.stripeCustomerId) {
        try {
          const customer = await this.stripe.customers.retrieve(user.stripeCustomerId);
          if (!customer.deleted) {
            return customer as Stripe.Customer;
          }
        } catch (error) {
          console.warn(`Stripe customer ${user.stripeCustomerId} not found, creating new one`);
        }
      }

      // Create new customer
      return await this.createCustomer(userId);

    } catch (error) {
      console.error('❌ Failed to get or create Stripe customer:', error);
      throw error;
    }
  }

  // Trial Payment Processing (£399 one-time payments)
  public async createTrialPaymentIntent(userId: string, metadata: Record<string, string> = {}): Promise<{
    paymentIntent: Stripe.PaymentIntent;
    clientSecret: string;
    paymentRecord: any;
  }> {
    try {
      const customer = await this.getOrCreateCustomer(userId);

      const paymentIntentParams: CreatePaymentIntentParams = {
        amount: StripeService.TRIAL_PLACEMENT_FEE.amount,
        currency: StripeService.TRIAL_PLACEMENT_FEE.currency,
        customerId: customer.id,
        description: StripeService.TRIAL_PLACEMENT_FEE.description,
        metadata: {
          type: 'trial_placement',
          userId,
          ...metadata
        },
        paymentMethodTypes: ['card']
      };

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: paymentIntentParams.amount,
        currency: paymentIntentParams.currency,
        customer: paymentIntentParams.customerId,
        description: paymentIntentParams.description,
        metadata: paymentIntentParams.metadata,
        payment_method_types: paymentIntentParams.paymentMethodTypes || ['card'],
        setup_future_usage: 'off_session'
      });

      // Create payment record in database
      const paymentRecord = new Payment({
        userId,
        amount: paymentIntentParams.amount,
        currency: paymentIntentParams.currency,
        description: paymentIntentParams.description,
        type: 'one_time',
        paymentMethodType: 'card',
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customer.id,
        metadata: {
          ...paymentIntentParams.metadata,
          trialPlacement: true
        }
      });

      await paymentRecord.save();

      console.log(`✅ Trial payment intent created: ${paymentIntent.id} for user ${userId}`);

      return {
        paymentIntent,
        clientSecret: paymentIntent.client_secret!,
        paymentRecord
      };

    } catch (error) {
      console.error('❌ Failed to create trial payment intent:', error);
      throw error;
    }
  }

  // Subscription Processing (£49, £99, £149 monthly plans)
  public async createSubscription(
    userId: string, 
    planType: 'professional' | 'business' | 'enterprise',
    paymentMethodId?: string
  ): Promise<{
    subscription: Stripe.Subscription;
    subscriptionRecord: any;
  }> {
    try {
      const customer = await this.getOrCreateCustomer(userId);
      const plan = StripeService.SUBSCRIPTION_PLANS[planType];

      if (!plan) {
        throw new Error(`Invalid plan type: ${planType}`);
      }

      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: [{
          price: plan.stripePriceId
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
          planType,
          createdVia: 'apprenticeapex-platform'
        }
      };

      if (paymentMethodId) {
        subscriptionParams.default_payment_method = paymentMethodId;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);

      // Create subscription record in database
      const subscriptionRecord = new Subscription({
        userId,
        plan: planType,
        planName: plan.name,
        status: subscription.status as any,
        billingPeriod: 'monthly',
        amount: plan.price,
        currency: plan.currency,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        stripePriceId: plan.stripePriceId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        nextBillingDate: new Date(subscription.current_period_end * 1000),
        features: {
          maxJobListings: plan.features.maxJobListings,
          maxApplications: plan.features.maxApplications,
          maxUsers: 1,
          advancedAnalytics: plan.features.advancedAnalytics,
          prioritySupport: plan.features.prioritySupport,
          customBranding: plan.features.customBranding,
          apiAccess: plan.features.apiAccess,
          bulkOperations: plan.features.apiAccess,
          exportData: true,
          webhooks: plan.features.apiAccess,
          sso: false,
          auditLogs: plan.features.prioritySupport
        },
        usage: {
          jobListings: {
            current: 0,
            limit: plan.features.maxJobListings,
            resetDate: new Date(subscription.current_period_end * 1000)
          },
          applications: {
            current: 0,
            limit: plan.features.maxApplications,
            resetDate: new Date(subscription.current_period_end * 1000)
          },
          users: {
            current: 1,
            limit: 1
          },
          apiCalls: {
            current: 0,
            limit: plan.features.apiAccess ? 10000 : 0,
            resetDate: new Date(subscription.current_period_end * 1000)
          },
          storage: {
            current: 0,
            limit: 5000 // 5GB
          }
        }
      });

      await subscriptionRecord.save();

      // Update user with subscription info
      await User.findByIdAndUpdate(userId, {
        'subscriptionStatus': subscription.status,
        'subscriptionPlan': planType,
        'stripeCustomerId': customer.id
      });

      console.log(`✅ Subscription created: ${subscription.id} for user ${userId} (${planType})`);

      return {
        subscription,
        subscriptionRecord
      };

    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
      throw error;
    }
  }

  // Success Fee Calculation and Processing (12% of first-year salary)
  public async calculateSuccessFee(applicationId: string): Promise<SuccessFeeCalculation> {
    try {
      const application = await Application.findById(applicationId)
        .populate('apprenticeshipId')
        .populate('userId');

      if (!application) {
        throw new Error('Application not found');
      }

      const apprenticeship = application.apprenticeshipId as any;
      if (!apprenticeship || !apprenticeship.salary) {
        throw new Error('Apprenticeship salary information not found');
      }

      // Calculate annual salary (use average of min/max if both provided)
      let annualSalary = 0;
      if (apprenticeship.salary.period === 'annually') {
        annualSalary = apprenticeship.salary.min && apprenticeship.salary.max ?
          (apprenticeship.salary.min + apprenticeship.salary.max) / 2 :
          apprenticeship.salary.min || apprenticeship.salary.max;
      } else if (apprenticeship.salary.period === 'monthly') {
        const monthlySalary = apprenticeship.salary.min && apprenticeship.salary.max ?
          (apprenticeship.salary.min + apprenticeship.salary.max) / 2 :
          apprenticeship.salary.min || apprenticeship.salary.max;
        annualSalary = monthlySalary * 12;
      } else if (apprenticeship.salary.period === 'weekly') {
        const weeklySalary = apprenticeship.salary.min && apprenticeship.salary.max ?
          (apprenticeship.salary.min + apprenticeship.salary.max) / 2 :
          apprenticeship.salary.min || apprenticeship.salary.max;
        annualSalary = weeklySalary * 52;
      } else if (apprenticeship.salary.period === 'hourly') {
        const hourlySalary = apprenticeship.salary.min && apprenticeship.salary.max ?
          (apprenticeship.salary.min + apprenticeship.salary.max) / 2 :
          apprenticeship.salary.min || apprenticeship.salary.max;
        // Assume 37.5 hours/week, 52 weeks/year
        annualSalary = hourlySalary * 37.5 * 52;
      }

      if (annualSalary <= 0) {
        throw new Error('Unable to calculate annual salary from apprenticeship data');
      }

      // Apply any subscription discounts
      let feePercentage = StripeService.SUCCESS_FEE_PERCENTAGE;
      const user = application.userId as any;
      if (user?.subscriptionPlan) {
        const plan = StripeService.SUBSCRIPTION_PLANS[user.subscriptionPlan as keyof typeof StripeService.SUBSCRIPTION_PLANS];
        if (plan?.features.successFeeDiscount) {
          feePercentage -= plan.features.successFeeDiscount;
        }
      }

      const calculatedFee = Math.round(annualSalary * feePercentage);

      return {
        applicationId,
        baseAmount: annualSalary,
        feePercentage,
        calculatedFee,
        currency: apprenticeship.salary.currency || 'GBP'
      };

    } catch (error) {
      console.error('❌ Failed to calculate success fee:', error);
      throw error;
    }
  }

  public async createSuccessFeePaymentIntent(
    applicationId: string,
    companyUserId: string,
    metadata: Record<string, string> = {}
  ): Promise<{
    paymentIntent: Stripe.PaymentIntent;
    clientSecret: string;
    successFeeCalculation: SuccessFeeCalculation;
    paymentRecord: any;
  }> {
    try {
      const successFeeCalc = await this.calculateSuccessFee(applicationId);
      const customer = await this.getOrCreateCustomer(companyUserId);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: successFeeCalc.calculatedFee,
        currency: successFeeCalc.currency.toLowerCase(),
        customer: customer.id,
        description: `Success Fee - Application ${applicationId}`,
        metadata: {
          type: 'success_fee',
          applicationId,
          companyUserId,
          baseAmount: successFeeCalc.baseAmount.toString(),
          feePercentage: successFeeCalc.feePercentage.toString(),
          ...metadata
        },
        payment_method_types: ['card']
      });

      // Create payment record in database
      const paymentRecord = new Payment({
        userId: companyUserId,
        amount: successFeeCalc.calculatedFee,
        currency: successFeeCalc.currency,
        description: `Success Fee - Application ${applicationId}`,
        type: 'one_time',
        paymentMethodType: 'card',
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customer.id,
        metadata: {
          ...paymentIntent.metadata,
          successFee: true,
          applicationId
        }
      });

      await paymentRecord.save();

      console.log(`✅ Success fee payment intent created: ${paymentIntent.id} for application ${applicationId}`);

      return {
        paymentIntent,
        clientSecret: paymentIntent.client_secret!,
        successFeeCalculation: successFeeCalc,
        paymentRecord
      };

    } catch (error) {
      console.error('❌ Failed to create success fee payment intent:', error);
      throw error;
    }
  }

  // Webhook Event Processing
  public async processWebhookEvent(body: Buffer, signature: string): Promise<void> {
    try {
      // Security validations
      if (!this.config.webhookSecret) {
        throw new Error('Webhook secret not configured - cannot verify webhook authenticity');
      }

      if (!signature) {
        throw new Error('Webhook signature missing - potential security threat');
      }

      if (!body || body.length === 0) {
        throw new Error('Webhook body empty - invalid request');
      }

      // Additional security: validate signature format
      if (!signature.startsWith('t=') || !signature.includes('v1=')) {
        throw new Error('Invalid webhook signature format');
      }

      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.config.webhookSecret
      );

      console.log(`��� Processing webhook event: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        default:
          console.log(`Unhandled webhook event: ${event.type}`);
      }

    } catch (error) {
      console.error('❌ Webhook processing failed:', error);
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntent.id
      });

      if (!payment) {
        console.warn(`Payment record not found for payment intent: ${paymentIntent.id}`);
        return;
      }

      // Update payment status
      payment.status = 'succeeded';
      payment.processedAt = new Date();
      payment.receiptSent = true;
      payment.customerNotified = true;

      const chargeId = typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : (paymentIntent.latest_charge as any)?.id;
      if (chargeId) {
        payment.stripeChargeId = chargeId as string;
      }

      await payment.save();

      // Handle specific payment types
      if (payment.metadata?.successFee && payment.metadata?.applicationId) {
        // Update application status for success fee payment
        await Application.findByIdAndUpdate(payment.metadata.applicationId, {
          'successFeeStatus': 'paid',
          'successFeePaidAt': new Date()
        });
      }

      if (payment.metadata?.trialPlacement) {
        // Update user trial status
        await User.findByIdAndUpdate(payment.userId, {
          'trialStatus': 'paid',
          'trialPaidAt': new Date()
        });
      }

      // Send payment confirmation email
      try {
        const user = await User.findById(payment.userId);
        if (user) {
          await EmailService.getInstance().sendPaymentConfirmation(user, payment);
          console.log(`📧 Payment confirmation email sent to ${user.email}`);
        }
      } catch (emailError) {
        console.warn('⚠️  Failed to send payment confirmation email:', emailError);
      }

      console.log(`✅ Payment intent succeeded processed: ${paymentIntent.id}`);

    } catch (error) {
      console.error(`❌ Failed to handle payment intent succeeded: ${paymentIntent.id}`, error);
      throw error;
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const subscriptionRecord = await Subscription.findOne({
        stripeSubscriptionId: subscription.id
      });

      if (subscriptionRecord) {
        subscriptionRecord.status = subscription.status as any;
        subscriptionRecord.currentPeriodStart = new Date(subscription.current_period_start * 1000);
        subscriptionRecord.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        subscriptionRecord.nextBillingDate = new Date(subscription.current_period_end * 1000);
        
        await subscriptionRecord.save();

        // Update user subscription status
        await User.findByIdAndUpdate(subscriptionRecord.userId, {
          'subscriptionStatus': subscription.status
        });

        // Send subscription confirmation email
        try {
          const user = await User.findById(subscriptionRecord.userId);
          if (user) {
            await EmailService.getInstance().sendEmail({
              to: user.email,
              subject: 'Your subscription is active',
              html: `<p>Hi,</p><p>Your subscription (${subscriptionRecord.planName}) is now active.</p>`,
              text: `Your subscription (${subscriptionRecord.planName}) is now active.`
            });
            console.log(`📧 Subscription confirmation email sent to ${user.email}`);
          }
        } catch (emailError) {
          console.warn('⚠️  Failed to send subscription confirmation email:', emailError);
        }
      }

      console.log(`✅ Subscription created processed: ${subscription.id}`);

    } catch (error) {
      console.error(`❌ Failed to handle subscription created: ${subscription.id}`, error);
      throw error;
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const subscriptionRecord = await Subscription.findOne({
        stripeSubscriptionId: subscription.id
      });

      if (subscriptionRecord) {
        subscriptionRecord.status = subscription.status as any;
        subscriptionRecord.currentPeriodStart = new Date(subscription.current_period_start * 1000);
        subscriptionRecord.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        subscriptionRecord.nextBillingDate = new Date(subscription.current_period_end * 1000);
        
        if (subscription.canceled_at) {
          subscriptionRecord.cancelledAt = new Date(subscription.canceled_at * 1000);
        }

        await subscriptionRecord.save();

        // Update user subscription status
        await User.findByIdAndUpdate(subscriptionRecord.userId, {
          'subscriptionStatus': subscription.status
        });
      }

      console.log(`✅ Subscription updated processed: ${subscription.id}`);

    } catch (error) {
      console.error(`❌ Failed to handle subscription updated: ${subscription.id}`, error);
      throw error;
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      if (invoice.subscription) {
        const subscriptionRecord = await Subscription.findOne({
          stripeSubscriptionId: invoice.subscription
        });

        if (subscriptionRecord) {
          subscriptionRecord.status = 'past_due';
          await subscriptionRecord.save();

          // Update user subscription status
          await User.findByIdAndUpdate(subscriptionRecord.userId, {
            'subscriptionStatus': 'past_due'
          });

          // TODO: Send payment failure notification email
          console.log(`⚠️ Payment failed for subscription: ${invoice.subscription}`);
        }
      }

    } catch (error) {
      console.error(`❌ Failed to handle invoice payment failed: ${invoice.id}`, error);
      throw error;
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      const subscriptionRecord = await Subscription.findOne({
        stripeSubscriptionId: subscription.id
      });

      if (subscriptionRecord) {
        subscriptionRecord.status = 'cancelled';
        subscriptionRecord.cancelledAt = new Date();
        await subscriptionRecord.save();

        // Update user subscription status
        await User.findByIdAndUpdate(subscriptionRecord.userId, {
          'subscriptionStatus': 'cancelled'
        });
      }

      console.log(`✅ Subscription deleted processed: ${subscription.id}`);

    } catch (error) {
      console.error(`❌ Failed to handle subscription deleted: ${subscription.id}`, error);
      throw error;
    }
  }

  // Utility Methods
  public async getPublishableKey(): Promise<string> {
    if (!this.config.publishableKey) {
      throw new Error('Stripe publishable key not configured');
    }
    return this.config.publishableKey;
  }

  public async getCustomerPaymentHistory(userId: string): Promise<any[]> {
    try {
      const payments = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      return payments;

    } catch (error) {
      console.error('❌ Failed to get payment history:', error);
      throw error;
    }
  }

  public async updateSubscription(
    userId: string, 
    newPlanType: 'professional' | 'business' | 'enterprise'
  ): Promise<{ subscription: Stripe.Subscription; subscriptionRecord: any }> {
    try {
      const subscriptionRecord = await Subscription.findOne({
        userId,
        status: { $in: ['active', 'trialing'] }
      });

      if (!subscriptionRecord) {
        throw new Error('No active subscription found');
      }

      const newPlan = StripeService.SUBSCRIPTION_PLANS[newPlanType];
      if (!newPlan) {
        throw new Error(`Invalid plan type: ${newPlanType}`);
      }

      // Get the subscription from Stripe
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionRecord.stripeSubscriptionId);

      // Update the subscription
      const updatedSubscription = await this.stripe.subscriptions.update(
        subscription.id,
        {
          items: [{
            id: subscription.items.data[0].id,
            price: newPlan.stripePriceId
          }],
          proration_behavior: 'create_prorations'
        }
      );

      // Update database record
      subscriptionRecord.plan = newPlanType;
      subscriptionRecord.planName = newPlan.name;
      subscriptionRecord.amount = newPlan.price;
      await subscriptionRecord.save();

      // Update user record
      await User.findByIdAndUpdate(userId, {
        'subscriptionPlan': newPlanType
      });

      console.log(`✅ Subscription updated: ${subscription.id} to ${newPlanType}`);

      return {
        subscription: updatedSubscription,
        subscriptionRecord
      };

    } catch (error) {
      console.error('❌ Failed to update subscription:', error);
      throw error;
    }
  }
}

// Export singleton instance
// Export the service class (not instance to avoid early initialization)
export { StripeService as default };

// Export types and constants (StripeService class already exported above)
export type { CreatePaymentIntentParams, CreateSubscriptionParams, SuccessFeeCalculation };
