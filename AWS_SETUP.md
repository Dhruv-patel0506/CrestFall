# AWS App Runner Deployment Guide for Crestfall Backend

## Why AWS App Runner?
- Easy Docker deployment (similar to Render)
- Automatic SSL certificates
- Load balancing included
- Supports EFS for persistent storage
- ~$30-40/month for small instance with EFS

## Prerequisites
- AWS account (you have this ✓)
- AWS CLI installed (optional but recommended)
- GitHub repository connected to AWS

## Step 1: Create EFS File System (For Data Storage)

### 1.1 Go to EFS Console
1. Log in to AWS Console
2. Search for "EFS" (Elastic File System)
3. Click "Create file system"

### 1.2 Configure EFS
- **Name:** crestfall-data
- **Network:**
  - VPC: Default
  - Availability zones: Select 1-2 zones
  - Security group: Create new or use default
- **Access point:** Create access point
  - Name: crestfall-access
  - Root directory path: /data
- **Tags:** Add if desired
- Click "Create"

### 1.3 Note the Mount Target
After creation, note the:
- File system ID (e.g., `fs-12345678`)
- Access point ID (e.g., `fsap-12345678`)

## Step 2: Create App Runner Service

### 2.1 Go to App Runner Console
1. Search for "App Runner" in AWS Console
2. Click "Create service"

### 2.2 Source Settings
- **Repository type:** GitHub
- **Repository:** Dhruv-patel0506/CrestFall
- **Branch:** main
- **Deployment settings:** Automatic

### 2.3 Build Settings
- **Runtime:** Docker
- **Dockerfile path:** `scenario_intelligence_engine/Dockerfile`
- **Docker context:** `scenario_intelligence_engine/`

### 2.4 Service Settings
- **Service name:** crestfall-backend
- **Port:** 8000

### 2.5 Security
- **IAM role:** Create new service role
- **Add permissions for EFS:**
  - ElasticFileSystem:Client:*
  - ElasticFileSystem:MountTarget:*

### 2.6 Environment Variables
Add these environment variables:
- `PORT`: `8000`
- `AWS_EFS_MOUNT_PATH`: `/data`

### 2.7 Instance Configuration
- **CPU:** 1 vCPU
- **Memory:** 2 GB
- **Cost:** ~$36/month

### 2.8 Networking
- **VPC:** Default
- **Security group:** Allow port 8000 inbound

### 2.9 Review and Create
1. Review all settings
2. Click "Create service"
3. Wait for deployment (5-10 minutes)

## Step 3: Mount EFS to App Runner

This is a bit tricky with App Runner. Alternative approach:

### Alternative: Use EC2 + EFS (More Control)

Since App Runner doesn't easily support EFS mounting, let's use EC2 instead.

## EC2 + EFS Setup (Recommended)

### Step 1: Create EC2 Instance
1. Go to EC2 Console
2. Click "Launch Instance"
3. **Name:** crestfall-backend
4. **AMI:** Ubuntu 22.04 LTS
5. **Instance type:** t3.medium (2 vCPU, 4 GB RAM) - ~$30/month
6. **Key pair:** Create or use existing
7. **Network settings:**
   - VPC: Default
   - Security group: Allow SSH (22) and HTTP (8000)
8. **Storage:** 20 GB GP3
9. Click "Launch Instance"

### Step 2: Connect to EC2
```bash
ssh -i your-key.pem ubuntu@<your-ec2-public-ip>
```

### Step 3: Install Docker
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
sudo systemctl start docker
sudo systemctl enable docker
```

### Step 4: Mount EFS
```bash
# Install EFS client
sudo apt install -y amazon-efs-utils

# Create mount point
sudo mkdir -p /mnt/efs/data

# Mount EFS (replace with your file system ID)
sudo mount -t efs fs-12345678:/ /mnt/efs/data

# Add to fstab for auto-mount
echo "fs-12345678:/ /mnt/efs/data efs defaults,_netdev 0 0" | sudo tee -a /etc/fstab
```

### Step 5: Clone and Deploy
```bash
# Clone repository
cd /opt
sudo git clone https://github.com/Dhruv-patel0506/CrestFall.git
cd CrestFall/scenario_intelligence_engine

# Build and run
sudo docker build -t crestfall .
sudo docker run -d \
  --name crestfall \
  -p 8000:8000 \
  -v /mnt/efs/data:/app/new_data \
  --restart unless-stopped \
  crestfall
```

### Step 6: Set Up Load Balancer (Optional)
For HTTPS and better availability:
1. Go to Application Load Balancer
2. Create target group (port 8000)
3. Register EC2 instance
4. Create listener (HTTP 80 → redirect to HTTPS 443)
5. Add HTTPS listener with ACM certificate

### Step 7: Get Public URL
- Use Load Balancer URL if configured
- Or use EC2 public IP: `http://<ec2-ip>:8000`

## Step 8: Update Frontend
Update `.env.production` with your AWS URL and push to GitHub.

## Costs
- **EC2 t3.medium:** ~$30/month
- **EFS (20 GB):** ~$3/month
- **Load Balancer (optional):** ~$20/month
- **Total:** ~$33-53/month

## Alternative: AWS Lightsail (Simplest)
If EC2 is too complex, use AWS Lightsail:
1. Create Lightsail instance ($20/month, 2GB RAM, 60GB SSD)
2. Install Docker
3. Deploy with Docker Compose
4. Data stored on instance disk (no EFS needed)
5. Static IP: $0.005/hour

This is the simplest AWS option!

## Recommendations
1. **For simplicity:** AWS Lightsail (~$20/month)
2. **For scalability:** EC2 + EFS + Load Balancer (~$50/month)
3. **For ease of use:** Render (~$7/month) - if you don't mind using non-AWS

Which AWS option would you prefer?
