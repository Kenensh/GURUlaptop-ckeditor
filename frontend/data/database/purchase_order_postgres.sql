-- PostgreSQL version of purchase_order table
-- Converted from MySQL to PostgreSQL format
-- Original file: purchase_order.sql

-- 刪除現有的 ENUM 類型（如果存在）
DROP TYPE IF EXISTS payment_method_enum CASCADE;
DROP TYPE IF EXISTS shipping_method_enum CASCADE;
DROP TYPE IF EXISTS order_status_enum CASCADE;

-- Create ENUM types for better data integrity
CREATE TYPE payment_method_enum AS ENUM ('LINE Pay', '信用卡', 'ATM');
CREATE TYPE shipping_method_enum AS ENUM ('7-11', 'Family Mart', 'Hi-Life', 'OK Mart', '郵局', '宅配');
CREATE TYPE order_status_enum AS ENUM ('pending', 'paid', 'fail', 'cancel', 'error');

-- Create purchase_order table
-- 如果表格已存在則刪除
DROP TABLE IF EXISTS public.purchase_order CASCADE;

CREATE TABLE public.purchase_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    amount INTEGER DEFAULT NULL,
    transaction_id VARCHAR(255) DEFAULT NULL,
    payment payment_method_enum DEFAULT NULL,
    shipping shipping_method_enum DEFAULT NULL,
    status order_status_enum DEFAULT 'pending',
    order_info TEXT DEFAULT NULL,
    reservation TEXT DEFAULT NULL,
    confirm TEXT DEFAULT NULL,
    return_code VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_purchase_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on record updates
CREATE TRIGGER trigger_update_purchase_order_updated_at
    BEFORE UPDATE ON public.purchase_order
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_order_updated_at();

-- Add comments to describe table and columns
COMMENT ON TABLE public.purchase_order IS 'Purchase orders table for managing customer orders and payment transactions';
COMMENT ON COLUMN public.purchase_order.id IS 'Unique identifier (UUID) for each purchase order';
COMMENT ON COLUMN public.purchase_order.user_id IS 'Foreign key reference to user table';
COMMENT ON COLUMN public.purchase_order.amount IS 'Total amount of the purchase order';
COMMENT ON COLUMN public.purchase_order.transaction_id IS 'Transaction ID from payment gateway';
COMMENT ON COLUMN public.purchase_order.payment IS 'Payment method used (LINE Pay, 信用卡, ATM)';
COMMENT ON COLUMN public.purchase_order.shipping IS 'Shipping method selected (7-11, Family Mart, Hi-Life, OK Mart, 郵局, 宅配)';
COMMENT ON COLUMN public.purchase_order.status IS 'Current status of the order (pending, paid, fail, cancel, error)';
COMMENT ON COLUMN public.purchase_order.order_info IS 'Order information sent to payment gateway (LINE Pay)';
COMMENT ON COLUMN public.purchase_order.reservation IS 'Reservation response received from payment gateway';
COMMENT ON COLUMN public.purchase_order.confirm IS 'Confirmation response from payment gateway';
COMMENT ON COLUMN public.purchase_order.return_code IS 'Return code from payment processing';
COMMENT ON COLUMN public.purchase_order.created_at IS 'Timestamp when the order was created';
COMMENT ON COLUMN public.purchase_order.updated_at IS 'Timestamp when the order was last updated';

-- Insert sample data for testing and development
INSERT INTO public.purchase_order (user_id, amount, transaction_id, payment, shipping, status, order_info, return_code) VALUES
('1', 2590, 'TXN20241201001', 'LINE Pay', '7-11', 'paid', '{"items": [{"name": "Gaming Laptop ASUS ROG", "price": 2590, "quantity": 1}]}', '0000'),
('2', 1890, 'TXN20241201002', '信用卡', 'Family Mart', 'paid', '{"items": [{"name": "Gaming Mouse Logitech G Pro", "price": 1890, "quantity": 1}]}', '0000'),
('3', 3200, 'TXN20241201003', 'ATM', '郵局', 'pending', '{"items": [{"name": "Mechanical Keyboard", "price": 3200, "quantity": 1}]}', NULL),
('1', 850, 'TXN20241201004', 'LINE Pay', '宅配', 'paid', '{"items": [{"name": "Gaming Headset", "price": 850, "quantity": 1}]}', '0000'),
('4', 4500, 'TXN20241201005', '信用卡', 'Hi-Life', 'fail', '{"items": [{"name": "Gaming Monitor 27inch", "price": 4500, "quantity": 1}]}', '9999'),
('5', 1200, 'TXN20241201006', 'LINE Pay', 'OK Mart', 'paid', '{"items": [{"name": "Gaming Chair", "price": 1200, "quantity": 1}]}', '0000'),
('2', 680, 'TXN20241201007', 'ATM', '7-11', 'pending', '{"items": [{"name": "Webcam HD", "price": 680, "quantity": 1}]}', NULL),
('3', 2100, 'TXN20241201008', 'LINE Pay', 'Family Mart', 'paid', '{"items": [{"name": "Graphics Tablet", "price": 2100, "quantity": 1}]}', '0000'),
('6', 950, 'TXN20241201009', '信用卡', '郵局', 'cancel', '{"items": [{"name": "USB Microphone", "price": 950, "quantity": 1}]}', NULL),
('1', 3800, 'TXN20241201010', 'LINE Pay', '宅配', 'paid', '{"items": [{"name": "SSD 1TB", "price": 3800, "quantity": 1}]}', '0000'),
('4', 1650, 'TXN20241201011', 'ATM', 'Hi-Life', 'pending', '{"items": [{"name": "RAM 32GB", "price": 1650, "quantity": 1}]}', NULL),
('7', 2900, 'TXN20241201012', 'LINE Pay', 'OK Mart', 'paid', '{"items": [{"name": "CPU Cooler", "price": 2900, "quantity": 1}]}', '0000'),
('5', 1150, 'TXN20241201013', '信用卡', '7-11', 'paid', '{"items": [{"name": "Power Supply 750W", "price": 1150, "quantity": 1}]}', '0000'),
('8', 720, 'TXN20241201014', 'LINE Pay', 'Family Mart', 'error', '{"items": [{"name": "Cable Management Kit", "price": 720, "quantity": 1}]}', '5000'),
('2', 5200, 'TXN20241201015', 'ATM', '郵局', 'pending', '{"items": [{"name": "Gaming Desk", "price": 5200, "quantity": 1}]}', NULL);

-- Create indexes for better query performance
CREATE INDEX idx_purchase_order_user_id ON purchase_order(user_id);
CREATE INDEX idx_purchase_order_status ON purchase_order(status);
CREATE INDEX idx_purchase_order_payment ON purchase_order(payment);
CREATE INDEX idx_purchase_order_created_at ON purchase_order(created_at);
CREATE INDEX idx_purchase_order_transaction_id ON purchase_order(transaction_id);
