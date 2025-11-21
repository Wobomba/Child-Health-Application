-- Migration: Add new features for disease detection, disaster predictions, and nutrition tips
-- Date: 2024-11-07
-- Description: Adds fields for disease detection, disaster predictions, nutrition tips, and last_login tracking

-- Add last_login field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Add new analysis fields to photos table
ALTER TABLE photos ADD COLUMN IF NOT EXISTS detected_diseases TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS disaster_predictions TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS nutrition_tips TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_photos_detected_diseases ON photos USING gin(detected_diseases jsonb_path_ops) WHERE detected_diseases IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.last_login IS 'Timestamp of the last successful login';
COMMENT ON COLUMN photos.detected_diseases IS 'JSON array of detected malnutrition-related diseases (rickets, kwashiorkor, marasmus, scurvy)';
COMMENT ON COLUMN photos.disaster_predictions IS 'JSON array of potential consequences if malnutrition is not addressed';
COMMENT ON COLUMN photos.nutrition_tips IS 'JSON array of age-based nutrition recommendations';

