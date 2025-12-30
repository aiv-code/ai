-- Sample data for PostgreSQL database
-- This script creates tables and inserts sample data

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS analytics;

-- Sales Orders Table
CREATE TABLE IF NOT EXISTS analytics.sales_orders (
    order_id VARCHAR(50) PRIMARY KEY,
    order_date DATE NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    region VARCHAR(50),
    sales_rep VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS analytics.customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'USA',
    registration_date DATE,
    customer_tier VARCHAR(50),
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS analytics.products (
    product_id VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),
    unit_price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2),
    stock_quantity INTEGER DEFAULT 0,
    supplier VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample customers
INSERT INTO analytics.customers (customer_id, customer_name, email, city, state, country, registration_date, customer_tier, total_orders, total_spent) VALUES
('CUST-001', 'Acme Corporation', 'contact@acme.com', 'New York', 'NY', 'USA', '2022-01-15', 'Platinum', 45, 125000.00),
('CUST-002', 'XYZ Industries', 'info@xyz.com', 'Los Angeles', 'CA', 'USA', '2022-03-20', 'Gold', 32, 85000.00),
('CUST-003', 'Tech Solutions Inc', 'sales@techsol.com', 'Chicago', 'IL', 'USA', '2022-05-10', 'Gold', 28, 72000.00),
('CUST-004', 'Global Enterprises', 'hello@global.com', 'Houston', 'TX', 'USA', '2022-02-28', 'Silver', 18, 35000.00),
('CUST-005', 'Startup Co', 'team@startup.com', 'San Francisco', 'CA', 'USA', '2023-01-05', 'Bronze', 8, 12000.00),
('CUST-006', 'Mega Corp', 'contact@mega.com', 'Phoenix', 'AZ', 'USA', '2021-11-12', 'Platinum', 52, 180000.00),
('CUST-007', 'Small Business LLC', 'info@smallbiz.com', 'Philadelphia', 'PA', 'USA', '2022-08-22', 'Silver', 15, 28000.00),
('CUST-008', 'Enterprise Ltd', 'sales@enterprise.com', 'San Antonio', 'TX', 'USA', '2021-09-30', 'Gold', 38, 95000.00),
('CUST-009', 'New Company', 'hello@newco.com', 'San Diego', 'CA', 'USA', '2023-06-15', 'Bronze', 5, 8000.00),
('CUST-010', 'Old Business', 'contact@oldbiz.com', 'Dallas', 'TX', 'USA', '2020-12-01', 'Platinum', 60, 200000.00)
ON CONFLICT (customer_id) DO NOTHING;

-- Insert sample products
INSERT INTO analytics.products (product_id, product_name, category, brand, unit_price, cost, stock_quantity, supplier) VALUES
('PROD-001', 'Laptop Pro 15', 'Computers', 'TechBrand', 1299.99, 800.00, 45, 'Supplier A'),
('PROD-002', 'Wireless Mouse', 'Accessories', 'SuperTech', 29.99, 12.00, 200, 'Supplier B'),
('PROD-003', 'Mechanical Keyboard', 'Accessories', 'MegaCorp', 89.99, 40.00, 150, 'Supplier A'),
('PROD-004', '4K Monitor 27"', 'Electronics', 'QualityGoods', 399.99, 250.00, 80, 'Supplier C'),
('PROD-005', 'Noise Cancelling Headphones', 'Electronics', 'PremiumLine', 199.99, 100.00, 120, 'Supplier B'),
('PROD-006', 'HD Webcam', 'Accessories', 'TechBrand', 79.99, 35.00, 180, 'Supplier A'),
('PROD-007', 'Tablet 10"', 'Mobile', 'SuperTech', 299.99, 180.00, 90, 'Supplier D'),
('PROD-008', 'Smartphone Pro', 'Mobile', 'MegaCorp', 899.99, 550.00, 60, 'Supplier C'),
('PROD-009', 'Wireless Printer', 'Electronics', 'QualityGoods', 249.99, 150.00, 40, 'Supplier B'),
('PROD-010', 'Document Scanner', 'Electronics', 'PremiumLine', 179.99, 90.00, 55, 'Supplier A'),
('PROD-011', 'Laptop Air 13', 'Computers', 'TechBrand', 999.99, 600.00, 70, 'Supplier A'),
('PROD-012', 'Gaming Mouse', 'Accessories', 'SuperTech', 49.99, 20.00, 160, 'Supplier B'),
('PROD-013', 'RGB Keyboard', 'Accessories', 'MegaCorp', 129.99, 60.00, 110, 'Supplier A'),
('PROD-014', 'Ultrawide Monitor 34"', 'Electronics', 'QualityGoods', 599.99, 400.00, 30, 'Supplier C'),
('PROD-015', 'Bluetooth Earbuds', 'Electronics', 'PremiumLine', 149.99, 70.00, 200, 'Supplier B')
ON CONFLICT (product_id) DO NOTHING;

