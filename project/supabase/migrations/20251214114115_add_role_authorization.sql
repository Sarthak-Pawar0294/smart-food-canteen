/*
  # Add Role-Based Authorization

  1. Changes to users table
    - Add `role` column (text) with values: OWNER, STUDENT
    - Default role is STUDENT
  
  2. New data
    - Set canteen@vit.edu as OWNER
    - All other users default to STUDENT role

  3. Authorization rules
    - OWNER: Can view all orders, update order status
    - STUDENT: Can place orders, view only their own orders
*/

-- Add role column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'STUDENT';

-- Insert canteen owner account if it doesn't exist
INSERT INTO users (email, prn_hash, role) VALUES
  ('canteen@vit.edu', 'canteen', 'OWNER')
ON CONFLICT (email) DO UPDATE SET role = 'OWNER';

-- Ensure all existing students have STUDENT role
UPDATE users SET role = 'STUDENT' WHERE role IS NULL OR role != 'OWNER';