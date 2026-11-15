# MediCore — HTTPS & TLS Configuration Status

This document describes the implementation state, TLS architecture, and deployment procedures for HTTPS in the MediCore Smart Pharmacy Management Platform.

---

## 1. Current Operational Status

- **Status:** **BLOCKED BY DOMAIN OWNERSHIP**
- **Public IP Address:** `15.135.82.107`
- **AWS Selected Region:** `ap-southeast-2` (Sydney)
- **Security Group:** `sg-0e318214fa3558c70`
- **Network Port 80 (HTTP):** **OPEN** (Allowed for ACME HTTP-01 challenge validation)
- **Network Port 443 (HTTPS):** **OPEN** (Allowed for encrypted traffic)
- **TLS Configuration Artifacts:** **IMPLEMENTED & READY FOR ACTIVATION**

> [!WARNING]
> Let's Encrypt and other trusted public Certificate Authorities (CAs) mandate a valid Fully Qualified Domain Name (FQDN) with public DNS A-records pointing to the target IP address. Let's Encrypt does not issue certificates for raw public IPv4 addresses. To preserve security integrity and adhere strictly to audit standards, self-signed certificates are NOT used in production, and HTTPS is accurately identified as blocked awaiting domain assignment.

---

## 2. Prepared Production TLS Architecture

All necessary configuration files, Nginx SSL templates, and Certbot automation hooks have been authored and verified.

### 1. Nginx Reverse Proxy SSL Configuration Template
Located at `frontend/nginx.ssl.conf.template`:
- **Protocols Supported:** TLSv1.2 and TLSv1.3 exclusively (obsolete SSLv3, TLSv1.0, TLSv1.1 disabled).
- **Cipher Suites:** High-strength modern ciphers:
  ```text
  ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
  ```
- **HTTP to HTTPS Redirection:**
  ```nginx
  server {
      listen 80;
      server_name ${DOMAIN_NAME};
      location /.well-known/acme-challenge/ {
          root /var/www/certbot;
      }
      location / {
          return 301 https://$host$request_uri;
      }
  }
  ```
- **HSTS (HTTP Strict Transport Security):** Enforced with `max-age=31536000; includeSubDomains; preload`.
- **Security Headers:**
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';`

---

## 3. Automated Certificate Issuance & Renewal Pipeline

### One-Command Activation (Post-Domain Registration)
Once a domain (e.g. `pharmacy.example.com`) is registered and pointed to `15.135.82.107`:

```bash
# 1. SSH into production EC2 or run via AWS Systems Manager:
DOMAIN="pharmacy.example.com"
EMAIL="admin@medicore.com"

# 2. Obtain initial certificate via Certbot HTTP-01 challenge
docker run --rm \
  -v medicore_certbot_www:/var/www/certbot \
  -v medicore_certbot_conf:/etc/letsencrypt \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d ${DOMAIN} \
  --email ${EMAIL} \
  --agree-tos \
  --non-interactive

# 3. Substitute domain into nginx configuration template
envsubst '${DOMAIN_NAME}' < /opt/medicore/frontend/nginx.ssl.conf.template > /opt/medicore/frontend/nginx.conf

# 4. Reload Nginx without downtime
docker exec medicore-frontend nginx -s reload
```

### Automated Renewal (Cron Job)
A systemd timer or cron job on the EC2 host runs twice daily to automatically renew certificates prior to their 90-day expiration:
```bash
0 2,14 * * * docker run --rm -v medicore_certbot_www:/var/www/certbot -v medicore_certbot_conf:/etc/letsencrypt certbot/certbot renew --quiet && docker exec medicore-frontend nginx -s reload
```
