#!/usr/bin/env bash
# ==============================================================================
# ZyperGo AWS EC2 Automated Deployment Script (Ubuntu / Debian / Amazon Linux)
# ==============================================================================

set -e

echo "=========================================="
echo " Starting ZyperGo Deployment on AWS EC2   "
echo "=========================================="

# 1. Update system packages
echo "[1/6] Updating system packages..."
if [ -x "$(command -v apt-get)" ]; then
    sudo apt-get update -y
    sudo apt-get install -y curl git nginx build-essential
elif [ -x "$(command -v dnf)" ]; then
    sudo dnf update -y
    sudo dnf install -y curl git nginx gcc-c++ make
fi

# 2. Install Node.js (v20 LTS) if not installed
if ! [ -x "$(command -v node)" ]; then
    echo "[2/6] Installing Node.js v20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "[2/6] Node.js is already installed ($(node -v))."
fi

# 3. Install PM2 globally if not installed
if ! [ -x "$(command -v pm2)" ]; then
    echo "[3/7] Installing PM2 process manager..."
    sudo npm install -g pm2
fi

# 4. Install MongoDB Community Edition (Self-Hosted on AWS EC2)
if ! [ -x "$(command -v mongod)" ]; then
    echo "[4/7] Installing MongoDB on AWS EC2..."
    if [ -x "$(command -v apt-get)" ]; then
        sudo apt-get install -y gnupg curl
        curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
        echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        sudo apt-get update -y
        sudo apt-get install -y mongodb-org
        sudo systemctl start mongod
        sudo systemctl enable mongod
    fi
else
    echo "[4/7] MongoDB is already installed ($(mongod --version | head -n 1))."
fi

# 5. Install dependencies and build client
echo "[5/7] Installing backend and frontend dependencies..."
sudo mkdir -p server/uploads
cd server && npm install --production=false && cd ..
cd client && npm install && npm run build && cd ..

# 6. Configure Nginx
echo "[6/7] Configuring Nginx reverse proxy..."
sudo mkdir -p /var/log/nginx
if [ -f "nginx.conf" ]; then
    # Create web root and copy build
    sudo mkdir -p /var/www/zypergo/client
    sudo cp -r client/dist /var/www/zypergo/client/

    if [ -d "/etc/nginx/sites-available" ]; then
        sudo cp nginx.conf /etc/nginx/sites-available/zypergo
        sudo ln -sf /etc/nginx/sites-available/zypergo /etc/nginx/sites-enabled/default
    else
        sudo cp nginx.conf /etc/nginx/conf.d/zypergo.conf
    fi

    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
fi

# 6. Start / Restart PM2 backend process
echo "[6/6] Launching backend server with PM2..."
mkdir -p logs
pm2 start ecosystem.config.js --env production || pm2 restart zypergo-api --env production
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME || true

echo "=========================================="
echo " Deployment Complete!                     "
echo " Access your website at: http://$(curl -s http://checkip.amazonaws.com || echo 'YOUR_EC2_PUBLIC_IP')"
echo "=========================================="
