-- Payment Integration Tables for Neon Database
-- This script creates all necessary tables for Stripe payment integration

-- 1. PAYMENTS TABLE
-- Stores all payment records including job posting fees, subscription payments, and success fees
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('job_posting', 'subscription', 'success_fee', 'trial_placement')),
    
    -- Stripe IDs
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    
    -- Payment details
    amount INTEGER NOT NULL, -- Amount in cents/pence
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    description TEXT,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
    payment_method_type VARCHAR(50) DEFAULT 'card',
    
    -- Related entities
    job_id INTEGER, -- References jobs table when payment is for job posting
    subscription_id INTEGER, -- References subscriptions table when payment is for subscription
    application_id INTEGER, -- References applications table when payment is for success fee
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB,
    receipt_url TEXT,
    receipt_sent BOOLEAN DEFAULT FALSE,
    customer_notified BOOLEAN DEFAULT FALSE,
    
    -- Indexes
    CONSTRAINT fk_payments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. SUBSCRIPTIONS TABLE
-- Stores employer subscription plan information
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
    -- Stripe IDs
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    
    -- Plan details
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('professional', 'business', 'enterprise')),
    plan_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'cancelled', 'unpaid')),
    
    -- Billing details
    amount INTEGER NOT NULL, -- Amount in cents/pence
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
    
    -- Period tracking
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    next_billing_date TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    
    -- Plan features (stored as JSON for flexibility)
    features JSONB NOT NULL DEFAULT '{}',
    
    -- Usage tracking
    usage JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT fk_subscriptions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. JOB_PAYMENTS TABLE
-- Links jobs to their payment status for pay-per-post model
CREATE TABLE IF NOT EXISTS job_payments (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL,
    payment_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    
    -- Payment package details
    package_type VARCHAR(50) NOT NULL CHECK (package_type IN ('basic', 'featured', 'premium', 'urgent')),
    package_name VARCHAR(100) NOT NULL,
    package_price INTEGER NOT NULL, -- Amount in cents/pence
    
    -- Payment status
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    job_status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (job_status IN ('draft', 'pending_payment', 'active', 'paused', 'expired', 'cancelled')),
    
    -- Activation tracking
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Package features
    features JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_job_payments_job_id FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_job_payments_payment_id FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_job_payments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure one payment per job
    CONSTRAINT unique_job_payment UNIQUE(job_id, payment_id)
);

-- 4. SUCCESS_FEES TABLE
-- Tracks success fees for successful placements
CREATE TABLE IF NOT EXISTS success_fees (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    payment_id INTEGER,
    employer_user_id VARCHAR(255) NOT NULL,
    candidate_user_id VARCHAR(255) NOT NULL,
    job_id INTEGER NOT NULL,
    
    -- Fee calculation
    annual_salary INTEGER NOT NULL, -- Annual salary in cents/pence
    fee_percentage DECIMAL(5,4) NOT NULL DEFAULT 0.12, -- Default 12%
    calculated_fee INTEGER NOT NULL, -- Calculated fee in cents/pence
    discount_applied DECIMAL(5,4) DEFAULT 0, -- Any subscription discounts
    final_fee INTEGER NOT NULL, -- Final fee after discounts
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'waived', 'disputed')),
    
    -- Important dates
    placement_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_success_fees_payment_id FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    CONSTRAINT fk_success_fees_employer_id FOREIGN KEY (employer_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_success_fees_candidate_id FOREIGN KEY (candidate_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_success_fees_job_id FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Ensure one success fee per application
    CONSTRAINT unique_application_success_fee UNIQUE(application_id)
);

-- 5. PAYMENT_PACKAGES TABLE
-- Defines available job posting payment packages
CREATE TABLE IF NOT EXISTS payment_packages (
    id SERIAL PRIMARY KEY,
    package_type VARCHAR(50) NOT NULL UNIQUE,
    package_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Pricing
    price INTEGER NOT NULL, -- Price in cents/pence
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    
    -- Package features
    duration_days INTEGER NOT NULL DEFAULT 30,
    featured BOOLEAN DEFAULT FALSE,
    priority_placement BOOLEAN DEFAULT FALSE,
    highlighted BOOLEAN DEFAULT FALSE,
    logo_display BOOLEAN DEFAULT FALSE,
    social_media_promotion BOOLEAN DEFAULT FALSE,
    email_blast BOOLEAN DEFAULT FALSE,
    
    -- Additional features stored as JSON
    features JSONB NOT NULL DEFAULT '{}',
    
    -- Status
    active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BILLING_EVENTS TABLE
-- Audit trail for all billing events
CREATE TABLE IF NOT EXISTS billing_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    
    -- Related entities
    payment_id INTEGER,
    subscription_id INTEGER,
    job_id INTEGER,
    
    -- Status
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT fk_billing_events_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_billing_events_payment_id FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    CONSTRAINT fk_billing_events_subscription_id FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    CONSTRAINT fk_billing_events_job_id FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

-- Add payment-related columns to existing jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'free')),
ADD COLUMN IF NOT EXISTS payment_package VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_id INTEGER,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add foreign key constraint for job payment
ALTER TABLE jobs 
ADD CONSTRAINT fk_jobs_payment_id 
FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- Add subscription tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS subscription_id INTEGER,
ADD COLUMN IF NOT EXISTS trial_status VARCHAR(50) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS trial_paid_at TIMESTAMP WITH TIME ZONE;

