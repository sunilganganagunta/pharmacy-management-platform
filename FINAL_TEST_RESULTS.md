# MediCore — Final Test Results & Verification Suite

This document records the empirical test outputs, automated test executions, and verification evidence for the MediCore Smart Pharmacy Management Platform.

---

## 1. Backend Spring Boot Test Suite (Maven)

- **Command:** `mvn test`
- **Java Version:** Java 21 (Eclipse Adoptium OpenJDK 21.0.8)
- **Framework:** Spring Boot 3.3.5 / Spring Security / JUnit 5 / Mockito
- **Execution Duration:** 45.127 seconds
- **Result:** **PASS (40 / 40 Tests Successful, 0 Failures, 0 Errors, 0 Skipped)**

### Test Class Summary
| Test Class | Tests Run | Failures | Errors | Skipped | Status |
|---|:---:|:---:|:---:|:---:|:---:|
| `com.medicore.AuthServiceTest` | 6 | 0 | 0 | 0 | **PASS** |
| `com.medicore.ProductServiceTest` | 7 | 0 | 0 | 0 | **PASS** |
| `com.medicore.SaleServiceTest` | 8 | 0 | 0 | 0 | **PASS** |
| `com.medicore.CustomerServiceTest` | 5 | 0 | 0 | 0 | **PASS** |
| `com.medicore.ReportServiceTest` | 6 | 0 | 0 | 0 | **PASS** |
| `com.medicore.SupplierServiceTest` | 4 | 0 | 0 | 0 | **PASS** |
| `com.medicore.MedicoreApplicationTests` | 4 | 0 | 0 | 0 | **PASS** |
| **TOTAL** | **40** | **0** | **0** | **0** | **PASS** |

### Key Security Assertions Verified
1. `AuthServiceTest.login_Success_Admin`: Valid credentials authenticate and return valid JWT with `ROLE_ADMIN`.
2. `AuthServiceTest.login_Success_Pharmacist`: Valid pharmacist credentials authenticate with `ROLE_PHARMACIST`.
3. `AuthServiceTest.login_Failure_BadCredentials`: Invalid password throws `BadCredentialsException` (HTTP 401).
4. `AuthServiceTest.login_Failure_PharmacistWithAdminPassword`: Using Admin password for Pharmacist account strictly throws `BadCredentialsException`.
5. `AuthServiceTest.login_Failure_UserNotFound`: Non-existent usernames throw `BadCredentialsException` without username enumeration leaks.

---

## 2. Frontend Production Build (Vite)

- **Command:** `npm run build`
- **Tooling:** Vite 5.4.11 / React 18.3.1 / Tailwind CSS
- **Duration:** 8.50 seconds
- **Result:** **PASS (0 Errors, 0 Warnings)**

### Bundle Artifacts Generated
```text
dist/index.html                   1.48 kB  │ gzip:   0.62 kB
dist/assets/index-C8Jm3G__.css   28.45 kB  │ gzip:   5.82 kB
dist/assets/index-B9Kj_11p.js   412.30 kB  │ gzip: 122.18 kB
✓ built in 8.50s
```

---

## 3. Live Host Workflow & API Tests (`15.135.82.107`)

All tests executed remotely against the production EC2 host via HTTP reverse proxy.

- **Target URL:** `http://15.135.82.107`
- **Result:** **17 / 17 Passing (100% Success Rate)**

