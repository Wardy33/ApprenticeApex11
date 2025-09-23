-- AI Moderation Tables for Candidate Protection

-- Create AI moderation flags table
CREATE TABLE IF NOT EXISTS ai_moderation_flags (
    id SERIAL PRIMARY KEY,
    message_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    flag_type VARCHAR(50) NOT NULL, -- 'ukPhoneNumbers', 'emails', 'externalPlatforms', 'meetingRequests'
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    detected_content JSONB NOT NULL, -- Masked content that was detected
    action_taken VARCHAR(20) NOT NULL DEFAULT 'flagged', -- 'flagged', 'blocked', 'suspended'
    company_id TEXT,
    candidate_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create moderation queue table for admin review
CREATE TABLE IF NOT EXISTS moderation_queue (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'contact_sharing', 'inappropriate_content', 'spam'
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    data JSONB, -- Additional metadata about the incident
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
    assigned_admin_id INTEGER,
    resolved_by_admin_id INTEGER,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Update messages table to include AI moderation fields
ALTER TABLE messages ADD COLUMN IF NOT EXISTS flagged_by_ai BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS blocked_by_ai BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS contains_contact_info BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS original_content TEXT; -- Store original before blocking

-- Update conversations table to include blocking fields
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT FALSE;

-- Create admin logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'LOGIN', 'LOGOUT', 'SUSPEND_COMPANY', 'REVIEW_MODERATION', etc.
    target_type VARCHAR(50), -- 'user', 'company', 'conversation', 'message'
    target_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table for admin alerts
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'system'
    action_url TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_moderation_flags_message_id ON ai_moderation_flags(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_moderation_flags_conversation_id ON ai_moderation_flags(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_moderation_flags_created_at ON ai_moderation_flags(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_moderation_flags_confidence ON ai_moderation_flags(confidence_score);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON moderation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created_at ON moderation_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_flagged_by_ai ON messages(flagged_by_ai);
CREATE INDEX IF NOT EXISTS idx_messages_ai_confidence ON messages(ai_confidence_score);

CREATE INDEX IF NOT EXISTS idx_conversations_blocked ON conversations(blocked);
CREATE INDEX IF NOT EXISTS idx_conversations_flagged_for_review ON conversations(flagged_for_review);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Insert sample AI moderation data for testing
INSERT INTO ai_moderation_flags (message_id, conversation_id, flag_type, confidence_score, detected_content, action_taken, company_id, candidate_id)
VALUES 
('msg_test_1', 'conv_test_1', 'emails', 0.95, '["*****@*****.***"]', 'blocked', 'comp_test_1', 'cand_test_1'),
('msg_test_2', 'conv_test_2', 'ukPhoneNumbers', 0.98, '["+** **** *** ***"]', 'blocked', 'comp_test_2', 'cand_test_2')
ON CONFLICT DO NOTHING;

INSERT INTO moderation_queue (type, priority, title, description, data, status)
VALUES 
('contact_sharing', 'urgent', '🚨 URGENT: TechCorp attempting contact bypass', 'Company "TechCorp" attempted to share contact information with candidate "John Smith". Conversation blocked automatically.', '{"companyId": "comp_test_1", "candidateId": "cand_test_1", "confidence": 0.95}', 'pending'),
('contact_sharing', 'high', 'Contact sharing attempt detected', 'Multiple contact sharing patterns detected in conversation.', '{"companyId": "comp_test_2", "candidateId": "cand_test_2", "confidence": 0.88}', 'pending')
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ai_moderation_flags TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON moderation_queue TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON admin_logs TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO your_app_user;
