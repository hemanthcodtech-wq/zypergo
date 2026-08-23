# ZyperGo — AWS EC2 Production Deployment Guide (No Domain Required)

This guide walks you through deploying the complete ZyperGo production stack on an **AWS EC2 instance** without requiring a custom domain (accessible directly via EC2 Public IPv4).

---

## 🌟 Architecture Overview

```
                          Internet / Browser
                                  │
                                  ▼
                   ┌─────────────────────────────┐
                   │   AWS EC2 Public IP: 80     │
                   │           (Nginx)           │
                   └──────────────┬──────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
       Static Requests (/)              API Requests (/api)
     ┌──────────────────────┐        ┌───────────────────────┐
     │  React SPA (dist)    │        │  Node.js Backend      │
     │  - Public Portal     │        │  (Port 5000 via PM2)  │
     │  - Admin Dashboard   │        └───────────┬───────────┘
     │  - Hub Management    │                    │
     │  - Rider App         │                    ▼
     │  - Customer Portal   │           MongoDB Atlas / DB
     └──────────────────────┘
```

---

## 1. AWS EC2 Security Group Setup

When creating or modifying your AWS EC2 Security Group, ensure the following inbound rules are open:

| Type | Protocol | Port Range | Source | Purpose |
|------|----------|------------|--------|---------|
| **HTTP** | TCP | `80` | `0.0.0.0/0` | Web Traffic (Nginx) |
| **HTTPS** | TCP | `443` | `0.0.0.0/0` | SSL Traffic (when domain is added) |
| **SSH** | TCP | `22` | `My IP` or `0.0.0.0/0` | Remote Terminal Access |
| **Custom TCP** (Optional) | TCP | `5000` | `0.0.0.0/0` | Direct backend access / testing |

---

## 2. Server Environment Variables Setup

On your EC2 instance, navigate to the `server/` directory and create/edit `.env`:

```bash
cd /var/www/zypergo/server  # or your clone directory
nano .env
```

Paste your production environment variables:

```env
NODE_ENV=production
PORT=5000

# MongoDB Database Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/zypergo

# Security Secret Key
JWT_SECRET=your_super_secret_64_character_hex_key_here

# Frontend Application URL (Set this to your EC2 Public IP)
FRONTEND_URL=http://<YOUR_EC2_PUBLIC_IP>

# Cloudinary Storage (for KYC, signature, and parcel images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP Email Configuration (Real Email Delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM="ZyperGo Logistics" <your_email@gmail.com>
SUPPORT_EMAIL=support@zypergo.com

# Google Authentication
GOOGLE_CLIENT_ID=your_google_client_id_here
```

> **Gmail SMTP Note**: If using Gmail, make sure to generate an **App Password** from Google Account Security (requires 2-Step Verification enabled).

---

## 3. Frontend Environment Setup

Navigate to `client/` and create `.env`:

```bash
cd /var/www/zypergo/client
nano .env
```

```env
# With Nginx reverse proxy, relative path '/api' automatically routes to the backend
VITE_API_URL=/api
VITE_GOOGLE_CLIENT_ID="your_google_client_id_here"
```

---

## 4. One-Click Automated Deployment Script

You can execute the included `deploy-ec2.sh` script to set up everything automatically:

```bash
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### Or Manual Step-by-Step Deployment:

#### Step 4.1: Install Node.js, PM2, and Nginx
```bash
# Update Ubuntu/Debian
sudo apt update -y && sudo apt upgrade -y
sudo apt install -y curl git nginx build-essential

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 Process Manager
sudo npm install -g pm2
```

#### Step 4.2: Build the Frontend & Backend
```bash
# Install backend dependencies
cd server
npm install --production=false
cd ..

# Install client dependencies & build static bundle
cd client
npm install
npm run build
cd ..
```

#### Step 4.3: Start the Backend with PM2
```bash
# Start backend server with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 state for automatic reboot persistence
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

#### Step 4.4: Configure Nginx Reverse Proxy
```bash
# Copy client build to web root
sudo mkdir -p /var/www/zypergo/client
sudo cp -r client/dist /var/www/zypergo/client/

# Configure Nginx site
sudo cp nginx.conf /etc/nginx/sites-available/zypergo
sudo ln -sf /etc/nginx/sites-available/zypergo /etc/nginx/sites-enabled/default

# Test Nginx configuration and reload
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 5. Seed SuperAdmin Account (First Time Only)

Run the admin seed script to create your administrative login:

```bash
cd server
npm run seed:admin
# Default Login:
# Email: admin@zypergo.com  (or custom configured in env)
# Password: AdminPassword123!
```

---

## 6. Accessing Portals on EC2 (Without Domain)

Because IP addresses do not support DNS subdomains, ZyperGo has built-in smart routing:

| Portal | URL on EC2 IP | Description |
|--------|---------------|-------------|
| **Public Website / Portal** | `http://<EC2-IP>/` | Landing page, booking, tracking, rate calculator |
| **Admin Dashboard** | `http://<EC2-IP>/?portal=admin` or `/admin` | SuperAdmin management, live map, dispatch, KYC |
| **Hub Operator Portal** | `http://<EC2-IP>/?portal=hub` or `/hub` | Bag scanning, manifest generation, inbound/outbound |
| **Rider Portal** | `http://<EC2-IP>/?portal=rider` or `/rider` | Driver deliveries, pickup OTP verification, earnings |
| **Customer Dashboard** | `http://<EC2-IP>/?portal=customer` or `/customer` | Personal shipments, address book, invoices |
| **Hauler / Partner** | `http://<EC2-IP>/?portal=partner` or `/partner` | Fleet tracking & linehaul transfers |

> **Role Selector**: Clicking any role card on `http://<EC2-IP>/login` will automatically switch and route to that portal seamlessly!

---

## 7. Useful PM2 and Server Commands

```bash
# View backend logs in real-time
pm2 logs zypergo-api

# View server status
pm2 status

# Restart backend after updating .env
pm2 restart zypergo-api --update-env

# Rebuild frontend after code changes
cd client && npm run build
sudo cp -r dist/* /var/www/zypergo/client/dist/
sudo systemctl reload nginx
```

---

## 8. Adding a Custom Domain Later (Optional)

When you are ready to point your custom domain (e.g. `zypergo.com`) to your EC2 instance:
1. In your DNS provider (e.g. Cloudflare, Route53, GoDaddy), point `A` records (`@` and `*` wildcard) to your EC2 Public IP.
2. Update `server/.env`: `FRONTEND_URL=https://zypergo.com`.
3. Run `sudo certbot --nginx -d zypergo.com -d *.zypergo.com` for free automatic SSL certificates.
