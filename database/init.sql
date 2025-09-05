-- AI Child Health Database Initialization Script
-- This script sets up the initial database structure and sample data

-- Create database if it doesn't exist
-- CREATE DATABASE child_health;

-- Connect to the database
-- \c child_health;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_children_village ON children(village);
CREATE INDEX IF NOT EXISTS idx_children_district ON children(district);
CREATE INDEX IF NOT EXISTS idx_children_vht_user_id ON children(vht_user_id);
CREATE INDEX IF NOT EXISTS idx_growth_records_child_date ON growth_records(child_id, measurement_date);
CREATE INDEX IF NOT EXISTS idx_photos_child_type ON photos(child_id, photo_type);
CREATE INDEX IF NOT EXISTS idx_assessments_child_date ON assessments(child_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_village ON users(village);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_children_search ON children USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || village));
CREATE INDEX IF NOT EXISTS idx_assessments_search ON assessments USING gin(to_tsvector('english', chief_complaint || ' ' || primary_diagnosis || ' ' || treatment_recommendations));

-- Insert sample VHT users
INSERT INTO users (username, email, full_name, hashed_password, role, village, district, is_active, is_verified) VALUES
('vht_kampala_001', 'vht001@example.com', 'Sarah Nakimera', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxqDmG', 'vht', 'Kampala Central', 'Kampala', true, true),
('vht_mukono_001', 'vht002@example.com', 'John Ssewankambo', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxqDmG', 'vht', 'Mukono Town', 'Mukono', true, true),
('nurse_kampala_001', 'nurse001@example.com', 'Dr. Mary Nalukenge', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxqDmG', 'nurse', 'Kampala Central', 'Kampala', true, true),
('admin_001', 'admin@example.com', 'System Administrator', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxqDmG', 'admin', 'Kampala', 'Kampala', true, true)
ON CONFLICT (username) DO NOTHING;

-- Insert sample children
INSERT INTO children (unique_id, first_name, last_name, date_of_birth, gender, village, district, parent_name, parent_phone, vht_user_id) VALUES
('CH001', 'Aisha', 'Nakato', '2020-03-15', 'female', 'Kampala Central', 'Kampala', 'Fatima Nakato', '+256701234567', 1),
('CH002', 'Kato', 'Ssewankambo', '2019-07-22', 'male', 'Mukono Town', 'Mukono', 'Robert Ssewankambo', '+256702345678', 2),
('CH003', 'Nakimera', 'Sarah', '2021-01-10', 'female', 'Kampala Central', 'Kampala', 'Grace Nakimera', '+256703456789', 1),
('CH004', 'Mukisa', 'David', '2020-11-05', 'male', 'Mukono Town', 'Mukono', 'Peter Mukisa', '+256704567890', 2)
ON CONFLICT (unique_id) DO NOTHING;

-- Insert sample growth records
INSERT INTO growth_records (child_id, measurement_date, weight, height, head_circumference, mid_upper_arm_circumference, notes, measured_by) VALUES
(1, '2024-01-15', 12.5, 85.2, 45.1, 12.8, 'Regular checkup, child appears healthy', 'Sarah Nakimera'),
(1, '2024-01-30', 12.8, 86.0, 45.3, 13.0, 'Good weight gain, height growth normal', 'Sarah Nakimera'),
(2, '2024-01-20', 15.2, 92.5, 47.2, 14.2, 'Healthy growth pattern maintained', 'John Ssewankambo'),
(3, '2024-01-25', 8.5, 72.1, 42.8, 11.5, 'Slight weight gain, monitoring required', 'Sarah Nakimera'),
(4, '2024-01-28', 13.8, 88.3, 46.1, 13.5, 'Normal growth, no concerns', 'John Ssewankambo')
ON CONFLICT DO NOTHING;

-- Insert sample assessments
INSERT INTO assessments (child_id, assessor_id, assessment_date, assessment_type, chief_complaint, primary_diagnosis, treatment_recommendations, risk_level, assessment_status) VALUES
(1, 1, '2024-01-15', 'routine', 'Regular checkup', 'Healthy child', 'Continue current feeding practices, next checkup in 3 months', 'low', 'completed'),
(2, 2, '2024-01-20', 'routine', 'Growth monitoring', 'Healthy child', 'Maintain current diet, encourage physical activity', 'low', 'completed'),
(3, 1, '2024-01-25', 'follow_up', 'Slow weight gain', 'Mild malnutrition', 'Increase protein intake, add nutritional supplements, follow up in 2 weeks', 'medium', 'completed'),
(4, 2, '2024-01-28', 'routine', 'Regular checkup', 'Healthy child', 'Continue current practices, next checkup in 3 months', 'low', 'completed')
ON CONFLICT DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW child_growth_summary AS
SELECT 
    c.id,
    c.unique_id,
    c.first_name,
    c.last_name,
    c.village,
    c.district,
    c.date_of_birth,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.date_of_birth)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.date_of_birth)) as age_months,
    gr.weight as latest_weight,
    gr.height as latest_height,
    gr.measurement_date as latest_measurement,
    gr.overall_status as growth_status,
    a.risk_level as assessment_risk
FROM children c
LEFT JOIN LATERAL (
    SELECT * FROM growth_records 
    WHERE child_id = c.id 
    ORDER BY measurement_date DESC 
    LIMIT 1
) gr ON true
LEFT JOIN LATERAL (
    SELECT * FROM assessments 
    WHERE child_id = c.id 
    ORDER BY assessment_date DESC 
    LIMIT 1
) a ON true
WHERE c.is_active = true;

-- Create view for malnutrition alerts
CREATE OR REPLACE VIEW malnutrition_alerts AS
SELECT 
    c.id,
    c.unique_id,
    c.first_name,
    c.last_name,
    c.village,
    c.district,
    gr.weight,
    gr.height,
    gr.overall_status,
    gr.measurement_date,
    a.risk_level,
    a.assessment_status,
    u.full_name as vht_name,
    u.phone as vht_phone
FROM children c
JOIN growth_records gr ON c.id = gr.child_id
JOIN users u ON c.vht_user_id = u.id
LEFT JOIN assessments a ON c.id = a.child_id
WHERE gr.overall_status = 'malnourished' 
   OR a.risk_level IN ('high', 'critical')
   OR gr.weight < 8.0  -- Weight threshold for alert
ORDER BY gr.measurement_date DESC;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Create function to calculate Z-scores
CREATE OR REPLACE FUNCTION calculate_zscore(
    measurement_value NUMERIC,
    age_months INTEGER,
    gender TEXT,
    measurement_type TEXT
) RETURNS NUMERIC AS $$
DECLARE
    median_value NUMERIC;
    standard_deviation NUMERIC;
BEGIN
    -- This is a simplified calculation - in production, use WHO growth standards
    -- For now, return a placeholder value
    RETURN 0.0;
END;
$$ LANGUAGE plpgsql;

-- Create function to update growth status
CREATE OR REPLACE FUNCTION update_growth_status() RETURNS TRIGGER AS $$
BEGIN
    -- Update growth status based on measurements
    IF NEW.weight IS NOT NULL AND NEW.height IS NOT NULL THEN
        -- Calculate BMI
        NEW.bmi = NEW.weight / ((NEW.height / 100) * (NEW.height / 100));
        
        -- Simple status logic (replace with WHO standards in production)
        IF NEW.bmi < 16.0 THEN
            NEW.overall_status = 'malnourished';
        ELSIF NEW.bmi > 25.0 THEN
            NEW.overall_status = 'overweight';
        ELSE
            NEW.overall_status = 'normal';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update growth status
CREATE TRIGGER trigger_update_growth_status
    BEFORE INSERT OR UPDATE ON growth_records
    FOR EACH ROW
    EXECUTE FUNCTION update_growth_status();

-- Insert sample photos (metadata only - actual files would be stored in filesystem)
INSERT INTO photos (child_id, filename, file_path, file_size, mime_type, photo_type, taken_date, analysis_status) VALUES
(1, 'aisha_face_20240115.jpg', '/uploads/children/1/face/aisha_face_20240115.jpg', 2048576, 'image/jpeg', 'face', '2024-01-15 10:00:00', 'completed'),
(1, 'aisha_body_20240115.jpg', '/uploads/children/1/body/aisha_body_20240115.jpg', 3072000, 'image/jpeg', 'body', '2024-01-15 10:05:00', 'completed'),
(2, 'kato_face_20240120.jpg', '/uploads/children/2/face/kato_face_20240120.jpg', 1892352, 'image/jpeg', 'face', '2024-01-20 14:30:00', 'completed'),
(3, 'nakimera_face_20240125.jpg', '/uploads/children/3/face/nakimera_face_20240125.jpg', 2150400, 'image/jpeg', 'face', '2024-01-25 09:15:00', 'pending')
ON CONFLICT DO NOTHING;

-- Update photo analysis results
UPDATE photos SET 
    malnutrition_score = 0.15,
    confidence_level = 0.92,
    detected_features = '{"face_detected": true, "skin_tone": "normal", "facial_features": "healthy"}',
    recommendations = 'Child appears well-nourished. Continue current feeding practices.',
    is_analyzed = true
WHERE id = 1 AND photo_type = 'face';

UPDATE photos SET 
    malnutrition_score = 0.18,
    confidence_level = 0.89,
    detected_features = '{"body_proportions": "normal", "muscle_tone": "good", "overall_appearance": "healthy"}',
    recommendations = 'Body proportions appear normal. No signs of malnutrition detected.',
    is_analyzed = true
WHERE id = 2 AND photo_type = 'body';

UPDATE photos SET 
    malnutrition_score = 0.12,
    confidence_level = 0.94,
    detected_features = '{"face_detected": true, "skin_tone": "normal", "facial_features": "healthy"}',
    recommendations = 'Child appears healthy and well-nourished.',
    is_analyzed = true
WHERE id = 3 AND photo_type = 'face';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photos_analysis_status ON photos(analysis_status);
CREATE INDEX IF NOT EXISTS idx_photos_malnutrition_score ON photos(malnutrition_score);
CREATE INDEX IF NOT EXISTS idx_growth_records_status ON growth_records(overall_status);
CREATE INDEX IF NOT EXISTS idx_assessments_risk_level ON assessments(risk_level);

-- Create materialized view for dashboard statistics
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT 
    COUNT(DISTINCT c.id) as total_children,
    COUNT(DISTINCT CASE WHEN c.gender = 'male' THEN c.id END) as male_children,
    COUNT(DISTINCT CASE WHEN c.gender = 'female' THEN c.id END) as female_children,
    COUNT(DISTINCT c.village) as total_villages,
    COUNT(DISTINCT c.district) as total_districts,
    COUNT(DISTINCT CASE WHEN gr.overall_status = 'malnourished' THEN c.id END) as malnourished_count,
    COUNT(DISTINCT CASE WHEN gr.overall_status = 'normal' THEN c.id END) as healthy_count,
    COUNT(DISTINCT CASE WHEN a.risk_level IN ('high', 'critical') THEN c.id END) as high_risk_count,
    AVG(gr.weight) as avg_weight,
    AVG(gr.height) as avg_height
FROM children c
LEFT JOIN growth_records gr ON c.id = gr.child_id
LEFT JOIN assessments a ON c.id = a.child_id
WHERE c.is_active = true;

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION calculate_zscore(NUMERIC, INTEGER, TEXT, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION update_growth_status() TO postgres;
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats() TO postgres;

-- Create comment documentation
COMMENT ON TABLE children IS 'Stores information about children in the program';
COMMENT ON TABLE growth_records IS 'Tracks child growth measurements over time';
COMMENT ON TABLE photos IS 'Stores child photos and AI analysis results';
COMMENT ON TABLE assessments IS 'Comprehensive health assessments and clinical notes';
COMMENT ON TABLE users IS 'Village Health Team members and healthcare workers';

COMMENT ON VIEW child_growth_summary IS 'Summary view of child growth and assessment data';
COMMENT ON VIEW malnutrition_alerts IS 'View of children requiring immediate attention';
COMMENT ON MATERIALIZED VIEW dashboard_stats IS 'Aggregated statistics for dashboard display';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
    RAISE NOTICE 'Sample data inserted: % users, % children, % growth records, % assessments, % photos', 
        (SELECT COUNT(*) FROM users),
        (SELECT COUNT(*) FROM children),
        (SELECT COUNT(*) FROM growth_records),
        (SELECT COUNT(*) FROM assessments),
        (SELECT COUNT(*) FROM photos);
END $$;
