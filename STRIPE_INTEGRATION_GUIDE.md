# 🎯 Stripe Production Integration Guide

## Overview

Your ApprenticeApex application now has a complete production-ready Stripe integration that replaces all mock implementations. This guide covers setup, testing, and deployment of the payment system.

## ✅ **What Was Implemented**

### 🔄 **Replaced Mock Code with Production**
- ❌ Removed all mock payment processing
- ❌ Removed demo flags and test-only implementations
- ✅ Connected to verified MongoDB Payment, User, and Application schemas
- ✅ Real Stripe API integration with comprehensive error handling

### 💳 **Payment Processing Implemented**

#### **£399 Trial Placement Payments**
- ✅ PaymentIntent creation for trial apprentice placements
- ✅ MongoDB Payment collection integration
- ✅ User trial status tracking
- ✅ Email confirmation after successful payment

#### **Monthly Subscription Processing**
- ✅ **Professional Plan**: £49/month
- ✅ **Business Plan**: £99/month  
- ✅ **Enterprise Plan**: £149/month
- ✅ Stripe customer creation using verified User schema
- ✅ Subscription management and status tracking
- ✅ Feature access control based on plan

#### **12% Success Fee Calculations**
- ✅ Automatic calculation based on first-year salary
- ✅ PaymentIntent creation for success fees
- ✅ Application record linking
- ✅ Success fee status tracking
- ✅ Plan-based discounts (Business: 2% off, Enterprise: 4% off)

### 🪝 **Comprehensive Webhook Integration**
- ✅ Webhook signature verification for security
- ✅ **payment_intent.succeeded**: Update Payment collection and user status
- ✅ **customer.subscription.created**: Update User subscription data
- ✅ **invoice.payment_failed**: Handle failed payments and notifications
- ✅ **customer.subscription.updated**: Sync subscription changes
- ✅ **customer.subscription.deleted**: Handle cancellations

### 🛡️ **Security & Compliance**
- ✅ PCI compliance features (HTTPS enforcement, secure headers)
- ✅ Stripe Elements integration (no card data storage)
- ✅ Webhook endpoint security with rate limiting
- ✅ Input validation and sanitization
- ✅ User-friendly error messages for card declines

## 🚀 **Setup Instructions**

### 1. **Environment Variables**
```bash
# Add to your .env file
STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_... for production
STRIPE_SECRET_KEY=sk_test_...       # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...     # Get from Stripe webhook configuration

# Optional: Custom price IDs (if you create your own products in Stripe)
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

### 2. **Stripe Dashboard Setup**

#### **Create Products and Prices**
1. Go to Stripe Dashboard > Products
2. Create three subscription products:
   - **Professional**: £49.00/month
   - **Business**: £99.00/month
   - **Enterprise**: £149.00/month
3. Copy the Price IDs to your environment variables (optional)

#### **Configure Webhooks**
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select these events:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### 3. **Test the Integration**
```bash
# Start your application
npm run dev

# Test configuration endpoint
curl http://localhost:3001/api/payments/config
```

## 🧪 **API Endpoints Reference**

### **Payment Configuration**
```bash
GET /api/payments/config
# Returns: publishable key, subscription plans, fee rates
```

### **Trial Placement Payments (£399)**
```bash
POST /api/payments/create-trial-intent
Content-Type: application/json
Authorization: Bearer <company_jwt_token>

{
  "metadata": {
    "companyName": "TechCorp Ltd",
    "notes": "Trial placement for software developer"
  }
}

# Response:
{
  "success": true,
  "data": {
    "clientSecret": "pi_...._secret_...",
    "paymentIntentId": "pi_...",
    "amount": 39900,
    "currency": "gbp",
    "description": "Trial Apprentice Placement Fee"
  }
}
```

### **Subscription Creation**
```bash
POST /api/payments/create-subscription
Content-Type: application/json
Authorization: Bearer <company_jwt_token>

{
  "planType": "professional",
  "paymentMethodId": "pm_..." // Optional, from Stripe Elements
}

