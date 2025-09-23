# Stripe Payment Integration - Complete Setup Guide

## 🎉 Integration Status: COMPLETE

The complete Stripe payment integration for Apprentice Apex has been successfully implemented with all required components.

## 📋 What's Been Implemented

### ✅ 1. Database Schema (Neon PostgreSQL)

- **payments** table - Stores all payment records
- **subscriptions** table - Employer subscription plans
- **job_payments** table - Links jobs to payment status
- **success_fees** table - Tracks placement success fees
- **payment_packages** table - Job posting packages (Basic, Featured, Premium, Urgent)
- **billing_events** table - Audit trail for all billing events

### ✅ 2. Backend API (Node.js/Express)

- **Payment Service** (`server/services/neonPaymentService.ts`) - Core payment logic
- **Payment Routes** (`server/routes/payments.ts`) - API endpoints for payments
- **Stripe Webhooks** (`server/routes/stripeWebhook.ts`) - Webhook event processing
- **Database Models** - Full schema with relationships and indexes

### ✅ 3. Frontend Components (React/TypeScript)

- **JobPostingPayment** component - Job posting payment flow
- **SubscriptionPayment** component - Subscription plan selection
- **Stripe Elements** integration - Secure card processing
- **Payment status** tracking and user feedback

### ✅ 4. Security & Compliance

- **Webhook signature verification** - Prevents unauthorized requests
- **Authentication middleware** - Protects all payment endpoints
- **Rate limiting** - Prevents payment abuse
- **PCI compliance** - No card data stored locally (Stripe handles all sensitive data)

## 🚀 Getting Started

### Step 1: Database Migration

Run the database migration to create payment tables:

```bash
# Option 1: Using the migration script
node server/scripts/migrate-payments-simple.mjs

# Option 2: Manual SQL execution
# Copy the SQL from server/scripts/create-payment-tables.sql
# and execute it in your Neon database console
```

### Step 2: Environment Variables

The following Stripe environment variables are already configured:

```env
STRIPE_SECRET_KEY=sk_test_51LFhal2S9YajjfvUF...
STRIPE_PUBLISHABLE_KEY=pk_test_51LFhal2S9YajjfvUF...
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

**For Production:** Replace with your live Stripe keys:

- Get keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- Use `sk_live_...` and `pk_live_...` for production

### Step 3: Webhook Configuration

Set up webhooks in your Stripe Dashboard:

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

## 💰 Payment Packages

### Job Posting Packages

| Package      | Price | Duration | Features                                       |
| ------------ | ----- | -------- | ---------------------------------------------- |
| **Basic**    | £49   | 30 days  | Standard listing, basic analytics              |
| **Featured** | £99   | 30 days  | Featured placement, logo display, priority     |
| **Premium**  | £149  | 45 days  | Social promotion, email blast, extended        |
| **Urgent**   | £199  | 60 days  | All features + urgent badge + candidate alerts |

### Subscription Plans

| Plan             | Price/Month | Job Listings | Applications | Features                               |
| ---------------- | ----------- | ------------ | ------------ | -------------------------------------- |
| **Professional** | £49         | 15           | 250          | Advanced analytics                     |
| **Business**     | £99         | 50           | 1,000        | Priority support, custom branding, API |
| **Enterprise**   | £149        | Unlimited    | Unlimited    | All features, 4% success fee discount  |

## 🔧 API Endpoints

### Payment Configuration

```http
GET /api/payments/config
Authorization: Bearer <token>
```

Returns Stripe publishable key and configuration.

### Job Posting Payment

```http
POST /api/payments/job-posting
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobId": 123,
  "packageType": "featured"
}
```

### Subscription Management

```http
POST /api/payments/subscription
Authorization: Bearer <token>
Content-Type: application/json

{
  "planType": "business",
  "paymentMethodId": "pm_card_visa"
}
```

### Payment History

```http
GET /api/payments/history?page=1&limit=20
Authorization: Bearer <token>
```

### Webhook Processing

```http
POST /api/stripe/webhook
Stripe-Signature: <webhook_signature>
Content-Type: application/json
```

## 🎨 Frontend Integration

### Using the Payment Components

#### Job Posting Payment

```tsx
import JobPostingPayment from "../components/JobPostingPayment";

