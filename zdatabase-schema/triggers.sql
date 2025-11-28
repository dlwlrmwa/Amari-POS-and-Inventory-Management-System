-- =====================================================
-- AMARI POS SYSTEM - TRIGGERS
-- =====================================================

-- =====================================================
-- 1. TRIGGER - Update product stock on sale item insertion
-- =====================================================
CREATE OR REPLACE TRIGGER trigger_update_product_stock
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_sale();

-- =====================================================
-- 2. TRIGGER - Update product updated_at timestamp
-- =====================================================
CREATE OR REPLACE TRIGGER trigger_update_product_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. TRIGGER - Update ingredients updated_date on update
-- =====================================================
CREATE OR REPLACE TRIGGER trigger_update_ingredients_timestamp
BEFORE UPDATE ON ingredients
FOR EACH ROW
EXECUTE FUNCTION update_ingredients_timestamp();

-- =====================================================
-- 4. TRIGGER - Update sales timestamp
-- =====================================================
CREATE OR REPLACE TRIGGER trigger_update_sales_timestamp
BEFORE UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. TRIGGER - Update users timestamp
-- =====================================================
CREATE OR REPLACE TRIGGER trigger_update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- END OF TRIGGERS FILE
-- =====================================================