-- Insert sample sales orders
INSERT INTO analytics.sales_orders (order_id, order_date, customer_id, customer_name, product_id, product_name, quantity, unit_price, total_amount, region, sales_rep) VALUES
('ORD-0001', '2023-01-15', 'CUST-001', 'Acme Corporation', 'PROD-001', 'Laptop Pro 15', 5, 1299.99, 6499.95, 'North', 'John Doe'),
('ORD-0002', '2023-01-16', 'CUST-002', 'XYZ Industries', 'PROD-002', 'Wireless Mouse', 20, 29.99, 599.80, 'West', 'Jane Smith'),
('ORD-0003', '2023-01-17', 'CUST-003', 'Tech Solutions Inc', 'PROD-003', 'Mechanical Keyboard', 10, 89.99, 899.90, 'Central', 'Bob Johnson'),
('ORD-0004', '2023-01-18', 'CUST-004', 'Global Enterprises', 'PROD-004', '4K Monitor 27"', 8, 399.99, 3199.92, 'South', 'Alice Brown'),
('ORD-0005', '2023-01-19', 'CUST-005', 'Startup Co', 'PROD-005', 'Noise Cancelling Headphones', 3, 199.99, 599.97, 'West', 'Charlie Wilson'),
('ORD-0006', '2023-01-20', 'CUST-006', 'Mega Corp', 'PROD-006', 'HD Webcam', 15, 79.99, 1199.85, 'East', 'John Doe'),
('ORD-0007', '2023-01-21', 'CUST-007', 'Small Business LLC', 'PROD-007', 'Tablet 10"', 4, 299.99, 1199.96, 'North', 'Jane Smith'),
('ORD-0008', '2023-01-22', 'CUST-008', 'Enterprise Ltd', 'PROD-008', 'Smartphone Pro', 12, 899.99, 10799.88, 'Central', 'Bob Johnson'),
('ORD-0009', '2023-01-23', 'CUST-009', 'New Company', 'PROD-009', 'Wireless Printer', 2, 249.99, 499.98, 'South', 'Alice Brown'),
('ORD-0010', '2023-01-24', 'CUST-010', 'Old Business', 'PROD-010', 'Document Scanner', 6, 179.99, 1079.94, 'East', 'Charlie Wilson'),
('ORD-0011', '2023-02-01', 'CUST-001', 'Acme Corporation', 'PROD-011', 'Laptop Air 13', 8, 999.99, 7999.92, 'North', 'John Doe'),
('ORD-0012', '2023-02-02', 'CUST-002', 'XYZ Industries', 'PROD-012', 'Gaming Mouse', 25, 49.99, 1249.75, 'West', 'Jane Smith'),
('ORD-0013', '2023-02-03', 'CUST-003', 'Tech Solutions Inc', 'PROD-013', 'RGB Keyboard', 12, 129.99, 1559.88, 'Central', 'Bob Johnson'),
('ORD-0014', '2023-02-04', 'CUST-004', 'Global Enterprises', 'PROD-014', 'Ultrawide Monitor 34"', 5, 599.99, 2999.95, 'South', 'Alice Brown'),
('ORD-0015', '2023-02-05', 'CUST-005', 'Startup Co', 'PROD-015', 'Bluetooth Earbuds', 10, 149.99, 1499.90, 'West', 'Charlie Wilson'),
('ORD-0016', '2023-02-10', 'CUST-006', 'Mega Corp', 'PROD-001', 'Laptop Pro 15', 10, 1299.99, 12999.90, 'East', 'John Doe'),
('ORD-0017', '2023-02-11', 'CUST-007', 'Small Business LLC', 'PROD-002', 'Wireless Mouse', 15, 29.99, 449.85, 'North', 'Jane Smith'),
('ORD-0018', '2023-02-12', 'CUST-008', 'Enterprise Ltd', 'PROD-003', 'Mechanical Keyboard', 20, 89.99, 1799.80, 'Central', 'Bob Johnson'),
('ORD-0019', '2023-02-13', 'CUST-009', 'New Company', 'PROD-004', '4K Monitor 27"', 3, 399.99, 1199.97, 'South', 'Alice Brown'),
('ORD-0020', '2023-02-14', 'CUST-010', 'Old Business', 'PROD-005', 'Noise Cancelling Headphones', 8, 199.99, 1599.92, 'East', 'Charlie Wilson'),
('ORD-0021', '2023-03-01', 'CUST-001', 'Acme Corporation', 'PROD-006', 'HD Webcam', 12, 79.99, 959.88, 'North', 'John Doe'),
('ORD-0022', '2023-03-02', 'CUST-002', 'XYZ Industries', 'PROD-007', 'Tablet 10"', 6, 299.99, 1799.94, 'West', 'Jane Smith'),
('ORD-0023', '2023-03-03', 'CUST-003', 'Tech Solutions Inc', 'PROD-008', 'Smartphone Pro', 4, 899.99, 3599.96, 'Central', 'Bob Johnson'),
('ORD-0024', '2023-03-04', 'CUST-004', 'Global Enterprises', 'PROD-009', 'Wireless Printer', 5, 249.99, 1249.95, 'South', 'Alice Brown'),
('ORD-0025', '2023-03-05', 'CUST-005', 'Startup Co', 'PROD-010', 'Document Scanner', 2, 179.99, 359.98, 'West', 'Charlie Wilson')
ON CONFLICT (order_id) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON analytics.sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON analytics.sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_product ON analytics.sales_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_region ON analytics.sales_orders(region);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON analytics.customers(customer_tier);
CREATE INDEX IF NOT EXISTS idx_products_category ON analytics.products(category);

-- Display summary
SELECT 'Sample data inserted successfully!' AS status;
SELECT COUNT(*) AS total_customers FROM analytics.customers;
SELECT COUNT(*) AS total_products FROM analytics.products;
SELECT COUNT(*) AS total_orders FROM analytics.sales_orders;


