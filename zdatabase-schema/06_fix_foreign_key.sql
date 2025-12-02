-- =====================================================
-- FIX FOREIGN KEY CONSTRAINT FOR PRODUCT DELETION
-- =====================================================
-- This migration modifies the foreign key constraint on sale_items.product_id
-- from ON DELETE RESTRICT to ON DELETE SET NULL
-- This allows products to be deleted while preserving historical sales data

-- Step 1: Make product_id nullable
ALTER TABLE sale_items
ALTER COLUMN product_id DROP NOT NULL;

-- Step 2: Drop the old constraint
ALTER TABLE sale_items
DROP CONSTRAINT sale_items_product_id_fkey;

-- Step 3: Add new constraint with ON DELETE SET NULL
ALTER TABLE sale_items
ADD CONSTRAINT sale_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
