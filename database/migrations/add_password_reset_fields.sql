-- Add password reset fields to users table
-- This migration adds support for password reset functionality

-- Add password reset token field
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);

-- Add password reset token expiration field
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- Create index on password_reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.password_reset_token IS 'Secure token for password reset requests';
COMMENT ON COLUMN users.password_reset_expires IS 'Expiration timestamp for password reset token (typically 24 hours)';

