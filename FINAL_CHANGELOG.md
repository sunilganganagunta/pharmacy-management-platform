# MediCore — Final Production Changelog

All notable changes and technical modifications implemented to achieve production readiness for the MediCore Smart Pharmacy Management Platform are documented below.

---

## [Release Candidate 1.0.0] — November 2026

### Commit `af48111`
**Author:** MediCore DevOps & Security Team  
**Branch:** `main`  
**Summary:** `fix(security): enforce strict credential isolation, scoped Flyway V4 migration, and remove client-side fallback`

#### Modified Files:
1. `backend/src/main/java/com/medicore/service/AuthService.java`
   - **Change:** Removed legacy migration Scenario B which previously allowed pharmacists to authenticate with the administrative credential.
   - **Rationale:** Strict role isolation prevents cross-role credential substitution and adheres to NIST 800-63B authentication guidelines.

2. `backend/src/main/resources/db/migration/V4__fix_pharmacist_password_hash.sql`
   - **Change:** Explicitly scoped the update query to `WHERE (username = 'pharmacist' OR email = 'pharmacist@medicore.com') AND role = 'PHARMACIST'`.
   - **Rationale:** Guarantees that only the pharmacist account hash is updated and prevents unintentional updates to administrative or cashier accounts.

3. `backend/src/test/java/com/medicore/AuthServiceTest.java`
   - **Change:** Added unit test assertions verifying that invalid passwords and cross-role password attempts throw `BadCredentialsException`.
   - **Rationale:** Automated regression prevention for authentication security controls.

4. `frontend/src/context/AuthContext.jsx`
   - **Change:** Removed client-side catch block that re-attempted failed logins with hardcoded fallback passwords.
   - **Rationale:** Eliminates client-side security bypasses and ensures all authentication flows are strictly verified by backend Spring Security.

---

### Uncommitted / Script Enhancements
**Files:** `scripts/backup.sh`, `scripts/restore.sh`  
**Summary:** `feat(security): implement HMAC-SHA256 authenticated integrity verification for encrypted backups`

#### Modified Files:
1. `scripts/backup.sh`
   - **Change:** Added OpenSSL HMAC-SHA256 calculation after AES-256-CBC PBKDF2 encryption, generating a `.enc.hmac` integrity file with mode 600 permissions.
   - **Rationale:** Protects backup archives against bit-flipping attacks, data corruption, and unauthorized file tampering.

2. `scripts/restore.sh`
   - **Change:** Added pre-decryption HMAC validation step that recomputes the HMAC-SHA256 signature of the encrypted archive and compares it with the expected signature.
   - **Rationale:** Rejects tampered, corrupt, or unauthenticated archives before any data is fed to OpenSSL decryption or PostgreSQL restore processes.

---

### Infrastructure & Configuration Files
1. `frontend/nginx.ssl.conf.template`
   - **Change:** Production-grade Nginx configuration template with TLS 1.2/1.3 ciphers, HSTS, secure response headers, and port 80 to 443 redirection.
   - **Rationale:** Ready for immediate activation once domain DNS A-records are configured.

2. `.github/workflows/deploy.yml`
   - **Change:** AWS Systems Manager (SSM) deployment workflow avoiding SSH port 22 exposure, with pre-deployment backup, container healthchecks, and automatic rollback on failure.
   - **Rationale:** Zero-inbound-port production deployment security.

3. `scripts/rollback.sh`
   - **Change:** Automated rollback script capable of reverting `.env` tags to the last known stable git commit upon healthcheck failure.
   - **Rationale:** High availability and fault tolerance during production rollouts.
