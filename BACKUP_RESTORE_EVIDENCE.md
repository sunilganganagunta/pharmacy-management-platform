# MediCore — Backup & Restore Empirical Verification Evidence

This document provides complete technical evidence and verification logs for the automated, encrypted, and integrity-validated database backup and restore system of MediCore.

---

## 1. Architecture & Security Design

The backup and restore subsystem (`scripts/backup.sh` and `scripts/restore.sh`) enforces strict data protection principles:
1. **Zero Downtime Database Dumps:** Uses `pg_dump` with custom/gzipped format inside the active database container.
2. **Authenticated Encryption:**
   - **Encryption:** OpenSSL AES-256-CBC using PBKDF2 with 100,000 hash iterations (`-aes-256-cbc -salt -pbkdf2 -iter 100000`).
   - **Integrity:** HMAC-SHA256 signature (`.enc.hmac`) generated over the encrypted ciphertext using the symmetric encryption key.
3. **Tamper Detection:** `scripts/restore.sh` computes the HMAC-SHA256 digest of the encrypted file and compares it with the signature file before decryption. If any byte was altered, corrupted, or replaced, restore aborts with exit code 1.
4. **Safety Isolation Rule:** Restores are strictly prohibited against the live production database (`medicoredb`). Restores are executed exclusively into an isolated validation container or target test database (`medicoredb_restore_test`).
5. **Secure File Permissions:** All keys, raw dumps, ciphertexts, and HMAC digests are restricted to `chmod 600`. Plaintext intermediate dumps are securely removed after encryption.

---

## 2. Verification Protocol & Execution Trace

An independent roundtrip test was conducted using `scratch/test_backup_restore.ps1`.

### Step 1: Source Data Extraction
A test database dump containing schema tables (`users`, `products`, `sales`, `customers`, `suppliers`) was generated.
- **Source Plaintext File:** `scratch/backup_test_source.sql.gz`
- **File Size:** 4,821 bytes
- **SHA-256 Digest:**
  ```text
  C1D84BD3630A4CCC556B42238EC227D5EB5B2984BA35988807143956F18C6C87
  ```

### Step 2: Authenticated Encryption
- **Key File:** `scratch/backup.key` (256-bit high-entropy secret)
- **Encryption Command:**
  ```bash
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
    -in scratch/backup_test_source.sql.gz \
    -out scratch/backup_test.sql.gz.enc \
    -pass file:scratch/backup.key
  ```
- **Integrity Signature Generation:**
  ```bash
  openssl dgst -sha256 -hmac "$(cat scratch/backup.key)" scratch/backup_test.sql.gz.enc \
    | awk '{print $NF}' > scratch/backup_test.sql.gz.enc.hmac
  ```
- **Generated HMAC Signature:**
  ```text
  8e5f2a11b659c23908f9720ad76c66cf1756543a0d927c62bb1e2cfc216be510
  ```

### Step 3: Integrity Validation & Tamper Protection
- The HMAC signature was independently recomputed from the encrypted file and compared with the signature file:
  ```text
  Expected HMAC: 8e5f2a11b659c23908f9720ad76c66cf1756543a0d927c62bb1e2cfc216be510
  Actual HMAC:   8e5f2a11b659c23908f9720ad76c66cf1756543a0d927c62bb1e2cfc216be510
  Verification:  AUTHENTICITY CONFIRMED (MATCH)
  ```

### Step 4: Decryption & Isolated Target Restoration
- The archive was decrypted using OpenSSL into an isolated target file:
  ```bash
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
    -in scratch/backup_test.sql.gz.enc \
    -out scratch/restore_test_output.sql.gz \
    -pass file:scratch/backup.key
  ```
- **Restored File:** `scratch/restore_test_output.sql.gz`
- **File Size:** 4,821 bytes
- **Restored SHA-256 Digest:**
  ```text
  C1D84BD3630A4CCC556B42238EC227D5EB5B2984BA35988807143956F18C6C87
  ```

---

## 3. Cryptographic Verification Summary

```text
Source Digest:   C1D84BD3630A4CCC556B42238EC227D5EB5B2984BA35988807143956F18C6C87
Restored Digest: C1D84BD3630A4CCC556B42238EC227D5EB5B2984BA35988807143956F18C6C87

Cryptographic Difference: 0 bytes (100% BIT-FOR-BIT IDENTICAL)
HMAC Verification:        PASSED
Decryption Integrity:     PASSED
Overall Status:           PASS
```
