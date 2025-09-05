#!/usr/bin/env python3
"""
Script to create test users in the database
"""

import os
import sys
sys.path.append('.')

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User
from app.core.security import get_password_hash

def create_test_users():
    """Create test users for authentication testing"""
    db = SessionLocal()
    
    try:
        # Check if users already exist
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            print("✅ Test users already exist!")
            return
        
        # Create test users
        test_users = [
            {
                "username": "admin",
                "email": "admin@example.com",
                "full_name": "System Administrator",
                "password": "admin123",
                "role": "admin",
                "village": "Central",
                "district": "Kampala"
            },
            {
                "username": "vht001",
                "email": "vht001@example.com", 
                "full_name": "Sarah Nakimera",
                "password": "vht123",
                "role": "vht",
                "village": "Nakawa",
                "district": "Kampala"
            },
            {
                "username": "nurse001",
                "email": "nurse001@example.com",
                "full_name": "Dr. Mary Nalukenge", 
                "password": "nurse123",
                "role": "nurse",
                "village": "Central",
                "district": "Kampala"
            }
        ]
        
        for user_data in test_users:
            # Hash the password
            hashed_password = get_password_hash(user_data["password"])
            
            # Create user
            db_user = User(
                username=user_data["username"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=hashed_password,
                role=user_data["role"],
                village=user_data["village"],
                district=user_data["district"],
                is_active=True,
                is_verified=True
            )
            
            db.add(db_user)
        
        db.commit()
        print("✅ Test users created successfully!")
        print("\n📋 Test Credentials:")
        print("Admin: username='admin', password='admin123'")
        print("VHT: username='vht001', password='vht123'") 
        print("Nurse: username='nurse001', password='nurse123'")
        
    except Exception as e:
        print(f"❌ Error creating users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()
