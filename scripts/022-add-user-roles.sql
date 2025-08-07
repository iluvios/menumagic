-- Add user roles

-- Add a role column to the users table
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'employee';

-- Possible roles: owner, manager, employee
