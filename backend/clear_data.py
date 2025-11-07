#!/usr/bin/env python3
"""
Script to clear all test data (children and photos)
Use with caution - this will delete all data!
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, drop_tables, create_tables
from app.models.photo import Photo
from app.models.child import Child
from app.models.user import User
from pathlib import Path
import shutil

def clear_all_data():
    """Clear all children and photos from the database"""
    db = SessionLocal()
    
    try:
        print("Clearing all data...")
        
        # Delete all photos
        photo_count = db.query(Photo).count()
        db.query(Photo).delete()
        print(f"Deleted {photo_count} photos")
        
        # Delete all children
        child_count = db.query(Child).count()
        db.query(Child).delete()
        print(f"Deleted {child_count} children")
        
        # Keep users (don't delete admin/VHT accounts)
        # db.query(User).delete()
        
        db.commit()
        print("✅ All data cleared successfully!")
        
        # Optionally clear upload directory
        upload_dir = Path("uploads/photos")
        if upload_dir.exists():
            try:
                shutil.rmtree(upload_dir)
                upload_dir.mkdir(parents=True, exist_ok=True)
                print(f"✅ Cleared upload directory: {upload_dir}")
            except Exception as e:
                print(f"⚠️  Could not clear upload directory: {e}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error clearing data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    response = input("⚠️  WARNING: This will delete ALL children and photos. Continue? (yes/no): ")
    if response.lower() == "yes":
        clear_all_data()
    else:
        print("Cancelled.")