# Response:
{
  "success": true,
  "data": {
    "subscription": {
      "id": "sub_...",
      "status": "active",
      "current_period_end": 1677721200
    },
    "subscriptionRecord": {
      "plan": "professional",
      "features": {
        "maxJobListings": 15,
        "advancedAnalytics": true
      }
    },
    "clientSecret": "seti_...._secret_..." // If payment required
  }
}
```

### **Success Fee Calculation**
```bash
POST /api/payments/calculate-success-fee
Content-Type: application/json
Authorization: Bearer <company_jwt_token>

{
  "applicationId": "64f8a1b2c3d4e5f6789abcde"
}

# Response:
{
  "success": true,
  "data": {
    "calculation": {
      "applicationId": "64f8a1b2c3d4e5f6789abcde",
      "baseAmount": 2500000,  // £25,000 annual salary in pence
      "feePercentage": 0.12,  // 12%
      "calculatedFee": 300000, // £3,000 in pence
      "currency": "GBP"
    },
    "formattedAmount": "£3,000.00"
  }
}
```

### **Success Fee Payment Intent**
```bash
POST /api/payments/create-success-fee-intent
Content-Type: application/json
Authorization: Bearer <company_jwt_token>

{
  "applicationId": "64f8a1b2c3d4e5f6789abcde",
  "metadata": {
    "candidateName": "John Doe",
    "startDate": "2024-03-01"
  }
}

# Response:
{
  "success": true,
  "data": {
    "clientSecret": "pi_...._secret_...",
    "paymentIntentId": "pi_...",
    "amount": 300000,
    "currency": "gbp",
    "calculation": {
      "baseAmount": 2500000,
      "feePercentage": 0.12,
      "calculatedFee": 300000
    }
  }
}
```

### **Payment History**
```bash
GET /api/payments/customer/:userId
Authorization: Bearer <jwt_token>

# Response:
{
  "success": true,
  "data": {
    "paymentHistory": [
      {
        "id": "...",
        "amount": 39900,
        "currency": "GBP",
        "description": "Trial Apprentice Placement Fee",
        "status": "succeeded",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "subscription": {
      "plan": "professional",
      "status": "active",
      "nextBillingDate": "2024-02-15T10:30:00Z"
    },
    "summary": {
      "totalPayments": 3,
      "totalAmount": 89800
    }
  }
}
```

### **Subscription Management**
```bash
# Update subscription
PUT /api/payments/update-subscription
Authorization: Bearer <company_jwt_token>
{
  "planType": "business"
}

# Cancel subscription
POST /api/payments/cancel-subscription
Authorization: Bearer <company_jwt_token>
{
  "cancelAtPeriodEnd": true,
  "cancellationReason": "Switching to different solution"
}
```

## 🧪 **Testing Procedures**

### **1. Test Trial Payments**
```bash
# Create a company user first
curl -X POST http://localhost:3001/api/auth/register/company \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-company@example.com",
    "password": "TestPassword123!",
    "companyName": "Test Company Ltd",
    "industry": "Technology",
    "description": "Test company for payment integration testing"
  }'

# Get JWT token from response, then test trial payment
curl -X POST http://localhost:3001/api/payments/create-trial-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "metadata": {
      "testPayment": "true"
    }
  }'
```

### **2. Test Subscriptions**
```bash
# Test subscription creation
curl -X POST http://localhost:3001/api/payments/create-subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "planType": "professional"
  }'
```

### **3. Test Success Fee Calculation**
```bash
# First create an application (you'll need user and apprenticeship IDs)
curl -X POST http://localhost:3001/api/payments/calculate-success-fee \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <company_jwt_token>" \
  -d '{
    "applicationId": "64f8a1b2c3d4e5f6789abcde"
  }'
```

### **4. Test Webhooks**
```bash
# Test webhook endpoint (development only)
curl -X POST http://localhost:3001/api/stripe/webhook/test \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "payment_intent.succeeded",
    "data": {
      "id": "pi_test123",
      "status": "succeeded"
    }
  }'

# Get webhook setup instructions
curl http://localhost:3001/api/stripe/webhook/events
```

## 🎨 **Frontend Integration**

### **Stripe Elements Setup**
```javascript
// Install Stripe.js
npm install @stripe/stripe-js

// Frontend payment component example
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_...');

