# MediCore – AWS Cloud Infrastructure & Deployment Guide

This guide details the end-to-end setup of the **MediCore Smart Pharmacy Management Platform** on Amazon Web Services (AWS), demonstrating DevOps best practices, cloud security hardening, and zero-downtime automated deployment.

---

## 1. Cloud Architecture Overview

```mermaid
flowchart TD
    DNS["DNS / Route 53 (medicore.yourdomain.com)"] --> IGW["AWS Internet Gateway"]
    IGW --> SG["AWS Security Group (Ports 80, 443, 22-restricted)"]
    
    subgraph VPC ["Default / Custom VPC (ap-southeast-2 - Sydney)"]
        SG --> EC2["Amazon EC2 Instance (t3.micro / Ubuntu 24.04 LTS)"]
        
        subgraph EC2Host ["Docker Compose Runtime Environment"]
            NginxContainer["Frontend / Nginx Reverse Proxy Container (:80 / :443)"]
            BackendContainer["Spring Boot 3 (Java 21) Container (:8080)"]
            PostgresContainer["PostgreSQL 16 Container (:5432, Private)"]
            
            NginxContainer -->|"Proxy Pass (/api/*)"| BackendContainer
            BackendContainer -->|"JDBC"| PostgresContainer
        end
    end

    subgraph AWSServices ["AWS Managed Services"]
        ECR["Amazon ECR (medicore-backend & medicore-frontend)"]
        IAM["AWS IAM Role (medicore-ec2-role / medicore-ec2-profile)"]
        CloudWatch["AWS CloudWatch Logs & Metrics"]
    end

    EC2 -.->|"Pulls Images via IAM"| ECR
    EC2 -.->|"Stream Application Logs"| CloudWatch
```

---

## 2. Step 1: Amazon ECR Setup

Create two private Amazon ECR repositories to store versioned Docker images:

```bash
# 1. Set your AWS Region
export AWS_REGION="ap-southeast-2"

# 2. Create Backend ECR Repository
aws ecr create-repository \
    --repository-name medicore-backend \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    --region $AWS_REGION

# 3. Create Frontend ECR Repository
aws ecr create-repository \
    --repository-name medicore-frontend \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    --region $AWS_REGION
```

Note down the repository URI: `<aws_account_id>.dkr.ecr.<region>.amazonaws.com`.

---

## 3. Step 2: AWS IAM Configuration (Least Privilege)

### 3.1 EC2 Instance Role for ECR Pull
Create an IAM Role `MediCore-EC2-Role` with the following policy to allow EC2 to pull images from ECR without storing static AWS access keys on the instance:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

Attach this IAM role as an **Instance Profile** to your EC2 instance.

### 3.2 GitHub Actions Deployment User / OIDC
Create an IAM User `github-actions-medicore` for CI/CD with permissions to authenticate, build, and push to ECR:
- Policy: `AmazonEC2ContainerRegistryPowerUser`

---

## 4. Step 3: AWS Security Group Configuration

Create a Security Group `medicore-sg` with strict inbound firewall rules:

| Type | Protocol | Port Range | Source | Purpose |
|------|----------|------------|--------|---------|
| HTTPS | TCP | 443 | `0.0.0.0/0` | Public Secure Web Traffic |
| HTTP | TCP | 80 | `0.0.0.0/0` | HTTP traffic (redirected to HTTPS) & ACME SSL validation |
| SSH | TCP | 22 | `<your-office-or-home-ip>/32` | Restrict administrative SSH access to your specific IP |

> [!CAUTION]
> **Database Security Rule:** Port 5432 (PostgreSQL) and Port 8080 (internal Spring Boot) must **NEVER** be opened in the inbound Security Group. They communicate strictly over the internal Docker network.

---

## 5. Step 4: Amazon EC2 Server Provisioning & Hardening

