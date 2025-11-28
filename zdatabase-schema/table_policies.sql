-- =====================================================
-- FIX: ENABLE TABLE POLICIES FOR TRANSACTIONS
-- This allows the app to read/write to tables
-- =====================================================

-- =====================================================
-- IMPORTANT: These policies allow unauthenticated access
-- which is needed for the POS system to function
-- =====================================================

-- 1. USERS TABLE POLICIES
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all users to read users"
ON users FOR SELECT
USING (true);

CREATE POLICY "Allow all to insert users"
ON users FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 2. PRODUCTS TABLE POLICIES
-- =====================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to read products"
ON products FOR SELECT
USING (true);

CREATE POLICY "Allow all to insert products"
ON products FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all to update products"
ON products FOR UPDATE
USING (true)
WITH CHECK (true);

-- =====================================================
-- 3. SALES TABLE POLICIES
-- =====================================================
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to read sales"
ON sales FOR SELECT
USING (true);

CREATE POLICY "Allow all to insert sales"
ON sales FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all to update sales"
ON sales FOR UPDATE
USING (true)
WITH CHECK (true);

-- =====================================================
-- 4. SALE_ITEMS TABLE POLICIES
-- =====================================================
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to read sale_items"
ON sale_items FOR SELECT
USING (true);

CREATE POLICY "Allow all to insert sale_items"
ON sale_items FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 5. INGREDIENTS TABLE POLICIES
-- =====================================================
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to read ingredients"
ON ingredients FOR SELECT
USING (true);

CREATE POLICY "Allow all to insert ingredients"
ON ingredients FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all to update ingredients"
ON ingredients FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all to delete ingredients"
ON ingredients FOR DELETE
USING (true);

-- =====================================================
-- 6. STORE_SETTINGS TABLE POLICIES
-- =====================================================
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to read store_settings"
ON store_settings FOR SELECT
USING (true);

CREATE POLICY "Allow all to insert store_settings"
ON store_settings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all to update store_settings"
ON store_settings FOR UPDATE
USING (true)
WITH CHECK (true);

-- =====================================================
-- END OF TABLE POLICIES
-- =====================================================