// Create payment intent
const response = await fetch('/api/payments/create-trial-intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    metadata: { companyName: 'Example Company' }
  })
});

const { clientSecret } = await response.json();

// Use clientSecret with Stripe Elements
const stripe = await stripePromise;
const { error } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: 'Company Name'
    }
  }
});
```

## 🛡️ **Security Considerations**

### **Production Checklist**
- [ ] ✅ HTTPS enforced for all payment endpoints
- [ ] ✅ Webhook signature verification implemented
- [ ] ✅ Rate limiting on payment endpoints
- [ ] ✅ Input validation and sanitization
- [ ] ✅ No sensitive card data stored in database
- [ ] ✅ PCI-compliant headers set
- [ ] ✅ Stripe Elements for secure card input
- [ ] ✅ User-friendly error messages (no sensitive info)

### **Monitoring and Alerts**
```bash
# Set up monitoring for:
# - Failed webhook deliveries
# - High payment failure rates
# - Unusual payment patterns
# - Subscription churn rates

# Check payment health
curl http://localhost:3001/api/health | jq '.data.payments'
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Webhook Signature Verification Fails**
```bash
# Check webhook secret configuration
echo $STRIPE_WEBHOOK_SECRET

# Verify webhook endpoint
curl -X GET http://localhost:3001/api/stripe/webhook/events
```

#### **2. Payment Intent Creation Fails**
```bash
# Check Stripe keys
curl http://localhost:3001/api/payments/config

# Verify user authentication
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/auth/me
```

#### **3. Subscription Creation Issues**
```bash
# Check if user already has active subscription
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/payments/subscription
```

#### **4. Success Fee Calculation Errors**
```bash
# Verify application exists and has salary data
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/applications/:applicationId
```

## 📊 **Database Schema Integration**

### **User Schema Updates**
```javascript
// New fields added to User schema:
{
  stripeCustomerId: String,
  subscriptionStatus: ['active', 'cancelled', 'past_due', 'trialing', 'incomplete'],
  subscriptionPlan: ['professional', 'business', 'enterprise'],
  trialStatus: ['pending', 'paid', 'used'],
  trialPaidAt: Date
}
```

### **Payment Collection**
```javascript
// Integrated with existing Payment schema:
{
  stripePaymentIntentId: String,
  stripeCustomerId: String,
  stripeChargeId: String,
  amount: Number, // in pence
  currency: String,
  status: ['pending', 'succeeded', 'failed', 'refunded'],
  metadata: {
    trialPlacement: Boolean,
    successFee: Boolean,
    applicationId: String
  }
}
```

### **Subscription Collection**
```javascript
// Integrated with existing Subscription schema:
{
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  plan: ['professional', 'business', 'enterprise'],
  status: ['active', 'cancelled', 'past_due', 'trialing'],
  features: {
    maxJobListings: Number,
    maxApplications: Number,
    advancedAnalytics: Boolean,
    prioritySupport: Boolean
  }
}
```

## 🎯 **Next Steps**

### **Immediate Actions**
1. **Configure Stripe Dashboard** with products and webhooks
2. **Test payment flows** using Stripe test cards
3. **Set up monitoring** for payment failures and webhook issues
4. **Configure email notifications** for payment confirmations

### **Production Deployment**
1. **Switch to live Stripe keys** in production environment
2. **Configure production webhook endpoint** with HTTPS
3. **Set up monitoring and alerting** for payment issues
4. **Test end-to-end payment flows** in production

### **Optional Enhancements**
1. **Payment method management** for saved cards
2. **Invoice generation and PDF creation**
3. **Advanced subscription analytics** and reporting
4. **Dunning management** for failed payments
5. **Multi-currency support** for international expansion

---

**🎉 Success!** Your Stripe integration is now production-ready with:
- ✅ Real payment processing (no more mock data)
- ✅ Comprehensive webhook handling
- ✅ Database integration with verified schemas
- ✅ PCI-compliant security measures
- ✅ Complete API endpoint coverage
- ✅ Enhanced error handling

Your ApprenticeApex platform can now process real payments for trial placements, manage monthly subscriptions, and handle success fees automatically! 🚀
