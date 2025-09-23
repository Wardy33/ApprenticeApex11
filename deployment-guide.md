# Deployment Configuration Guide

## Security Fixes Applied ✅

### Fixed Issues:
1. **Dockerfile Security**: Removed `.env` file copying to prevent secret exposure
2. **Production Command**: Updated to use `npm run start:production`
3. **Dependencies**: Updated Vite to fix security vulnerability
4. **Environment Variables**: Removed hardcoded secrets from production files

## Environment Variable Setup

### Required Environment Variables

Set these in your deployment platform (Vercel, Netlify, Docker, etc.):

```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
NEON_PROJECT_ID="your-neon-project-id"

# JWT (REQUIRED - Generate 64+ character random string)
JWT_SECRET="your-secure-64-plus-character-jwt-secret-here"

# Stripe (REQUIRED - Use live keys for production)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Google OAuth (REQUIRED)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Email Service (REQUIRED)
EMAIL_SERVICE_API_KEY="your-email-service-api-key"

# Admin (REQUIRED - Generate secure random values)
MASTER_ADMIN_CODE="your-secure-admin-code"
MASTER_ADMIN_SETUP_CODE="your-secure-setup-code"
SESSION_SECRET="your-64-plus-character-session-secret"
```

### Generate Secure Secrets

Use these commands to generate secure secrets:

```bash
# JWT Secret (64+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Admin codes (32 characters each)
node -e "console.log(require('crypto').randomBytes(16).toString('hex').toUpperCase())"

# Session secret (64+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment Platforms

### Docker Deployment

1. Build the image:
```bash
docker build -t apprentice-apex .
```

2. Run with environment variables:
```bash
docker run -p 3002:3002 \
  -e DATABASE_URL="your-database-url" \
  -e JWT_SECRET="your-jwt-secret" \
  -e STRIPE_SECRET_KEY="your-stripe-key" \
  # ... add all other required env vars
  apprentice-apex
```

### Vercel/Netlify Deployment

1. Set environment variables in your platform's dashboard
2. Deploy using the build configuration in `package.json`
3. Use the provided `netlify.toml` for Netlify deployments

## Security Checklist ✅

- [x] No secrets in Docker images
- [x] Environment variables used for all secrets
- [x] Production command used in Dockerfile
- [x] Dependencies updated
- [x] Weak admin codes removed
- [x] Database URL uses SSL
- [x] Stripe live keys validation in place
- [x] JWT secret length validation

## Testing Deployment

Run these commands to test your configuration:

```bash
# Validate environment variables
npm run validate-env

# Run security checks
npm run security:check

# Test database connection
npm run test:db

# Build production
npm run build:production
```

## Important Notes

1. **Never commit secrets**: All secrets must be set via environment variables
2. **Use secure values**: Generate strong, random secrets for production
3. **SSL required**: Database and external services should use SSL
4. **Monitor logs**: Check application logs for any configuration errors
5. **Regular updates**: Keep dependencies updated for security patches