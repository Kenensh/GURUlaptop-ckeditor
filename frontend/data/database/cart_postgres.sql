-- PostgreSQL version of cart table
-- Converted from MySQL to PostgreSQL format
-- Original file: cart.sql

-- Create cart table with proper PostgreSQL syntax
-- 如果表格已存在則刪除
DROP TABLE IF EXISTS public.cart CASCADE;

CREATE TABLE public.cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    valid SMALLINT NOT NULL DEFAULT 1
);

-- Add comments to describe table and columns
COMMENT ON TABLE public.cart IS 'Shopping cart table for storing user cart items';
COMMENT ON COLUMN public.cart.id IS 'Primary key for cart items';
COMMENT ON COLUMN public.cart.user_id IS 'Foreign key reference to user table';
COMMENT ON COLUMN public.cart.product_id IS 'Foreign key reference to product table';
COMMENT ON COLUMN public.cart.quantity IS 'Quantity of the product in cart';
COMMENT ON COLUMN public.cart.valid IS 'Flag to indicate if cart item is valid (1=valid, 0=invalid)';

-- Create indexes for better query performance
CREATE INDEX idx_cart_user_id ON public.cart(user_id);
CREATE INDEX idx_cart_product_id ON public.cart(product_id);
CREATE INDEX idx_cart_valid ON public.cart(valid);

-- Reset sequence to continue from id 49 as indicated in original MySQL file
ALTER SEQUENCE cart_id_seq RESTART WITH 49;
