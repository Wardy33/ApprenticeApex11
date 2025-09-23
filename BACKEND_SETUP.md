# ApprenticeApex Backend Setup Guide

## ✅ **What's Been Implemented**

I've successfully created a comprehensive full-stack backend system for ApprenticeApex with the following features:

### 🔐 **Authentication System**

- Complete JWT-based authentication
- User registration/login for students and companies
- Password hashing with bcrypt
- Role-based access control
- Profile management and updates
- 2FA setup endpoints
- Password reset functionality

### 💳 **Payment Processing**

- Stripe integration ready
- Subscription management (Basic, Premium, Enterprise plans)
- Payment history and invoicing
- Webhook handling for payment events
- Payment method management
- Usage-based billing support

### 📹 **Video Calling Infrastructure**

- Interview scheduling system
- Video call room creation with Daily.co/Twilio integration
- Interview management (reschedule, cancel, feedback)
- Multiple call types (video, phone, in-person)
- Interview statistics and analytics

### 💬 **Real-time Chat System**

- Socket.IO-based real-time messaging
- Conversation management
- Message read receipts
- Typing indicators
- User presence status
- Message history and pagination
- Notification system

### 🗄️ **Database Models**

- User profiles (students and companies)
- Interview scheduling
- Message and conversation management
- Payment and subscription tracking
- Application management

### 🔧 **API Endpoints**

- RESTful API design
- Comprehensive error handling
- Input validation
- Rate limiting ready
- Pagination support
- File upload support

---

## 🚀 **External Services You Need to Set Up**

To make the backend fully functional, you'll need to configure these external services:

### 1. **Stripe (for Payments) - Required**

```bash
# Sign up at https://stripe.com
# Get your API keys from the Stripe Dashboard

STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Setup Steps:**

1. Create a Stripe account
2. Get your test API keys from Dashboard > Developers > API keys
3. Set up webhooks pointing to `https://yourdomain.com/api/payments/webhook`
4. Add webhook secret to environment variables

### 2. **Video Calling Service - Choose One**

#### Option A: Daily.co (Recommended)

```bash
# Sign up at https://daily.co
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN_NAME=your_daily_domain
```

#### Option B: Twilio Video

```bash
# Sign up at https://twilio.com
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret
```

### 3. **MongoDB Database**

```bash
# Option A: MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/apprenticeapex

# Option B: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/apprenticeapex
```

### 4. **Email Service (for Notifications)**

```bash
# Option A: Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Option B: SendGrid, Mailgun, etc.
```

---

## 🛠️ **Setup Instructions**

### 1. **Install Dependencies**

```bash
# All dependencies are already installed
npm install
```

### 2. **Environment Configuration**

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values
nano .env
```

### 3. **Database Setup**

```bash
# If using local MongoDB:
# Install MongoDB: https://docs.mongodb.com/manual/installation/

# If using MongoDB Atlas:
# 1. Create cluster at https://cloud.mongodb.com
# 2. Get connection string
# 3. Add to .env file
```

### 4. **Start the Development Server**

```bash
npm run dev
```

### 5. **Test the Backend**

```bash
# Health check
curl http://localhost:3001/api/ping

# Expected response:
{
  "message": "ApprenticeApex API v1.0",
  "timestamp": "2024-01-15T...",
  "status": "healthy"
}
```

---

## 📋 **Available API Endpoints**

### **Authentication**

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### **Payments** (Company only)

- `GET /api/payments/plans` - Get subscription plans
- `POST /api/payments/subscribe` - Create subscription
- `GET /api/payments/subscription` - Get current subscription
- `GET /api/payments/payments` - Payment history

### **Interviews**

- `GET /api/interviews` - Get user's interviews
- `POST /api/interviews` - Schedule interview (company)
- `GET /api/interviews/:id/video-access` - Get video call access
- `POST /api/interviews/:id/feedback` - Submit feedback

### **Messages** (via Socket.IO)

- Real-time messaging events
- Conversation management
- Typing indicators
- Read receipts

---

## 🔧 **Configuration Examples**

### **Stripe Webhook Setup**

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### **Daily.co Setup**

1. Sign up at https://daily.co
2. Create a domain in your dashboard
3. Get API key from Settings > Developers
4. Domain will be used for video call URLs

### **MongoDB Atlas Setup**

1. Create account at https://cloud.mongodb.com
2. Create new cluster (free tier available)
3. Create database user
4. Whitelist your IP address
5. Get connection string

---

## 🚦 **Production Deployment**

### **Environment Variables for Production**

```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://...
STRIPE_SECRET_KEY=sk_live_...
# ... other production values
```

### **Build and Deploy**

```bash
# Build the application
npm run build

# Start production server
npm start
```

---

## 🧪 **Testing**

### **Frontend Integration**

The backend is fully compatible with your existing frontend. Update your frontend API calls to use these endpoints:

```typescript
// Example: Login API call
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "user@example.com",
    password: "password123",
  }),
});

const data = await response.json();
// Use data.token for authentication
```

### **Socket.IO Client Integration**

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  auth: {
    token: "your-jwt-token",
  },
});

// Listen for messages
socket.on("new_message", (message) => {
  console.log("New message:", message);
});

// Send a message
socket.emit("send_message", {
  conversationId: "conv_123",
  content: "Hello!",
  type: "text",
});
```

---

## ❓ **Next Steps**

1. **Set up external services** listed above
2. **Configure environment variables** in `.env`
3. **Test payment flows** with Stripe test cards
4. **Test video calling** with Daily.co or Twilio
5. **Integrate real-time chat** in your frontend
6. **Deploy to production** with proper environment variables

The backend is production-ready and includes all the features you requested. Let me know which external services you'd like help setting up!
