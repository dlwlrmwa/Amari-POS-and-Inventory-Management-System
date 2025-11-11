-- #############################################################################
-- ## This SQL script is generated based on the project's data structures.
-- ## It defines the necessary tables for the Amari POS and Inventory System.
-- #############################################################################

-- -----------------------------------------------------------------------------
-- ## Users Table
-- ## Stores user account information and roles.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    name TEXT,
    -- In a real application, this password should be hashed.
    -- Supabase auth would handle this, but creating a simple table based on settings.tsx
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('cashier', 'manager', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS 'Stores user accounts and roles for the application.';
COMMENT ON COLUMN public.users.role IS 'User role determines access permissions.';


-- -----------------------------------------------------------------------------
-- ## Products Table
-- ## Stores inventory information for all products.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category TEXT,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    sku TEXT NOT NULL UNIQUE,
    image TEXT, -- URL to the product image
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.products IS 'Manages all product inventory information.';
COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit, unique for each product.';
COMMENT ON COLUMN public.products.min_stock IS 'Minimum stock level to trigger a low stock alert.';


-- -----------------------------------------------------------------------------
-- ## Sales Table
-- ## Records each sales transaction.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY, -- Custom transaction ID like 'TXN-...'
    date DATE NOT NULL,
    time TIME NOT NULL,
    customer TEXT,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'E-Payment')),
    payment_sub_method TEXT CHECK (payment_sub_method IN ('GCash', 'Maya')),
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sales IS 'Header information for each sales transaction.';
COMMENT ON COLUMN public.sales.id IS 'Custom-generated unique transaction identifier.';


-- -----------------------------------------------------------------------------
-- ## Sale Items Table
-- ## Records the individual items included in each sale.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sale_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    sale_id TEXT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL, -- Denormalized for reporting
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sale_items IS 'Line items for each sale, linking products to a transaction.';
COMMENT ON COLUMN public.sale_items.product_name IS 'Denormalized product name at the time of sale for historical accuracy.';


-- -----------------------------------------------------------------------------
-- ## Store Settings Table
-- ## Stores general configuration for the store, like QR codes.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.store_settings IS 'Stores key-value pairs for application settings.';

-- Insert default settings for QR codes if they don't exist
INSERT INTO public.store_settings (key, value)
VALUES
    ('epayment_gcash_qr_url', '/mock-qr.png'),
    ('epayment_maya_qr_url', '/mock-qr.png')
ON CONFLICT (key) DO NOTHING;


-- #############################################################################
-- ## End of script.
-- #############################################################################