1. **Launch EC2 Instance:**
   - AMI: Ubuntu 24.04 LTS or 22.04 LTS (x86_64)
   - Instance Type: `t3.medium` (2 vCPU, 4 GB RAM recommended for Java 21 + PostgreSQL)
   - Storage: 30 GB gp3 SSD
   - Security Group: Attach `medicore-sg`
   - IAM Role: Attach `MediCore-EC2-Role`

2. **Connect via SSH:**
   ```bash
   ssh -i medicore-key.pem ubuntu@<ec2-public-ip>
   ```

3. **Install Docker & Docker Compose Engine:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install prerequisites
   sudo apt install -y ca-certificates curl gnupg lsb-release

   # Add Docker official GPG key
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg

   # Set up repository
   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

   # Install Docker packages
   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

   # Allow ubuntu user to execute docker without sudo
   sudo usermod -aG docker ubuntu
   newgrp docker

   # Install AWS CLI v2
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   sudo apt install -y unzip
   unzip awscliv2.zip
   sudo ./aws/install
   ```

4. **Verify Docker and AWS installation:**
   ```bash
   docker --version
   docker compose version
   aws --version
   ```

---

## 6. Step 5: HTTPS / SSL Setup with Let's Encrypt

If you have a domain pointing to your EC2 Public IP:

```bash
# Install Certbot
sudo apt install -y certbot

# Obtain SSL Certificate
sudo certbot certonly --standalone -d medicore.yourdomain.com

# Certificates will be stored in /etc/letsencrypt/live/medicore.yourdomain.com/
```

Mount `/etc/letsencrypt` into the frontend container as configured in `docker-compose.prod.yml`.

---

## 7. Step 6: GitHub Repository Secrets Configuration

In your GitHub repository under **Settings &rarr; Secrets and variables &rarr; Actions**, configure the following production secrets:

| Secret Name | Example Value | Description |
|-------------|---------------|-------------|
| `AWS_ACCESS_KEY_ID` | `AKIAIOSFODNN7EXAMPLE` | CI/CD Deployment AWS Access Key |
| `AWS_SECRET_ACCESS_KEY` | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | CI/CD Deployment AWS Secret Key |
| `AWS_REGION` | `ap-south-1` | Target AWS Region |
| `ECR_REGISTRY` | `123456789012.dkr.ecr.ap-south-1.amazonaws.com` | ECR Registry URI |
| `EC2_HOST` | `13.232.xxx.xxx` | Public IP or DNS of EC2 instance |
| `EC2_USER` | `ubuntu` | SSH user |
| `EC2_SSH_KEY` | `-----BEGIN RSA PRIVATE KEY-----...` | Private key for EC2 deployment |
| `POSTGRES_PASSWORD` | `MediCoreStrongProdPassword2026!` | Production DB password |
| `JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | 256-bit JWT encryption secret |

---

## 8. Step 7: Application Monitoring & AWS CloudWatch

1. **Install CloudWatch Agent:**
   ```bash
   wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
   sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
   ```

2. **Configure CloudWatch to stream Docker container logs:**
   Create `/opt/aws/amazon-cloudwatch-agent/bin/config.json`:
   ```json
   {
     "logs": {
       "logs_collected": {
         "files": {
           "collect_list": [
             {
               "file_path": "/var/lib/docker/containers/*/*-json.log",
               "log_group_name": "MediCore-Docker-Containers",
               "log_stream_name": "{instance_id}"
             }
           ]
         }
       }
     }
   }
   ```

3. **Start Agent:**
   ```bash
   sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
       -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json
   ```

---

## 9. Verification & Rollback Testing

### Health Check Verification
```bash
# 1. Verify running containers
docker ps

# 2. Check Spring Boot Actuator
curl -f http://localhost:8080/actuator/health

# 3. Check Nginx Frontend
curl -f http://localhost:80/
```

### Manual Rollback Execution
If any issue occurs after a deployment:
```bash
cd ~/medicore-app
bash ./scripts/rollback.sh
```
This script automatically restores the previously verified Docker image tag from `previous_version.txt` and restarts the services.