-- Add foreign key constraint for user subscription
ALTER TABLE users 
ADD CONSTRAINT fk_users_subscription_id 
FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

-- CREATE INDEXES for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);

CREATE INDEX IF NOT EXISTS idx_job_payments_job_id ON job_payments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_payments_payment_id ON job_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_job_payments_user_id ON job_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_job_payments_payment_status ON job_payments(payment_status);

CREATE INDEX IF NOT EXISTS idx_success_fees_application_id ON success_fees(application_id);
CREATE INDEX IF NOT EXISTS idx_success_fees_employer_user_id ON success_fees(employer_user_id);
CREATE INDEX IF NOT EXISTS idx_success_fees_status ON success_fees(status);

CREATE INDEX IF NOT EXISTS idx_billing_events_user_id ON billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_event_type ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON billing_events(created_at);

CREATE INDEX IF NOT EXISTS idx_jobs_payment_status ON jobs(payment_status);
CREATE INDEX IF NOT EXISTS idx_jobs_payment_id ON jobs(payment_id);
CREATE INDEX IF NOT EXISTS idx_jobs_published_at ON jobs(published_at);
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs(expires_at);

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);

-- INSERT DEFAULT PAYMENT PACKAGES
INSERT INTO payment_packages (package_type, package_name, description, price, duration_days, featured, priority_placement, highlighted, features) VALUES
('basic', 'Basic Job Posting', 'Standard job posting visible for 30 days', 4900, 30, FALSE, FALSE, FALSE, '{"applicant_tracking": true, "basic_analytics": true}'),
('featured', 'Featured Job Posting', 'Featured placement with company logo and highlighted listing', 9900, 30, TRUE, TRUE, TRUE, '{"applicant_tracking": true, "advanced_analytics": true, "logo_display": true, "priority_support": true}'),
('premium', 'Premium Job Posting', 'Maximum visibility with social media promotion and email blast', 14900, 45, TRUE, TRUE, TRUE, '{"applicant_tracking": true, "advanced_analytics": true, "logo_display": true, "social_promotion": true, "email_blast": true, "priority_support": true, "extended_duration": true}'),
('urgent', 'Urgent Hiring', 'Fast-track posting with immediate visibility and candidate alerts', 19900, 60, TRUE, TRUE, TRUE, '{"applicant_tracking": true, "advanced_analytics": true, "logo_display": true, "social_promotion": true, "email_blast": true, "candidate_alerts": true, "priority_support": true, "extended_duration": true, "urgent_badge": true}')
ON CONFLICT (package_type) DO UPDATE SET
    package_name = EXCLUDED.package_name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    duration_days = EXCLUDED.duration_days,
    featured = EXCLUDED.featured,
    priority_placement = EXCLUDED.priority_placement,
    highlighted = EXCLUDED.highlighted,
    features = EXCLUDED.features,
    updated_at = NOW();

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all relevant tables
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_payments_updated_at BEFORE UPDATE ON job_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_success_fees_updated_at BEFORE UPDATE ON success_fees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_packages_updated_at BEFORE UPDATE ON payment_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for easier querying
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    p.id,
    p.user_id,
    p.payment_type,
    p.amount,
    p.currency,
    p.status,
    p.created_at,
    u.email as user_email,
    CASE 
        WHEN p.payment_type = 'job_posting' THEN j.title
        WHEN p.payment_type = 'subscription' THEN s.plan_name
        ELSE p.description
    END as description
FROM payments p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN jobs j ON p.job_id = j.id
LEFT JOIN subscriptions s ON p.subscription_id = s.id;

CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    s.*,
    u.email as user_email,
    u.profile->>'companyName' as company_name
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.status IN ('active', 'trialing');

CREATE OR REPLACE VIEW job_payment_status AS
SELECT 
    j.id as job_id,
    j.title,
    j.company_id,
    j.payment_status,
    j.published_at,
    j.expires_at,
    jp.package_type,
    jp.package_name,
    jp.package_price,
    p.amount as paid_amount,
    p.status as payment_status,
    p.created_at as payment_created_at
FROM jobs j
LEFT JOIN job_payments jp ON j.id = jp.job_id
LEFT JOIN payments p ON jp.payment_id = p.id;

-- Grant necessary permissions (adjust based on your user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
