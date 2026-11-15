-- MediCore Database Migration V4
-- Fix Seed Password Hash for Default Pharmacist User
-- Safely updates ONLY the default pharmacist account to the correct BCrypt hash for Pharmacist@123.
-- Explicitly constrained to role 'PHARMACIST' and pharmacist identity to guarantee the admin account
-- and all other user accounts remain completely untouched.

UPDATE users
SET password_hash = '$2a$10$d7E/2fCm2Ulqbx4uQScF5OiAdnXsAkCKya4iw3XhgBW.oj0fc0rs2',
    updated_at = CURRENT_TIMESTAMP
WHERE (username = 'pharmacist' OR email = 'pharmacist@medicore.com')
  AND role = 'PHARMACIST';

