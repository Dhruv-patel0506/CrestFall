# AWS Free Tier Setup for Crestfall Backend

## Important: Free Tier Limitations

### What's FREE (12 months):
- ✅ EC2 t2.micro (1 vCPU, 1 GB RAM)
- ✅ 30 GB EBS storage
- ✅ 750 hours/month Load Balancer
- ✅ Data transfer (up to 100 GB/month)

### What's NOT Free:
- ❌ EFS (Elastic File System) - would cost ~$3/month
- ❌ More than 1 GB RAM
- ❌ Better CPU instances

### Performance Warning
⚠️ **Your backend typically needs 2GB+ RAM for processing**
⚠️ **Free tier only provides 1GB RAM**
⚠️ **It may work but could be slow with large datasets**

## Option 1: EC2 Free Tier (Recommended for Free)

### Step 1: Create EC2 Instance

#### 1.1 Go to EC2 Console
1. Log in to AWS Console
2. Search for "EC2"
3. Click "Launch Instance"

#### 1.2 Configure Instance
- **Name:** crestfall-backend
- **AMI:** Ubuntu 22.04 LTS
- **Instance Type:** t2.micro (Free tier eligible)
  - 1 vCPU
  - 1 GB RAM
- **Key Pair:** Create new or use existing
  - Download the `.pem` file (keep it safe!)
- **Network Settings:**
  - VPC: Default
  - Security Group: Create new
  - Allow: SSH (port 22), HTTP (port 8000)
- **Storage:**
  - 30 GB GP3 (Free tier eligible)
- Click "Launch Instance"

### Step 2: Configure Security Group
1. Go to EC2 → Security Groups
2. Find your security group
3. Inbound Rules:
   - SSH (port 22) from your IP
   - Custom TCP (port 8000) from anywhere (0.0.0.0/0)

### Step 3: Connect to EC2
```bash
# On Windows (PowerShell)
ssh -i path/to/your-key.pem ubuntu@<public-ip>

# On Mac/Linux
chmod 400 path/to/your-key.pem
ssh -i path/to/your-key.pem ubuntu@<public-ip>
```

### Step 4: Install Docker
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install -y docker-compose

# Enable Docker
sudo systemctl enable docker
sudo systemctl start docker

# Log out and back in
exit
```

### Step 5: Create Swap Space (For Low RAM)
Since free tier only has 1GB RAM, add swap:
```bash
# Reconnect to instance
ssh -i path/to/your-key.pem ubuntu@<public-ip>

# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Adjust swappiness
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### Step 6: Clone Repository
```bash
cd /opt
sudo git clone https://github.com/Dhruv-patel0506/CrestFall.git
cd CrestFall/scenario_intelligence_engine
```

### Step 7: Upload Data Files

### Option A: Upload via SCP
```bash
# On your local machine
scp -i path/to/your-key.pem -r D:/Rocast/scenario_intelligence_engine/new_data ubuntu@<public-ip>:/opt/CrestFall/scenario_intelligence_engine/
```

### Option B: Upload via AWS Console
1. Go to EC2 dashboard
2. Click your instance
3. Click "Connect" → "EC2 Instance Connect"
4. Use the file upload in the browser terminal

### Step 8: Deploy with Docker Compose
```bash
# Build and start
sudo docker-compose up -d --build

# Check logs
sudo docker-compose logs -f

# Check status
sudo docker-compose ps
```

### Step 9: Add Elastic IP (Static IP)
1. Go to EC2 → Elastic IPs
2. Click "Allocate Elastic IP address"
3. Click "Associate"
4. Select your instance
5. Now you have a static IP (free while attached to running instance)

### Step 10: Test Backend
```bash
# From your local machine
curl http://<elastic-ip>:8000/api/health
```

### Step 11: Update Frontend
```bash
# On your local machine
cd scenario_intelligence_engine/frontend
# Edit .env.production
# Change VITE_API_BASE to: http://<elastic-ip>:8000/api
git add .env.production
git commit -m "Update API base URL to AWS Free Tier"
git push
```

## Option 2: Lightsail Free Trial (3 months only)

Lightsail offers a 3-month free trial on certain plans:
- 512 MB RAM, 1 vCPU, 20 GB SSD - FREE for 3 months
- After 3 months: $5/month

**Not recommended** because:
- Only 512 MB RAM (even less than EC2)
- Only 3 months free
- Then you have to pay

## Performance Expectations

### With Free Tier (1 GB RAM + 2 GB Swap):
- ⚠️ Initial load may be slow (30-60 seconds)
- ⚠️ Large forecasts may take longer
- ⚠️ Multiple concurrent users may struggle
- ✅ Should work for single user
- ✅ Dataset loading will be slow but possible

### If Performance is Too Slow:
- Upgrade to t2.small (2 GB RAM) - ~$15/month
- Or use Render (~$7/month) - better value

## Costs After Free Tier (12 months)

After 12 months, if you stay on same instance:
- EC2 t2.micro: ~$10/month
- EBS (30 GB): ~$2.50/month
- Elastic IP: Free (while attached)
- Total: ~$12.50/month

## Monitoring Free Tier Usage

1. Go to AWS Billing Dashboard
2. Check "Free Tier" section
3. Monitor usage to stay within limits

## Backup Strategy

Since you're using EBS (not EFS), data is on the instance disk:

### Automated Backups
```bash
# On EC2 instance
# Create backup script
sudo nano /opt/backup.sh
```

Add this content:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf /opt/backup-$DATE.tar.gz /opt/CrestFall/scenario_intelligence_engine/new_data/
# Keep only last 7 days
find /opt/backup-*.tar.gz -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /opt/backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /opt/backup.sh
```

### Snapshot EBS Volume
1. Go to EC2 → Volumes
2. Select your volume
3. Click "Actions" → "Create Snapshot"
4. Free to create snapshots (cost is for storage)
5. Keep important snapshots

## Troubleshooting

### If Docker build fails (Out of Memory):
```bash
# Increase swap temporarily
sudo swapoff /swapfile
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### If instance is too slow:
- Consider upgrading to t2.small (2 GB RAM, ~$15/month)
- Or use Render (~$7/month) - better value for money

### If you need EFS (network storage):
- EFS costs ~$3/month
- Not included in free tier
- Not necessary if you use EBS storage

## Summary

**Pros of Free Tier:**
- ✅ Completely free for 12 months
- ✅ 30 GB storage included
- ✅ Good for testing
- ✅ Can upgrade later

**Cons of Free Tier:**
- ❌ Only 1 GB RAM (may be slow)
- ❌ Performance limitations
- ❌ After 12 months, costs ~$12.50/month

**My Honest Recommendation:**
If you want free: Use this EC2 free tier setup
If you want good performance: Use Render (~$7/month) - better value

The free tier will work but expect slower performance due to 1GB RAM limitation.
