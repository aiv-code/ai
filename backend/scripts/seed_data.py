"""Seed database with sample data."""
import sys
import os
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.client import Client
from app.models.data_source import DataSource
from app.utils.security import encrypt_credentials


def seed_data():
    """Seed database with sample data."""
    db = SessionLocal()
    
    try:
        # Create demo client
        demo_client = db.query(Client).filter(Client.name == "Demo Client").first()
        
        if not demo_client:
            demo_client = Client(
                name="Demo Client",
                api_key=Client.generate_api_key(),
                is_active=True
            )
            db.add(demo_client)
            db.commit()
            db.refresh(demo_client)
            print(f"✓ Created demo client: {demo_client.name}")
        else:
            print(f"✓ Demo client already exists: {demo_client.name}")
        
        print(f"\nAPI Key: {demo_client.api_key}")
        print(f"Client ID: {demo_client.id}")
        
        # Create sample PostgreSQL data source
        postgres_source = db.query(DataSource).filter(
            DataSource.client_id == demo_client.id,
            DataSource.source_name == "Sample PostgreSQL"
        ).first()
        
        if not postgres_source:
            postgres_config = {
                "host": "metadata_db",
                "port": 5432,
                "database": "metadata_db",
                "username": "admin",
                "password": "secure_password",
                "schema": "analytics"
            }
            config_json = json.dumps(postgres_config)
            encrypted_config = encrypt_credentials(config_json)
            
            postgres_source = DataSource(
                client_id=demo_client.id,
                source_name="Sample PostgreSQL",
                source_type="postgres",
                connection_config=encrypted_config,
                is_active=True
            )
            db.add(postgres_source)
            db.commit()
            print("✓ Created sample PostgreSQL data source")
        
        # Create sample Excel data source
        excel_source = db.query(DataSource).filter(
            DataSource.client_id == demo_client.id,
            DataSource.source_name == "Sales Data (Excel)"
        ).first()
        
        if not excel_source:
            excel_config = {
                "file_path": "/data/uploads/sales_data.xlsx",
                "sheet_name": "Sales"
            }
            config_json = json.dumps(excel_config)
            encrypted_config = encrypt_credentials(config_json)
            
            excel_source = DataSource(
                client_id=demo_client.id,
                source_name="Sales Data (Excel)",
                source_type="excel",
                connection_config=encrypted_config,
                is_active=True
            )
            db.add(excel_source)
            db.commit()
            print("✓ Created sample Excel data source")
        
        # Create sample CSV data source
        csv_source = db.query(DataSource).filter(
            DataSource.client_id == demo_client.id,
            DataSource.source_name == "Customers (CSV)"
        ).first()
        
        if not csv_source:
            csv_config = {
                "file_path": "/data/uploads/customers.csv"
            }
            config_json = json.dumps(csv_config)
            encrypted_config = encrypt_credentials(config_json)
            
            csv_source = DataSource(
                client_id=demo_client.id,
                source_name="Customers (CSV)",
                source_type="excel",  # CSV uses excel connector
                connection_config=encrypted_config,
                is_active=True
            )
            db.add(csv_source)
            db.commit()
            print("✓ Created sample CSV data source")
        
        # Create sample Parquet data source
        parquet_source = db.query(DataSource).filter(
            DataSource.client_id == demo_client.id,
            DataSource.source_name == "Products (Parquet)"
        ).first()
        
        if not parquet_source:
            parquet_config = {
                "file_path": "/data/uploads/products.parquet"
            }
            config_json = json.dumps(parquet_config)
            encrypted_config = encrypt_credentials(config_json)
            
            parquet_source = DataSource(
                client_id=demo_client.id,
                source_name="Products (Parquet)",
                source_type="parquet",
                connection_config=encrypted_config,
                is_active=True
            )
            db.add(parquet_source)
            db.commit()
            print("✓ Created sample Parquet data source")
        
        print("\n✓ Seeding completed successfully!")
        print(f"\nUse this API key to test the API:")
        print(f"  X-API-Key: {demo_client.api_key}")
        
    except Exception as e:
        print(f"✗ Error seeding data: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()

