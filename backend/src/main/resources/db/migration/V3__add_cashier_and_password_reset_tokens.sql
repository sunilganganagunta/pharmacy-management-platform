-- MediCore Database Migration V3
-- Add Support for Password Reset Tokens and Cashier Role Compatibility

-- 1. Ensure users table role column supports CASHIER
-- (The role column in V1 is VARCHAR(30), which already accommodates 'CASHIER')
-- We add a comment documenting the 3-tier RBAC architecture: ADMIN, PHARMACIST, CASHIER
COMMENT ON COLUMN users.role IS 'User role: ADMIN, PHARMACIST, CASHIER';

-- 2. Password Reset Tokens Table (SEC-02)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rapid token lookup and expiration queries
CREATE INDEX IF NOT EXISTS idx_reset_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_reset_token_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_token_expiry ON password_reset_tokens(expiry_date);

