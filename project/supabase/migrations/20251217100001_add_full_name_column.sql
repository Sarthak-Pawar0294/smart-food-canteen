/*
  # Add full_name column to users table
  
  This migration adds an optional full_name column to support displaying
  student names throughout the application and on receipts.
  
  - Column: full_name (text, nullable)
  - Default: NULL (backward compatible)
  - Existing users continue to work without changes
*/

-- Add full_name column to users table (nullable for backward compatibility)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name text DEFAULT NULL;

-- Update sample users with full names for testing
UPDATE users SET full_name = 'John Doe' WHERE email = 'john.12345@vit.edu';
UPDATE users SET full_name = 'Sarah Smith' WHERE email = 'sarah.67890@vit.edu';
UPDATE users SET full_name = 'Mike Johnson' WHERE email = 'mike.11111@vit.edu';