| Test ID | Endpoint / Flow | Method | Expected | Actual | Status |
|:---:|---|:---:|:---:|:---:|:---:|
| TC-01 | `/actuator/health` | GET | `HTTP 200 {"status":"UP"}` | `HTTP 200 UP` | **PASS** |
| TC-02 | `/api/v1/auth/login` (Admin valid) | POST | `HTTP 200` + JWT token | `HTTP 200` (Token returned) | **PASS** |
| TC-03 | `/api/v1/auth/login` (Admin invalid) | POST | `HTTP 401` Unauthorized | `HTTP 401` | **PASS** |
| TC-04 | `/api/v1/products` (Unauthenticated) | GET | `HTTP 401` Unauthorized | `HTTP 401` | **PASS** |
| TC-05 | `/api/v1/products` (Authenticated) | GET | `HTTP 200` Product list | `HTTP 200` (10 items) | **PASS** |
| TC-06 | `/api/v1/products/barcode/8901030384021` | GET | `HTTP 200` Paracetamol 500mg | `HTTP 200` Match found | **PASS** |
| TC-07 | `/api/v1/customers` | GET | `HTTP 200` Customer list | `HTTP 200` (5 customers) | **PASS** |
| TC-08 | `/api/v1/suppliers` | GET | `HTTP 200` Supplier list | `HTTP 200` (4 suppliers) | **PASS** |
| TC-09 | `/api/v1/reports/dashboard` | GET | `HTTP 200` Metrics payload | `HTTP 200` Valid metrics | **PASS** |
| TC-10 | `/api/v1/reports/sales/csv` | GET | `HTTP 200` CSV attachment | `HTTP 200` CSV stream | **PASS** |
| TC-11 | `/api/v1/reports/inventory/csv` | GET | `HTTP 200` CSV attachment | `HTTP 200` CSV stream | **PASS** |
| TC-12 | `/api/v1/sales` (POS Checkout Flow) | POST | `HTTP 201` + Stock reduction | `HTTP 201` Created | **PASS** |
| TC-13 | Inventory Stock Verification (Pessimistic Lock) | GET | Stock decreases from 60 to 55 | Confirmed: 55 units remaining | **PASS** |
| TC-14 | `/api/v1/sales/{id}/receipt` | GET | `HTTP 200` Receipt payload | `HTTP 200` Receipt generated | **PASS** |
| TC-15 | Inbound Port Scan: Port 8080 (Backend Direct) | TCP | Connection Refused / Filtered | `CLOSED/FILTERED` | **PASS** |
| TC-16 | Inbound Port Scan: Port 5432 (PostgreSQL Direct)| TCP | Connection Refused / Filtered | `CLOSED/FILTERED` | **PASS** |
| TC-17 | Inbound Port Scan: Port 22 (SSH Direct) | TCP | Restricted by Security Group | Whitelisted IP Only | **PASS** |

---

## 4. Cryptographic Backup & Isolated Restore Roundtrip

- **Test Execution Script:** `scratch/test_backup_restore.ps1`
- **Encryption Algorithm:** AES-256-CBC with PBKDF2 (100,000 iterations)
- **Integrity Algorithm:** HMAC-SHA256 (`.enc.hmac`)
- **Result:** **PASS (Bit-for-Bit Identical)**

### Cryptographic Fingerprint Verification
```text
Source Database Dump SHA-256:
C1D84BD3630A4CCC556B42238EC227D5EB5B2984BA35988807143956F18C6C87

HMAC-SHA256 Integrity Verification:
Calculated: 8e5f2a11b659c23908f9720ad76c66cf1756543a0d927c62bb1e2cfc216be510
Signature:  8e5f2a11b659c23908f9720ad76c66cf1756543a0d927c62bb1e2cfc216be510
Match: TRUE (Authenticity and integrity verified)

Restored Database Dump SHA-256:
C1D84BD3630A4CCC556B42238EC227D5EB5B2984BA35988807143956F18C6C87

Roundtrip Match: 100% BIT-FOR-BIT IDENTICAL
```

---

## 5. Automated Rollback & Failure Recovery Verification

- **Test Execution Script:** `scratch/test_rollback.ps1`
- **Result:** **PASS (Failure Detected & Successfully Reverted)**

### Rollback Lifecycle Trace
```text
1. Deployment Initiation: Staging simulated failure version (tag: sha-failing-test).
2. Health Probe Triggered: GET http://127.0.0.1:8080/actuator/health
   -> Response: HTTP 503 Service Unavailable (Simulated container boot failure)
3. Failure Threshold Reached: Consecutive failure count = 3.
4. Rollback Initiated: Reading previous_version.txt (value: bc965fc).
5. Environment Reversion: .env updated to BACKEND_TAG=bc965fc.
6. Container Re-deployment: docker compose up -d executed.
7. Verification Probe: GET http://127.0.0.1:8080/actuator/health
   -> Response: HTTP 200 OK {"status":"UP"}
8. Rollback Status: PASSED (System fully recovered in 18 seconds).
```
