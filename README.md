# Batches App — Deployment Guide

**Live at:** http://srv971260.hstgr.cloud  
**VPS IP:** 31.97.237.150

---

## First-Time Setup (do this once)

### Step 1 — Local setup
```bash
npm install
npm run dev       # preview locally at http://localhost:5173
```

### Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/batches-app.git
git push -u origin main
```

### Step 3 — Add GitHub Secrets
Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these 3 secrets:

| Secret Name   | Value                          |
|---------------|--------------------------------|
| `VPS_HOST`    | `31.97.237.150`                |
| `VPS_USER`    | `root`                         |
| `VPS_SSH_KEY` | Your VPS private SSH key (see below) |

#### How to get your SSH private key:
```bash
# On your LOCAL machine, generate a key pair (if you don't have one):
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/hostinger_deploy

# Copy the PUBLIC key to your VPS:
ssh-copy-id -i ~/.ssh/hostinger_deploy.pub root@31.97.237.150

# Then paste the PRIVATE key content (~/.ssh/hostinger_deploy) into VPS_SSH_KEY secret
cat ~/.ssh/hostinger_deploy
```

### Step 4 — One-time VPS setup
```bash
# SSH into your VPS
ssh root@31.97.237.150

# Then run:
bash /tmp/setup-vps.sh
```

> Or manually:
> ```bash
> apt update && apt install nginx -y
> mkdir -p /var/www/batches-app
> systemctl enable nginx && systemctl start nginx
> ```

---

## Ongoing Deploys (automatic)

After the first setup, every `git push` to `main` will:
1. Build the React app
2. Upload `dist/` to `/var/www/batches-app/` on your VPS
3. Reload Nginx

That's it — your site updates automatically!

---

## Local Development
```bash
npm run dev      # start dev server
npm run build    # build for production
npm run preview  # preview production build
```

---

## File Structure
```
batches-app/
├── src/
│   ├── App.jsx          # main dashboard component
│   ├── App.css          # all styles
│   └── main.jsx         # React entry point
├── nginx/
│   └── batches-app.conf # Nginx server config
├── scripts/
│   └── setup-vps.sh     # one-time VPS setup script
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions auto-deploy
├── index.html
├── package.json
└── vite.config.js
```
