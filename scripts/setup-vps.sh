#!/bin/bash
# ============================================================
# setup-vps.sh — Run this ONCE on your Hostinger VPS
# Usage: bash setup-vps.sh
# ============================================================

set -e

echo ">>> Updating packages..."
apt update && apt upgrade -y

echo ">>> Installing Nginx..."
apt install nginx -y
systemctl enable nginx
systemctl start nginx

echo ">>> Creating app directory..."
mkdir -p /var/www/batches-app

echo ">>> Copying Nginx config..."
cp /tmp/batches-app.conf /etc/nginx/sites-available/batches-app
ln -sf /etc/nginx/sites-available/batches-app /etc/nginx/sites-enabled/batches-app

# Remove default nginx site if it exists
rm -f /etc/nginx/sites-enabled/default

echo ">>> Testing Nginx config..."
nginx -t

echo ">>> Reloading Nginx..."
systemctl reload nginx

echo ""
echo "✅ VPS setup complete!"
echo "   Now visit: http://srv971260.hstgr.cloud"
echo ""
echo "Next: Push your code to GitHub to trigger auto-deploy."