function PostJobPage() {
  return (
    <JobPostingPayment
      jobId={123}
      jobTitle="Software Developer"
      onPaymentSuccess={() => {
        // Redirect to job dashboard
        navigate("/company/jobs");
      }}
      onCancel={() => {
        // Return to job editing
        navigate("/company/jobs/edit/123");
      }}
    />
  );
}
```

#### Subscription Management

```tsx
import SubscriptionPayment from "../components/SubscriptionPayment";

function SubscriptionPage() {
  return (
    <SubscriptionPayment
      currentPlan="professional"
      onSubscriptionSuccess={() => {
        // Redirect to dashboard
        navigate("/company/dashboard");
      }}
      onCancel={() => {
        // Return to settings
        navigate("/company/settings");
      }}
    />
  );
}
```

## 🔒 Security Features

### Payment Security

- ✅ **No card data storage** - All sensitive data handled by Stripe
- ✅ **Webhook signature verification** - Prevents unauthorized webhook calls
- ✅ **Rate limiting** - 20 payment requests per 15 minutes per user
- ✅ **Authentication required** - All payment endpoints require valid JWT token
- ✅ **Input validation** - All payment parameters validated server-side

### PCI Compliance

- ✅ **Stripe Elements** - PCI compliant card input forms
- ✅ **HTTPS only** - All payment traffic encrypted
- ✅ **CSP headers** - Content Security Policy includes Stripe domains
- ✅ **No card logging** - No card numbers in application logs

## 📊 Testing

### Test Card Numbers (Stripe Test Mode)

| Card Number      | Brand | Result             |
| ---------------- | ----- | ------------------ |
| 4242424242424242 | Visa  | Successful payment |
| 4000000000000002 | Visa  | Card declined      |
| 4000000000009995 | Visa  | Insufficient funds |
| 4000000000000069 | Visa  | Expired card       |

### Testing Webhooks

Use the test endpoint in development:

```http
POST /api/stripe/webhook/test
Content-Type: application/json

{
  "eventType": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_test_12345",
      "status": "succeeded"
    }
  }
}
```

## 🚨 Important Notes

### Database Migration Required

Before using the payment system, you **must** run the database migration to create the payment tables:

```bash
# Run this command to create payment tables
node server/scripts/migrate-payments-simple.mjs
```

### Environment Setup

Ensure these environment variables are set:

- `DATABASE_URL` or `NEON_DATABASE_URL` - Neon database connection
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret

### Production Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Set up production webhook endpoint
- [ ] Run database migration on production
- [ ] Test payment flow end-to-end
- [ ] Verify webhook processing
- [ ] Set up monitoring for failed payments

## 🆘 Troubleshooting

### Common Issues

#### 1. "DATABASE_URL not configured" Error

**Solution:** Set the `DATABASE_URL` environment variable:

```bash
export DATABASE_URL="postgresql://username:password@host:port/database"
```

#### 2. "Webhook signature verification failed"

**Solution:** Ensure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard.

#### 3. "Payment intent creation failed"

**Solution:** Check that Stripe keys are valid and not test keys in production.

#### 4. "Table does not exist" Error

**Solution:** Run the database migration script to create payment tables.

### Support

For payment integration support:

- Check server logs for detailed error messages
- Use Stripe Dashboard to debug webhook events
- Test with Stripe test cards before going live
- Verify environment variables are correctly set

## 🎯 Next Steps

1. **Run Database Migration** - Create payment tables in Neon
2. **Configure Production Stripe Keys** - When ready for live payments
3. **Set up Webhook Monitoring** - Track webhook delivery in production
4. **Test Payment Flows** - Verify all payment scenarios work correctly
5. **Monitor Payment Analytics** - Track conversion rates and payment success

The payment integration is now complete and ready for testing! 🚀
