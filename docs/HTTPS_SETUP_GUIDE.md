# MediCore HTTPS and Custom Domain Setup Guide

This guide details the procedure for enabling TLS/HTTPS on the MediCore Smart Pharmacy Management Platform running on AWS EC2 (`15.135.82.107`).

---

## 1. Domain Prerequisites

Public Certificate Authorities like **Let's Encrypt** do not issue SSL/TLS certificates for raw IP addresses (`15.135.82.107`). You require a Fully Qualified Domain Name (FQDN).

### Free & Low-Cost Domain Options
| Provider | Cost | Setup Time | Suitability |
| :--- | :--- | :--- | :--- |
| **DuckDNS** (`yourname.duckdns.org`) | Free ($0) | 2 minutes | Dev / Demo / Testing |
| **No-IP** (`yourname.ddns.net`) | Free ($0) | 5 minutes | Academic / Evaluation |
| **Cloudflare** (`yourdomain.com`) | Free DNS / ~$9/yr registrar | 10 minutes | Production with DDoS protection |
| **AWS Route 53** | $0.50/mo hosted zone | 5 minutes | Enterprise AWS integration |

### DNS Configuration
In your domain registrar / DNS provider, add an **A Record**:
- **Type**: `A`
- **Name**: `@` (or `medicore` for subdomain)
- **IPv4 Value**: `15.135.82.107`
- **TTL**: `300` (5 minutes)

Verify DNS propagation before proceeding:
```bash
nslookup yourdomain.com 8.8.8.8
```

---

## 2. Automated SSL Issuance via Certbot

Once the DNS record points to `15.135.82.107`, connect to the EC2 host and run Certbot.

### Step 1: Install Certbot on EC2
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Request the Certificate
Use Certbot in webroot mode or standalone mode:
```bash
# Webroot mode (while Nginx is running)
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot -w /var/www/certbot \
  -d yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos \
  --non-interactive
```

The certificates will be generated at:
- Certificate: `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/yourdomain.com/privkey.pem`

---

## 3. Activate Production Nginx SSL Configuration

### Step 1: Substitute Domain in Template
```bash
cd /home/ubuntu/medicore-app
sed "s/__DOMAIN__/yourdomain.com/g" frontend/nginx.ssl.conf.template > frontend/nginx.conf
```

### Step 2: Verify Certificate Mount in `docker-compose.prod.yml`
Ensure `/etc/letsencrypt` is mounted read-only into `frontend`:
```yaml
services:
  frontend:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
```

### Step 3: Reload Nginx with Zero Downtime
```bash
docker compose -f docker-compose.prod.yml exec frontend nginx -t
docker compose -f docker-compose.prod.yml exec frontend nginx -s reload
```

---

## 4. Automated Certificate Renewal

Let's Encrypt certificates are valid for 90 days. Certbot installs a systemd timer by default. Test renewal:
```bash
sudo certbot renew --dry-run
```

Add a post-renewal hook to reload Nginx in Docker:
```bash
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
docker exec medicore-prod-frontend nginx -s reload
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

---

## 5. Verification
Verify SSL grade and security headers:
- Qualys SSL Labs: `https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com`
- Expected Grade: **A+**
- Active protocols: **TLS 1.2, TLS 1.3**
- Strict-Transport-Security: **Enabled (HSTS)**
