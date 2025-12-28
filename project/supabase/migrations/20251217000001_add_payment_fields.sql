-- Add payment fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING';

-- Update existing orders to have default values
UPDATE orders SET payment_method = 'CASH', payment_status = 'CASH' WHERE payment_method IS NULL;
