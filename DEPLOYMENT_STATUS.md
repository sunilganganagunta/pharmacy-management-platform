# MediCore — Live Deployment Status

This document details the live operational state of the MediCore Smart Pharmacy Management Platform deployed on AWS.

---

## 1. Cloud Host Overview

- **Cloud Platform:** Amazon Web Services (AWS)
- **AWS Selected Region:** `ap-southeast-2` (Sydney)
- **AWS Project ID:** `774697186763`
- **EC2 Instance ID:** `i-0be536c99a4381e25`
- **Instance Type:** `t3.medium`
- **Operating System:** Ubuntu 24.04 LTS (Noble Numbat)
- **Public IP:** `15.135.82.107`
- **Public DNS Hostname:** `ec2-15-135-82-107.ap-southeast-2.compute.amazonaws.com`
- **Status:** **RUNNING & HEALTHY**

---

## 2. Live Docker Container Architecture

All application workloads run within a private Docker bridge network (`medicore-network`), managed via Docker Compose.

```
                    Internet
                       │
             ┌─────────▼─────────┐
             │    Nginx Proxy    │
             │  Port 80 / 443    │
             └─────────┬─────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
┌─────────▼─────────┐     ┌─────────▼─────────┐
│  React Frontend   │     │ Spring Boot API   │
│  (Port 80: Nginx) │     │    (Port 8080)    │
└───────────────────┘     └─────────┬─────────┘
                                    │
                          ┌─────────▼─────────┐
                          │ PostgreSQL 16 DB  │
                          │    (Port 5432)    │
                          └───────────────────┘
```

### Live Container Inventory
| Container Name | Service | Image / Tag | Exposed Host Port | Container Port | Health Status |
|---|---|---|:---:|:---:|:---:|
| `medicore-frontend` | Nginx & React UI | `sunilganganagunta/medicore-frontend:latest` | `80:80`, `443:443` | 80 | **Healthy** (HTTP 200) |
| `medicore-backend` | Spring Boot 3.3.5 | `sunilganganagunta/medicore-backend:2117cde` | None (Internal) | 8080 | **Healthy** (Actuator UP) |
| `medicore-postgres` | PostgreSQL 16-alpine | `postgres:16-alpine` | None (Internal) | 5432 | **Healthy** (`pg_isready` OK) |

---

## 3. Network & Perimeter Security Configuration

- **Security Group:** `sg-0e318214fa3558c70`
- **Inbound Rules:**
  - Port 80 (HTTP): `0.0.0.0/0` (Allowed for Let's Encrypt validation and HTTP redirect)
  - Port 443 (HTTPS): `0.0.0.0/0` (Allowed for secure client traffic)
  - Port 22 (SSH): Restricted to administrator IP `128.185.168.197/32`
  - Port 8080 (Spring Boot API): **DENIED / FILTERED** (Accessible only via Nginx reverse proxy)
  - Port 5432 (PostgreSQL): **DENIED / FILTERED** (Accessible only inside Docker bridge network)
- **Outbound Rules:** `0.0.0.0/0` (Full outbound access for package updates, AWS API calls, and Docker registries)

---

## 4. Database & Migration Status

- **Database Engine:** PostgreSQL 16.3 on Alpine Linux
- **Database Name:** `medicoredb`
- **Volume Mount:** `medicore_postgres_data` (Persistent Docker named volume)
- **Migration Manager:** Flyway Community Edition

### Flyway Schema History (Live Host)
| Version | Description | Type | Installed On | State |
|:---:|---|:---:|:---:|:---:|
| **1** | create initial schema | SQL | Baseline | **SUCCESS** |
| **2** | seed initial data | SQL | Baseline | **SUCCESS** |
| **3** | create sale item and add customer balance | SQL | Baseline | **SUCCESS** |
| **4** | fix pharmacist password hash | SQL | *Pending CD Deployment* | **PENDING** |

> [!NOTE]
> Flyway V4 migration has been authored, verified, and committed locally (`af48111`). It will be applied automatically upon the first startup of the updated backend container image.

---

## 5. Live Endpoint Smoke Test Verification

| Endpoint | Protocol | HTTP Status | Response Payload / Header |
|---|:---:|:---:|---|
| `/` | HTTP | `200 OK` | React SPA index document (`<!doctype html>`) |
| `/actuator/health` | HTTP | `200 OK` | `{"status":"UP"}` |
| `/api/v1/auth/login` | HTTP | `200 OK` | Authentication token returned for Admin |
| `/api/v1/products` | HTTP | `200 OK` | Product catalog array (10 items) |
| `/api/v1/reports/dashboard` | HTTP | `200 OK` | Aggregated revenue and inventory metrics |
