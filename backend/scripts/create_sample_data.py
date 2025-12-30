"""Create sample data files for testing."""
import pandas as pd
import os
from datetime import datetime, timedelta
import random

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

print("Creating sample data files...")

# 1. Sales Data (CSV and Excel)
print("Creating sales data...")
sales_data = []
start_date = datetime(2023, 1, 1)
for i in range(1000):
    date = start_date + timedelta(days=random.randint(0, 365))
    sales_data.append({
        "order_id": f"ORD-{i+1:04d}",
        "date": date.strftime("%Y-%m-%d"),
        "customer_name": random.choice(["Acme Corp", "XYZ Inc", "Tech Solutions", "Global Industries", "Startup Co", "Mega Corp", "Small Business", "Enterprise Ltd"]),
        "product": random.choice(["Laptop", "Mouse", "Keyboard", "Monitor", "Headphones", "Webcam", "Tablet", "Phone"]),
        "quantity": random.randint(1, 10),
        "unit_price": round(random.uniform(10, 1000), 2),
        "total": 0,  # Will calculate
        "region": random.choice(["North", "South", "East", "West", "Central"]),
        "sales_rep": random.choice(["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson"])
    })
    sales_data[-1]["total"] = sales_data[-1]["quantity"] * sales_data[-1]["unit_price"]

df_sales = pd.DataFrame(sales_data)
df_sales.to_csv(f"{UPLOAD_DIR}/sales_data.csv", index=False)
df_sales.to_excel(f"{UPLOAD_DIR}/sales_data.xlsx", index=False, sheet_name="Sales")
print(f"✓ Created {UPLOAD_DIR}/sales_data.csv and sales_data.xlsx")

# 2. Customer Data (CSV)
print("Creating customer data...")
customers = []
for i in range(100):
    customers.append({
        "customer_id": f"CUST-{i+1:03d}",
        "name": random.choice(["Acme Corp", "XYZ Inc", "Tech Solutions", "Global Industries", "Startup Co", "Mega Corp", "Small Business", "Enterprise Ltd", "New Company", "Old Business"]),
        "email": f"customer{i+1}@example.com",
        "city": random.choice(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego"]),
        "state": random.choice(["NY", "CA", "IL", "TX", "AZ", "PA", "FL", "WA"]),
        "country": "USA",
        "registration_date": (start_date + timedelta(days=random.randint(-365, 0))).strftime("%Y-%m-%d"),
        "total_orders": random.randint(1, 50),
        "total_spent": round(random.uniform(100, 50000), 2),
        "customer_tier": random.choice(["Bronze", "Silver", "Gold", "Platinum"])
    })

df_customers = pd.DataFrame(customers)
df_customers.to_csv(f"{UPLOAD_DIR}/customers.csv", index=False)
print(f"✓ Created {UPLOAD_DIR}/customers.csv")

# 3. Product Inventory (Parquet)
print("Creating product inventory data...")
products = []
for i in range(50):
    products.append({
        "product_id": f"PROD-{i+1:03d}",
        "name": random.choice(["Laptop", "Mouse", "Keyboard", "Monitor", "Headphones", "Webcam", "Tablet", "Phone", "Printer", "Scanner"]),
        "category": random.choice(["Electronics", "Accessories", "Computers", "Mobile", "Peripherals"]),
        "brand": random.choice(["TechBrand", "SuperTech", "MegaCorp", "QualityGoods", "PremiumLine"]),
        "stock_quantity": random.randint(0, 500),
        "unit_price": round(random.uniform(10, 2000), 2),
        "cost": round(random.uniform(5, 1500), 2),
        "supplier": random.choice(["Supplier A", "Supplier B", "Supplier C", "Supplier D"]),
        "last_restocked": (start_date + timedelta(days=random.randint(-90, 0))).strftime("%Y-%m-%d")
    })

df_products = pd.DataFrame(products)
df_products.to_parquet(f"{UPLOAD_DIR}/products.parquet", index=False)
print(f"✓ Created {UPLOAD_DIR}/products.parquet")

# 4. Employee Data (Excel with multiple sheets)
print("Creating employee data...")
employees = []
departments = ["Sales", "Engineering", "Marketing", "HR", "Finance", "Operations"]
for i in range(200):
    dept = random.choice(departments)
    employees.append({
        "employee_id": f"EMP-{i+1:04d}",
        "name": f"Employee {i+1}",
        "email": f"emp{i+1}@company.com",
        "department": dept,
        "position": random.choice(["Manager", "Senior", "Junior", "Lead", "Director", "Associate"]),
        "salary": round(random.uniform(40000, 150000), 2),
        "hire_date": (start_date + timedelta(days=random.randint(-1000, 0))).strftime("%Y-%m-%d"),
        "manager_id": f"EMP-{random.randint(1, 20):04d}" if i > 20 else None
    })

df_employees = pd.DataFrame(employees)

# Create Excel with multiple sheets
with pd.ExcelWriter(f"{UPLOAD_DIR}/employees.xlsx", engine='openpyxl') as writer:
    df_employees.to_excel(writer, sheet_name="All Employees", index=False)
    for dept in departments:
        dept_df = df_employees[df_employees["department"] == dept]
        dept_df.to_excel(writer, sheet_name=dept, index=False)

print(f"✓ Created {UPLOAD_DIR}/employees.xlsx with multiple sheets")

print("\n✓ All sample data files created successfully!")
print(f"\nFiles created in {UPLOAD_DIR}:")
print("  - sales_data.csv")
print("  - sales_data.xlsx")
print("  - customers.csv")
print("  - products.parquet")
print("  - employees.xlsx")


