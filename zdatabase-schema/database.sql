
-- =====================================================
-- AMARI POS AND INVENTORY MANAGEMENT SYSTEM
-- TABLE DEFINITIONS WITH KEYS
-- =====================================================

-- =====================================================
-- 1. USERS TABLE - For authentication and staff management
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('cashier', 'manager', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. PRODUCTS TABLE - Main inventory for POS
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100) NOT NULL,
    stock BIGINT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock BIGINT NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    sku VARCHAR(100) UNIQUE NOT NULL,
    image VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. INGREDIENTS TABLE - Inventory management for ingredients
-- =====================================================
CREATE TABLE IF NOT EXISTS ingredients (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    current_stock DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    minimum_stock DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. SALES TABLE - Main sales transaction record
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
    id BIGSERIAL PRIMARY KEY,
    salesid VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL,
    sale_time TIME NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
    cash_received DECIMAL(12, 2),
    change DECIMAL(12, 2),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('Cash', 'E-Payment')),
    payment_sub_method VARCHAR(50),
    staffid BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Completed' CHECK (status IN ('Completed', 'Cancelled', 'Pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. SALE_ITEMS TABLE - Individual items in each sale
-- =====================================================
CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id VARCHAR(50) NOT NULL REFERENCES sales(salesid) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. STORE_SETTINGS TABLE - Configuration and QR codes
-- =====================================================
CREATE TABLE IF NOT EXISTS store_settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate store_settings with default keys
INSERT INTO store_settings (key, value, description) VALUES
    ('epayment_gcash_qr_url', '/mock-qr.png', 'GCash QR Code URL for E-Payment'),
    ('epayment_maya_qr_url', '/mock-qr.png', 'Maya QR Code URL for E-Payment')
ON CONFLICT (key) DO NOTHING;
