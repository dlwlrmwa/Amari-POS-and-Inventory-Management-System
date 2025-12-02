-- =====================================================
-- AMARI POS AND INVENTORY MANAGEMENT SYSTEM
-- DATABASE SCHEMA - TABLES
-- Updated: Using TIMESTAMPTZ with Asia/Manila timezone
-- =====================================================

-- Set timezone for this session
SET timezone = 'Asia/Manila';

-- Drop existing tables (if needed)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS daily_sales_summary CASCADE;
DROP TABLE IF EXISTS product_sales_performance CASCADE;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('cashier', 'manager', 'admin')),
    email VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    sku VARCHAR(50) UNIQUE NOT NULL,
    image VARCHAR(500),
    image_url VARCHAR(500),
    description TEXT,
    supplier_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);

-- =====================================================
-- INGREDIENTS TABLE
-- =====================================================
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(10, 2) NOT NULL DEFAULT 5,
    cost_per_unit DECIMAL(10, 2),
    supplier VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    added_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingredients_name ON ingredients(name);

-- =====================================================
-- SALES TABLE
-- =====================================================
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    salesid VARCHAR(20) UNIQUE NOT NULL,
    date DATE NOT NULL,
    sale_time TIME NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    cash_received DECIMAL(10, 2),
    change DECIMAL(10, 2),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('Cash', 'E-Payment')),
    payment_sub_method VARCHAR(20) CHECK (payment_sub_method IN ('GCash', 'Maya')),
    staffid INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'Completed' CHECK (status IN ('Completed', 'Pending')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_staffid ON sales(staffid);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);
CREATE INDEX idx_sales_status ON sales(status);

-- =====================================================
-- SALE ITEMS TABLE
-- =====================================================
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id VARCHAR(20) NOT NULL REFERENCES sales(salesid) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    action VARCHAR(50) NOT NULL CHECK (action IN ('LOGIN', 'LOGOUT', 'SALE', 'PAYMENT_PROCESSING', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'STOCK_ADJUSTMENT', 'SETTINGS_CHANGE')),
    entity_type VARCHAR(50),
    entity_id INTEGER,
    description TEXT,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- SETTINGS TABLE
-- =====================================================
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(100),
    store_address TEXT,
    store_phone VARCHAR(20),
    store_email VARCHAR(100),
    tax_rate DECIMAL(5, 2),
    currency VARCHAR(10),
    timezone VARCHAR(50),
    receipt_footer TEXT,
    gcash_qr_url VARCHAR(500),
    maya_qr_url VARCHAR(500),
    business_license VARCHAR(100),
    tin VARCHAR(20),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DAILY SALES SUMMARY VIEW TABLE
-- =====================================================
CREATE TABLE daily_sales_summary (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    total_sales DECIMAL(12, 2),
    transaction_count INTEGER,
    average_transaction DECIMAL(10, 2),
    cash_sales DECIMAL(12, 2),
    epayment_sales DECIMAL(12, 2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_summary_date ON daily_sales_summary(date);

-- =====================================================
-- PRODUCT SALES PERFORMANCE TABLE
-- =====================================================
CREATE TABLE product_sales_performance (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(150),
    total_quantity_sold INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    last_sold_date DATE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_performance_product_id ON product_sales_performance(product_id);
CREATE INDEX idx_product_performance_revenue ON product_sales_performance(total_revenue);

-- =====================================================
-- INSERT DEFAULT RECORDS
-- =====================================================