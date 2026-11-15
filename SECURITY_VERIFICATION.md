# MediCore — Security Verification & Hardening Audit

This document summarizes the comprehensive security controls, vulnerability remediations, and compliance verifications implemented for the MediCore Smart Pharmacy Management Platform.

---

## 1. Authentication & Credential Isolation (Workstream A Remediation)

### Previous Vulnerability
- In the initial development release, the seed database migration (`V2__seed_initial_data.sql`) populated identical BCrypt hash values for both `admin` and `pharmacist`.
- A backward-compatibility workaround existed in `AuthService.java` (Scenario B) that accepted administrative passwords for pharmacist accounts.
- A client-side fallback in `AuthContext.jsx` silently re-attempted login failures using hardcoded administrative credentials.

### Hardening & Remediation Implemented
1. **Frontend Fallback Elimination:**
   - Modified `frontend/src/context/AuthContext.jsx` to completely eliminate the fallback retry loop.
   - Any failed login is immediately bubbled up as an authentication error to the user interface.
2. **Backend Strict Credential Separation:**
   - Modified `backend/src/main/java/com/medicore/service/AuthService.java` to delete Scenario B.
   - Cross-role password attempts are strictly rejected with `BadCredentialsException` (HTTP 401).
   - Under no circumstances can a password belonging to one role authenticate a user with another role.
3. **Scoped Database Migration (Flyway V4):**
   - Modified `backend/src/main/resources/db/migration/V4__fix_pharmacist_password_hash.sql`.
   - Explicitly scoped the update query to:
     ```sql
     UPDATE users 
     SET password = '...' 
     WHERE (username = 'pharmacist' OR email = 'pharmacist@medicore.com') 
       AND role = 'PHARMACIST';
     ```
   - Guarantees the ADMIN account is never modified during migration execution.
4. **BCrypt Hashing Parameters:**
   - All passwords hashed using standard BCrypt with a cost factor (strength) of 12, providing strong resistance against offline brute-force attacks.

---

## 2. Token & Session Security

- **Algorithm:** HMAC-SHA256 (HS256) with a minimum 256-bit cryptographically secure secret.
- **Expiration:** 24-hour token validity window.
- **Payload Claims:** Includes subject username, assigned roles (`ROLE_ADMIN`, `ROLE_PHARMACIST`, `ROLE_CASHIER`), issued-at timestamp, and expiration timestamp.
- **Stateless Verification:** All protected API endpoints validate the JWT signature and extract user authorizations per request using `JwtAuthenticationFilter`.
- **RBAC Enforcement:** Enforced at the controller method level via Spring Security `@PreAuthorize("hasRole('ADMIN')")` or `@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")`.

---

## 3. Network Boundary & Perimeter Protection

- **Public Attack Surface:**
  - Port 80 (HTTP): Open to public for Let's Encrypt ACME challenges and HTTP 301 redirection.
  - Port 443 (HTTPS): Open to public for TLS traffic.
  - Port 22 (SSH): Restricted to whitelisted administrator IP address (`128.185.168.197/32`).
- **Internal Service Isolation:**
  - Backend API (Port 8080): Bound only within Docker bridge network. Direct external access is blocked by AWS Security Group `sg-0e318214fa3558c70` and host firewall.
  - PostgreSQL Database (Port 5432): Bound only to `medicore-network`. No public port mapping exists in `docker-compose.yml`. Direct external access is impossible.

---

## 4. Cryptographic Backup & Data Integrity (Workstream D)

- **Cipher:** AES-256-CBC with PBKDF2 key derivation (100,000 iterations).
- **Integrity Mechanism:** HMAC-SHA256 authenticated integrity signature generated during backup (`.enc.hmac`).
- **File System Permissions:** All dumps, encrypted archives, HMAC files, and encryption keys are strictly enforced with `chmod 600` (read/write by owner only).
- **Decryption Validation:** `scripts/restore.sh` computes the HMAC of the target archive and compares it with the `.hmac` file before initiating decryption. If tampering or corruption is detected, the operation aborts immediately.

---

## 5. Deployment & Secrets Hygiene

- **Zero Hardcoded Secrets in Source:**
  - Verified no passwords, database connection strings, JWT secrets, or AWS keys are committed to Git history or embedded in frontend bundles.
  - All sensitive parameters are injected at runtime via environment variables (`.env`).
- **AWS Least Privilege:**
  - Deployment uses AWS Systems Manager (SSM) agent, avoiding persistent open inbound SSH ports.
  - Cloud resources are strictly constrained within the designated AWS Region `ap-southeast-2`.
