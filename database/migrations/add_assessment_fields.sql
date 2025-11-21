-- Add missing fields to assessments table to match the schema
-- This migration adds all the fields required by HealthAssessmentCreate schema

-- Add vht_user_id if it doesn't exist
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS vht_user_id INTEGER REFERENCES users(id);

-- Add new vital signs and measurement fields
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS weight_kg FLOAT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS height_cm FLOAT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS head_circumference_cm FLOAT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS muac_cm FLOAT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS temperature_celsius FLOAT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS blood_pressure_systolic INTEGER;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS blood_pressure_diastolic INTEGER;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS heart_rate_bpm INTEGER;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS respiratory_rate INTEGER;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS oxygen_saturation INTEGER;

-- Add new examination fields
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS skin_condition TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS eye_condition TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS ear_condition TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS nose_condition TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS throat_condition TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS chest_condition TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS abdomen_condition TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS neurological_condition TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS musculoskeletal_condition TEXT;

-- Add history and development fields
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS developmental_milestones TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS immunization_status TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS sleep_patterns TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS behavioral_notes TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS social_history TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS environmental_factors TEXT;

-- Add clinical fields
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS history_present_illness TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS review_of_systems TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS physical_examination TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS assessment_notes TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS treatment_plan TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS follow_up_instructions TEXT;

-- Add referral fields (rename if needed)
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS referral_required BOOLEAN DEFAULT FALSE;
-- referral_details already exists as referral_details

-- Add AI and risk fields
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS priority_score INTEGER;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS ai_analysis_id INTEGER;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS ai_confidence_score FLOAT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS ai_risk_indicators TEXT; -- JSON string
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS ai_recommendations TEXT;

-- Add status field (rename assessment_status to status if needed, or add both)
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assessments_vht_user_id ON assessments(vht_user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_risk_level ON assessments(risk_level);

