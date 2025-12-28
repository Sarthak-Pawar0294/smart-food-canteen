/*
  # Add receipt fields to orders table
  
  This migration adds fields to store receipt-related information:
  - payment_time: When the payment was made
  - valid_till_time: When the receipt expires (2 hours from payment)
  - payment_data: JSON data for receipt reconstruction
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_time timestamptz DEFAULT now();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS valid_till_time timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_data jsonb;
