# ZyperGo — AWS EC2 Self-Hosted MongoDB Setup Guide

This guide walks you through installing and securing **MongoDB Community Edition** directly on your **AWS EC2 server**, eliminating the need for MongoDB Atlas and external cloud fees.

---

## 1. Connect to Your AWS EC2 Server via SSH

Using your `zypergo.pem` key (located in your project root):

### On Windows PowerShell / Command Prompt:
```powershell
# Set read-only permission on the key file (if needed)
icacls "zypergo.pem" /inheritance:r
icacls "zypergo.pem" /grant:r "%USERNAME%:R"

# SSH into your EC2 instance (replace <YOUR_AWS_IP> with your EC2 Public IPv4)
ssh -i "zypergo.pem" ubuntu@<YOUR_AWS_IP>
```
*(If using Amazon Linux instead of Ubuntu, use `ec2-user@<YOUR_AWS_IP>`)*

---

## 2. Install MongoDB 7.0 on Ubuntu EC2

Once logged into your AWS server, run the following commands:

```bash
# 1. Update package list and install prerequisites
sudo apt-get update -y
sudo apt-get install -y gnupg curl

# 2. Import MongoDB GPG public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes

# 3. Add MongoDB repository for Ubuntu
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 4. Install MongoDB packages
sudo apt-get update -y
sudo apt-get install -y mongodb-org

# 5. Start and enable MongoDB on server boot
sudo systemctl start mongod
sudo systemctl enable mongod

# 6. Verify MongoDB is running
sudo systemctl status mongod
```

---

## 3. Create the Database & User

Enter the MongoDB shell:
```bash
mongosh
```

Inside `mongosh`, execute:

```javascript
// 1. Switch to the zypergo database
use zypergo

// 2. Create the database user (choose your own secure password)
db.createUser({
  user: "zypergo_admin",
  pwd: "ChooseYourSecurePassword123!",
  roles: [
    { role: "readWrite", db: "zypergo" },
    { role: "dbAdmin", db: "zypergo" }
  ]
})

// 3. Verify the user was created
show users

// 4. Exit the shell
exit
```

---

## 4. Enable Authentication Security

To protect your database with password authentication:

1. Open MongoDB config file:
```bash
sudo nano /etc/mongod.conf
```

2. Scroll down to `#security:` and change it to:
```yaml
security:
  authorization: enabled
```

3. *(Optional - Only if accessing MongoDB from an external machine)*:
Under `net:`, change `bindIp: 127.0.0.1` to `bindIp: 0.0.0.0` and open port `27017` in your AWS EC2 Security Group.
*(If your Node.js backend runs on the same AWS EC2 instance, leave `bindIp: 127.0.0.1` as it is for maximum security!)*

4. Restart MongoDB:
```bash
sudo systemctl restart mongod
```

---

## 5. Your New AWS MongoDB Connection String

Once created, your connection string format will be:

### If Backend is on the SAME EC2 instance (Recommended):
```env
MONGODB_URI=mongodb://zypergo_admin:ChooseYourSecurePassword123!@127.0.0.1:27017/zypergo?authSource=zypergo
```

### If Backend connects remotely from another machine/IP:
```env
MONGODB_URI=mongodb://zypergo_admin:ChooseYourSecurePassword123!@<YOUR_EC2_PUBLIC_IP>:27017/zypergo?authSource=zypergo
```

---

## 6. Update `.env` with Your New Credentials

In `server/.env`:
```env
MONGODB_URI=mongodb://zypergo_admin:YOUR_PASSWORD@127.0.0.1:27017/zypergo?authSource=zypergo
```

Restart your backend server, and your entire stack will be running self-hosted on your AWS infrastructure!
