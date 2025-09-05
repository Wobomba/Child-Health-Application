"""
Quick script to ensure all tables are created including photos table
"""

from app.core.database import engine, Base
from app.models import user, child, growth_record, photo, assessment

def create_all_tables():
    """Create all database tables"""
    print("Creating all database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
        
        # Show created tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"📋 Available tables: {', '.join(tables)}")
        
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")

if __name__ == "__main__":
    create_all_tables()

