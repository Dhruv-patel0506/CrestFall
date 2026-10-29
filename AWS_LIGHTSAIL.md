# AWS Lightsail Setup for Crestfall (Simplest AWS Option)

## Why Lightsail?
- Simple VM with fixed pricing
- No complex VPC/EFS setup needed
- Includes static IP
- Easy to manage
- ~$20/month for 2GB RAM, 60GB SSD

## Step 1: Create Lightsail Instance

### 1.1 Go to Lightsail Console
1. Log in to AWS Console
2. Search for "Lightsail"
3. Click "Create instance"

### 1.2 Configure Instance
- **Name:** crestfall-backend
- **Region:** Oregon (or closest to you)
- **OS:** Ubuntu 22.04 LTS
- **Blueprint:** OS Only (Ubuntu 22.04 LTS)
- **Instance plan:** $20/month
  - 2 GB RAM
  - 2 vCPU
  - 60 GB SSD
- **Capacity:** 1 instance

### 1.3 Networking
- **Networking:** Create new SSH key pair
  - Download the `.pem` file
  - Keep it safe!

### 1.4 Launch
Click "Create instance" and wait 2-3 minutes

## Step 2: Connect to Instance

### 2.1 Get Public IP
From Lightsail dashboard, copy the **Public IP address**

### 2.2 Connect via SSH
```bash
# On Windows (PowerShell)
ssh -i path/to/your-key.pem ubuntu@<public-ip>

# On Mac/Linux
chmod 400 path/to/your-key.pem
ssh -i path/to/your-key.pem ubuntu@<public-ip>
```

## Step 3: Install Docker

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

# Log out and back in for group changes to take effect
exit
```

## Step 4: Clone Repository

```bash
# Reconnect to instance
ssh -i path/to/your-key.pem ubuntu@<public-ip>

# Clone repository
cd /opt
sudo git clone https://github.com/Dhruv-patel0506/CrestFall.git
cd CrestFall/scenario_intelligence_engine
```

## Step 5: Upload Data Files

### Option A: Upload via SCP
```bash
# On your local machine
scp -i path/to/your-key.pem -r D:/Rocast/scenario_intelligence_engine/new_data ubuntu@<public-ip>:/opt/CrestFall/scenario_intelligence_engine/
```

### Option B: Upload via Lightsail Browser
1. Go to Lightsail dashboard
2. Click your instance
3. Click "Connect using SSH" (browser-based)
4. Use the file upload feature

## Step 6: Deploy with Docker Compose

```bash
# Build and start
sudo docker-compose up -d --build

# Check logs
sudo docker-compose logs -f

# Check status
sudo docker-compose ps
```

## Step 7: Configure Firewall

### 7.1 Go to Networking
1. In Lightsail dashboard, click "Networking"
2. Click "Create static IP"
3. Name it: crestfall-ip
4. Attach to your instance

### 7.2 Add Firewall Rule
1. Click your instance
2. Go to "Networking" tab
3. Under "Firewall", click "Add rule"
4. **Protocol:** TCP
5. **Port:** 8000
6. **Source:** Anywhere (0.0.0.0/0)
7. Click "Create"

## Step 8: Test Backend

```bash
# From your local machine
curl http://<static-ip>:8000/api/health
```

Or in browser: `http://<static-ip>:8000/api/health`

## Step 9: Get Your URL

Your backend URL will be:
`http://<static-ip>:8000`

Example: `http://54.123.45.67:8000`

## Step 10: Update Frontend

```bash
# On your local machine
cd scenario_intelligence_engine/frontend
# Edit .env.production
# Change VITE_API_BASE to: http://<static-ip>:8000/api
git add .env.production
git commit -m "Update API base URL to AWS Lightsail"
git push
```

## Step 11: Optional - Add Domain and SSL

### Get a Domain
1. Buy a domain (e.g., from Route 53)
2. Create an A record pointing to your static IP

### Add SSL with Nginx
```bash
# On the Lightsail instance
sudo apt install -y nginx certbot python3-certbot-nginx

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/crestfall
```

Add this content:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/crestfall /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Costs
- **Lightsail Instance:** $20/month
- **Static IP:** $0.005/hour (~$3.60/month)
- **Total:** ~$24/month

## Monitoring

### Check Logs
```bash
# Docker logs
sudo docker-compose logs -f

# System logs
sudo journalctl -u docker -f
```

### Restart Service
```bash
cd /opt/CrestFall/scenario_intelligence_engine
sudo docker-compose restart
```

### Update Code
```bash
cd /opt/CrestFall
sudo git pull
cd scenario_intelligence_engine
sudo docker-compose up -d --build
```

## Backup

### Backup Data
```bash
# Create snapshot of instance from Lightsail dashboard
# Or manually backup data directory
sudo tar -czf /opt/backup-$(date +%Y%m%d).tar.gz new_data/
```

## Advantages of Lightsail
- Simple setup (no VPC/EFS complexity)
- Fixed pricing (no surprise bills)
- 60GB SSD included (enough for data)
- Static IP included
- Easy to manage

## Summary
1. Create Lightsail instance ($20/month)
2. Install Docker
3. Clone repository
4. Upload data files
5. Deploy with docker-compose
6. Open port 8000
7. Update frontend URL
8. Done!

This is the simplest AWS option and perfect for your use case.
