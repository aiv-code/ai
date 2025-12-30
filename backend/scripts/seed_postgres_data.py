"""Seed PostgreSQL database with sample data."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import psycopg2
from app.config import settings

def seed_postgres():
    """Seed PostgreSQL database with sample data."""
    # Parse database URL
    db_url = settings.DATABASE_URL
    # Extract connection details
    # Format: postgresql://user:password@host:port/database
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "")
    
    parts = db_url.split("@")
    if len(parts) == 2:
        user_pass = parts[0].split(":")
        host_db = parts[1].split("/")
        if len(host_db) == 2:
            host_port = host_db[0].split(":")
            
            user = user_pass[0]
            password = user_pass[1] if len(user_pass) > 1 else ""
            host = host_port[0]
            port = int(host_port[1]) if len(host_port) > 1 else 5432
            database = host_db[1]
        else:
            raise ValueError("Invalid database URL format")
    else:
        raise ValueError("Invalid database URL format")
    
    print(f"Connecting to PostgreSQL: {host}:{port}/{database}")
    
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        
        # Read and execute SQL file
        sql_file = os.path.join(os.path.dirname(__file__), "seed_postgres_data.sql")
        with open(sql_file, 'r') as f:
            sql_script = f.read()
        
        cursor = conn.cursor()
        
        # Execute SQL script
        cursor.execute(sql_script)
        
        # Commit changes
        conn.commit()
        
        # Get summary
        cursor.execute("SELECT COUNT(*) FROM analytics.customers")
        customer_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM analytics.products")
        product_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM analytics.sales_orders")
        order_count = cursor.fetchone()[0]
        
        print(f"\n✓ PostgreSQL sample data seeded successfully!")
        print(f"  - Customers: {customer_count}")
        print(f"  - Products: {product_count}")
        print(f"  - Orders: {order_count}")
        print(f"\nSchema: analytics")
        print(f"Tables: customers, products, sales_orders")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"✗ Error seeding PostgreSQL: {str(e)}")
        raise

if __name__ == "__main__":
    seed_postgres()


