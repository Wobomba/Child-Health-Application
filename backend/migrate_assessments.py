#!/usr/bin/env python3
"""
Migration script to add missing fields to assessments table
"""
import sqlite3
import sys
import os

# Get the database path
db_path = os.path.join(os.path.dirname(__file__), 'test.db')

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    sys.exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get existing columns
cursor.execute("PRAGMA table_info(assessments)")
existing_columns = {row[1] for row in cursor.fetchall()}

# Fields to add
fields_to_add = [
    ("vht_user_id", "INTEGER"),
    ("weight_kg", "FLOAT"),
    ("height_cm", "FLOAT"),
    ("head_circumference_cm", "FLOAT"),
    ("muac_cm", "FLOAT"),
    ("temperature_celsius", "FLOAT"),
    ("blood_pressure_systolic", "INTEGER"),
    ("blood_pressure_diastolic", "INTEGER"),
    ("heart_rate_bpm", "INTEGER"),
    ("respiratory_rate", "INTEGER"),
    ("oxygen_saturation", "INTEGER"),
    ("skin_condition", "TEXT"),
    ("eye_condition", "TEXT"),
    ("ear_condition", "TEXT"),
    ("nose_condition", "TEXT"),
    ("throat_condition", "TEXT"),
    ("chest_condition", "TEXT"),
    ("abdomen_condition", "TEXT"),
    ("neurological_condition", "TEXT"),
    ("musculoskeletal_condition", "TEXT"),
    ("developmental_milestones", "TEXT"),
    ("immunization_status", "TEXT"),
    ("sleep_patterns", "TEXT"),
    ("behavioral_notes", "TEXT"),
    ("social_history", "TEXT"),
    ("environmental_factors", "TEXT"),
    ("history_present_illness", "TEXT"),
    ("review_of_systems", "TEXT"),
    ("physical_examination", "TEXT"),
    ("assessment_notes", "TEXT"),
    ("diagnosis", "TEXT"),
    ("treatment_plan", "TEXT"),
    ("follow_up_instructions", "TEXT"),
    ("referral_required", "BOOLEAN DEFAULT 0"),
    ("priority_score", "INTEGER"),
    ("ai_analysis_id", "INTEGER"),
    ("ai_confidence_score", "FLOAT"),
    ("ai_risk_indicators", "TEXT"),
    ("ai_recommendations", "TEXT"),
    ("status", "VARCHAR(20) DEFAULT 'pending'"),
]

added_count = 0
for field_name, field_type in fields_to_add:
    if field_name not in existing_columns:
        try:
            cursor.execute(f"ALTER TABLE assessments ADD COLUMN {field_name} {field_type}")
            print(f"Added column: {field_name}")
            added_count += 1
        except sqlite3.OperationalError as e:
            print(f"Error adding {field_name}: {e}")
    else:
        print(f"Column {field_name} already exists, skipping")

# Create indexes
indexes = [
    ("idx_assessments_vht_user_id", "assessments(vht_user_id)"),
    ("idx_assessments_status", "assessments(status)"),
    ("idx_assessments_risk_level", "assessments(risk_level)"),
]

for index_name, index_def in indexes:
    try:
        cursor.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {index_def}")
        print(f"Created index: {index_name}")
    except sqlite3.OperationalError as e:
        print(f"Error creating index {index_name}: {e}")

conn.commit()
conn.close()

print(f"\nMigration complete! Added {added_count} new columns.")

