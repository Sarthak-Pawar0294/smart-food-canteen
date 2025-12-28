/*
  # Smart Food Canteen Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Auto-generated user ID
      - `email` (text, unique) - College email (firstname.PRN@vit.edu format)
      - `prn_hash` (text) - Hashed PRN number for password validation
      - `created_at` (timestamptz) - Account creation timestamp
    
    - `orders`
      - `id` (uuid, primary key) - Auto-generated order ID
      - `user_id` (uuid, foreign key) - References users table
      - `items` (jsonb) - Order items as JSON array
      - `total` (decimal) - Total order amount
      - `status` (text) - Order status (pending, completed, cancelled)
      - `created_at` (timestamptz) - Order creation timestamp

  2. Security
    - Enable RLS on both tables
    - Users can only read their own data
    - Users can create their own orders
    - Users can only view their own orders
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  prn_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items jsonb NOT NULL,
  total decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for orders table
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert sample users for testing
-- PRN: 12345 (password), email: john.12345@vit.edu
-- PRN: 67890 (password), email: sarah.67890@vit.edu
-- Note: In production, these would be properly hashed
INSERT INTO users (email, prn_hash) VALUES
  ('john.12345@vit.edu', '12345'),
  ('sarah.67890@vit.edu', '67890'),
  ('mike.11111@vit.edu', '11111')
ON CONFLICT (email) DO NOTHING;