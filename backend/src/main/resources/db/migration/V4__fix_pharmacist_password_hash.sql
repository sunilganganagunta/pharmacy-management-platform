-- MediCore Database Migration V4
-- Fix Seed Password Hash for Default Pharmacist User
-- In V2, the password hash for pharmacist was accidentally seeded with the Admin@123 hash.
-- This migration updates the pharmacist password hash to the correct BCrypt hash for Pharmacist@123.

UPDATE users
SET password_hash = '$2a$10$d7E/2fCm2Ulqbx4uQScF5OiAdnXsAkCKya4iw3XhgBW.oj0fc0rs2'
WHERE username = 'pharmacist'
  AND password_hash = '$2a$10$eACCYoNOHEqgkHgDEQdWcuKkV1.aK7sN7bY9r7pfxP1tYjS1W1H4G';
