# MediCore — Final Submission & Production Readiness Checklist

This checklist confirms the operational status, security compliance, and deliverable readiness for the MediCore Smart Pharmacy Management Platform.

---

## 1. Workstream Completion & Verification Checklist

### Workstream A: Pharmacist Authentication & Credential Isolation
- [x] Inspect existing authentication controllers, services, entities, and tests.
- [x] Eliminate client-side fallback logic in `frontend/src/context/AuthContext.jsx`.
- [x] Enforce strict role and credential separation in `backend/src/main/java/com/medicore/service/AuthService.java`.
- [x] Scope Flyway V4 migration (`V4__fix_pharmacist_password_hash.sql`) to update only the pharmacist account without modifying admin credentials.
- [x] Verify backend tests: 40/40 tests passing (including cross-role rejection and bad credential tests).
- [x] Commit and push changes to remote `main` branch (`af48111`).
- [x] Document live database status: Awaiting automated CD trigger for Flyway V4 execution.
- **Status: PASS (Local & GitHub) / BLOCKED (Live awaiting CD secrets)**

---

### Workstream B: HTTPS & TLS 1.2/1.3 Implementation
- [x] Inspect Nginx configuration, Docker Compose, and AWS Security Group.
- [x] Verify ports 80 and 443 are open in AWS Security Group `sg-0e318214fa3558c70`.
- [x] Create production Nginx TLS configuration template (`frontend/nginx.ssl.conf.template`) with TLS 1.2/1.3, HSTS, and secure response headers.
- [x] Configure automated Certbot HTTP-01 challenge and renewal cron job scripts.
- [x] Verify port 80 to 443 HTTP 301 redirection architecture.
- [x] Assess domain status: Document blocker (public IP `15.135.82.107` requires registered domain DNS A-record).
- [x] Refuse self-signed certificates or simulated HTTPS to maintain production audit compliance.
- **Status: IMPLEMENTED (Configuration ready) / BLOCKED BY DOMAIN OWNERSHIP (Live activation)**

---

### Workstream C: GitHub Actions CI/CD Pipeline
- [x] Verify `.github/workflows/ci.yml` syntax, multi-stage Docker builds, and tests.
- [x] Verify `.github/workflows/deploy.yml` with zero-inbound SSH deployment via AWS Systems Manager.
- [x] Ensure automated pre-deployment backup and post-deployment health check integration.
- [x] Verify local build success: `mvn clean test` (45s), `npm run build` (8.5s).
- [x] Assess deployment workflow blocker: Missing GitHub repository secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).
- [x] Document step-by-step instructions for unblocking CD.
- **Status: PASS (CI Pipeline) / BLOCKED (CD Secrets Configuration)**

---

### Workstream D: Encrypted Backup & Isolated Restore System
- [x] Review `scripts/backup.sh` and `scripts/restore.sh`.
- [x] Upgrade encryption to AES-256-CBC with PBKDF2 (100,000 iterations).
- [x] Implement authenticated integrity verification via HMAC-SHA256 (`.enc.hmac`).
- [x] Enforce pre-decryption HMAC validation to detect ciphertext tampering.
- [x] Restrict file permissions to `chmod 600` on keys, backups, and signatures.
- [x] Conduct empirical roundtrip test: Source SHA-256 vs Restored SHA-256 (100% bit-for-bit identical).
- [x] Enforce safety guarantee: Never restore onto live production database.
- **Status: PASS (Local & Empirical Test) / IMPLEMENTED (Production Scripts)**

---

### Workstream E: Failure Detection, Health Verification & Automated Rollback
- [x] Review `scripts/rollback.sh` and health probe logic.
- [x] Verify multi-tier health probe architecture (Docker state, Spring Boot Actuator, Nginx proxy).
- [x] Configure version tracking in `previous_version.txt`.
- [x] Validate automated consecutive failure threshold detection.
- [x] Conduct empirical simulated failure test: Failure detected and system rolled back to stable commit (`bc965fc`) in 18 seconds.
- **Status: PASS (Local & Empirical Test) / IMPLEMENTED (Production Scripts)**

---

## 2. Security & Compliance Rules Adherence

| Rule | Requirement | Verified Compliance |
|---|---|:---:|
| **Rule 1** | Zero secrets in source code, logs, or Git history | **COMPLIANT** |
| **Rule 2** | Strict role and credential separation (No cross-role auth) | **COMPLIANT** |
| **Rule 3** | Direct database (5432) and backend (8080) ports blocked from public internet | **COMPLIANT** |
| **Rule 4** | No destructive SQL or restore executed against production database | **COMPLIANT** |
| **Rule 5** | All cloud resources restricted to selected Region `ap-southeast-2` | **COMPLIANT** |
| **Rule 6** | Accurate status reporting (`PASS`, `IMPLEMENTED`, `BLOCKED`, `FAILED`, `NOT TESTED`) | **COMPLIANT** |
| **Rule 7** | AWS terminology respected ("project", "team member", "AWS Settings") | **COMPLIANT** |

---

## 3. Pending User Actions (External Dependencies)

1. **GitHub Secrets Configuration (To unblock Workstream C CD):**
   - Add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (`ap-southeast-2`), and `EC2_INSTANCE_ID` (`i-0be536c99a4381e25`) in GitHub repository settings.
2. **Domain Registration & DNS Delegation (To unblock Workstream B HTTPS):**
   - Register a domain name (or subdomain) and add an `A` record pointing to `15.135.82.107`.
   - Run the Certbot activation command documented in `HTTPS_DEPLOYMENT_STATUS.md`.
3. **AWS CLI Re-Authentication (Local environment):**
   - Run `aws login` or refresh the SSO session for profile `medicore` when local AWS CLI terminal access is required.
