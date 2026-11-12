# VeriTrust Free Deployment Guide

This guide provides simple, step-by-step instructions to deploy **VeriTrust** for **100% free** on **GitHub**, **Vercel**, **Netlify**, and **Render**.

---

## 🚀 Step 1: Push Project to GitHub

Initialize git and push this repository to your GitHub account:

```bash
# 1. Initialize git in the project root
git init

# 2. Add all files to staging
git add .

# 3. Create initial commit
git commit -m "Initial commit: VeriTrust Cognitive Shield platform"

# 4. Set default branch to main
git branch -M main

# 5. Link your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# 6. Push to GitHub
git push -u origin main
```

---

## 🌐 Option 1: Deploy Everything Free on Render (Recommended)

Render offers free web services and static hosting for both FastAPI and React.

### Method A: Automated 1-Click Blueprint (Easiest)
1. Sign up for free at [render.com](https://render.com).
2. Click **New +** $\rightarrow$ **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect [`render.yaml`](file:///c:/Users/ADMIN/Desktop/Verti/render.yaml) and configure:
   - `veritrust-backend` (FastAPI Python 3.11 service)
   - `veritrust-frontend` (React Vite static site with SPA routing)
5. Click **Apply**. Both services will build and go live with free HTTPS URLs!

### Method B: Manual Free Web Service Setup on Render

#### Deploying Backend on Render:
1. Go to **Dashboard** $\rightarrow$ **New +** $\rightarrow$ **Web Service**.
2. Select your repository.
3. Configure settings:
   - **Name**: `veritrust-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt && python backend/seed.py`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir backend`
   - **Instance Type**: `Free`
4. Add Environment Variables:
   - `SECRET_KEY`: (any random 32-character string)
   - `DATABASE_URL`: `sqlite:///./veritrust.db`
   - `CORS_ORIGINS`: `*`
5. Click **Create Web Service**. Your backend will be live at `https://veritrust-backend.onrender.com`.

---

## ⚡ Option 2: Deploy Frontend on Vercel (100% Free & Blazing Fast)

1. Sign up for free at [vercel.com](https://vercel.com).
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your GitHub repository.
4. In project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://veritrust-backend.onrender.com/api`)
6. Click **Deploy**. Vercel will deploy the application globally on edge CDN in ~45 seconds.

---

## 📄 Option 3: Deploy Frontend to GitHub Pages (100% Free)

This repository includes a pre-configured GitHub Actions workflow at [`.github/workflows/deploy-gh-pages.yml`](file:///c:/Users/ADMIN/Desktop/Verti/.github/workflows/deploy-gh-pages.yml).

1. Go to your repository on GitHub.
2. Click **Settings** $\rightarrow$ **Pages** (in the left sidebar).
3. Under **Build and deployment** $\rightarrow$ **Source**, select **GitHub Actions**.
4. Push any commit to `main`, or trigger the workflow manually under the **Actions** tab.
5. GitHub will build and host your frontend for free at `https://<YOUR_USERNAME>.github.io/<YOUR_REPO_NAME>/`.

---

## 🐳 Option 4: Local or VPS Deployment with Docker

To run the complete production stack (PostgreSQL, Backend, Frontend) anywhere with Docker:

```bash
# Build and run all services in background
docker-compose up -d --build

# View container logs
docker-compose logs -f
```

---

## 🔑 Default Seed Accounts & Testing

Once deployed, you can immediately log in or test self-registration and Google SSO:

| Account Type | Email / Username | Password |
|---|---|---|
| **SecOps Admin** | `admin@veritrust.io` | `Admin@123456` |
| **Threat Analyst** | `analyst@veritrust.io` | `Analyst@123456` |
| **Self-Registration** | Any email & password | Any password $\ge 6$ chars |
| **Google SSO** | Click **Continue with Google** | One-click auto-provisioning |

