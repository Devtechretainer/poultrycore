# 🚀 Render Deployment Guide

Complete guide to deploy your Next.js frontend application to Render.

---

## 📋 Prerequisites

- **Render account** - Sign up at https://render.com (free tier available)
- **GitHub/GitLab/Bitbucket repository** - Your code must be in a Git repository
- **Dockerfile** - Already configured in this project ✅

---

## 🚀 Quick Deployment Steps

### Step 1: Push Your Code to Git

Make sure all your changes are committed and pushed to your repository:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin win
```

### Step 2: Connect Repository to Render

1. **Log in to Render:**
   - Go to https://dashboard.render.com
   - Sign in or create an account

2. **Create New Web Service:**
   - Click **"New +"** button
   - Select **"Web Service"**

3. **Connect Repository:**
   - Connect your GitHub/GitLab/Bitbucket account
   - Select your repository: `inventory-login`
   - Select branch: `win`

### Step 3: Configure Service

Render will automatically detect the `render.yaml` file, but you can also configure manually:

**Basic Settings:**
- **Name:** `poultry-frontend` (or your preferred name)
- **Region:** `Oregon` (or closest to your users)
- **Branch:** `win`
- **Root Directory:** `frontend/FarmArchive`

**Build & Deploy:**
- **Runtime:** `Docker`
- **Dockerfile Path:** `frontend/FarmArchive/Dockerfile`
- **Docker Context:** `frontend/FarmArchive`

**Environment Variables:**
Add these in Render dashboard (or they'll be set from `render.yaml`):
```
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_BASE_URL=https://farmapi.poultrycore.com
NEXT_PUBLIC_ADMIN_API_URL=https://usermanagementapi.poultrycore.com
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PWA=false
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Build the Docker image
   - Deploy the container
   - Provide a URL (e.g., `https://poultry-frontend.onrender.com`)

---

## ⚙️ Using render.yaml (Recommended)

If you have `render.yaml` in your repository, Render will automatically use it:

1. **Create the service:**
   - Go to Render Dashboard
   - Click **"New +"** → **"Blueprint"**
   - Connect your repository
   - Render will detect `render.yaml` and create the service automatically

2. **Review and Deploy:**
   - Review the service configuration
   - Click **"Apply"**
   - Render will deploy automatically

---

## 🔧 Manual Configuration (Alternative)

If you prefer to configure manually without `render.yaml`:

### Service Settings:
- **Name:** `poultry-frontend`
- **Environment:** `Docker`
- **Region:** `Oregon` (or your preferred region)
- **Branch:** `win`
- **Root Directory:** `frontend/FarmArchive`

### Build Settings:
- **Dockerfile Path:** `Dockerfile`
- **Docker Context:** `.`

### Start Command:
- Leave empty (Dockerfile CMD will be used)

### Environment Variables:
Add these in the Render dashboard:
```
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_BASE_URL=https://farmapi.poultrycore.com
NEXT_PUBLIC_ADMIN_API_URL=https://usermanagementapi.poultrycore.com
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PWA=false
```

---

## 🌐 Custom Domain (Optional)

1. **In Render Dashboard:**
   - Go to your service
   - Click **"Settings"** → **"Custom Domains"**
   - Click **"Add Custom Domain"**
   - Enter your domain (e.g., `app.poultrycore.com`)

2. **DNS Configuration:**
   - Add a CNAME record pointing to your Render service
   - Render will provide the exact DNS settings

3. **SSL Certificate:**
   - Render automatically provisions SSL certificates via Let's Encrypt
   - HTTPS will be enabled automatically

---

## 🔍 Monitoring & Logs

### View Logs:
1. Go to your service in Render Dashboard
2. Click **"Logs"** tab
3. View real-time build and runtime logs

### Health Checks:
- Render automatically checks `https://your-app.onrender.com/`
- If health check fails, Render will restart the service

### Metrics:
- View CPU, Memory, and Network usage in the **"Metrics"** tab
- Monitor request rates and response times

---

## 🔄 Auto-Deploy

Render automatically deploys when you push to your branch:

1. **Push to Git:**
   ```bash
   git push origin win
   ```

2. **Render detects changes:**
   - Automatically starts a new build
   - Deploys when build succeeds

3. **Deployment Status:**
   - Check the **"Events"** tab in Render Dashboard
   - See build progress and deployment status

---

## 🐛 Troubleshooting

### Build Fails

**Issue:** Docker build fails

**Solutions:**
1. **Check logs:**
   - Go to Render Dashboard → Your Service → Logs
   - Look for error messages

2. **Common issues:**
   - Missing dependencies in `package.json`
   - Dockerfile syntax errors
   - Build timeout (increase in settings)

3. **Test locally:**
   ```bash
   docker build -t test-build .
   docker run -p 3000:3000 test-build
   ```

### Service Won't Start

**Issue:** Container starts but app doesn't respond

**Solutions:**
1. **Check environment variables:**
   - Ensure all required env vars are set
   - Verify API URLs are correct

2. **Check logs:**
   - View runtime logs in Render Dashboard
   - Look for application errors

3. **Verify PORT:**
   - Ensure app listens on `PORT` environment variable
   - Render sets `PORT` automatically

### Out of Memory

**Issue:** Service crashes due to memory limits

**Solutions:**
1. **Upgrade plan:**
   - Free tier: 512MB RAM
   - Starter: 512MB RAM
   - Standard: 2GB+ RAM

2. **Optimize build:**
   - Reduce dependencies
   - Use Next.js standalone output (already configured)

### Slow Builds

**Issue:** Builds take too long

**Solutions:**
1. **Use Docker layer caching:**
   - Already optimized in Dockerfile
   - Dependencies are cached separately

2. **Reduce build time:**
   - Remove unnecessary dependencies
   - Optimize Dockerfile

---

## 💰 Pricing

### Free Tier:
- ✅ 750 hours/month (enough for 24/7 single service)
- ✅ 512MB RAM
- ✅ Automatic SSL
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold starts take ~30 seconds

### Starter Plan ($7/month):
- ✅ Always on (no spin-down)
- ✅ 512MB RAM
- ✅ Automatic SSL
- ✅ Custom domains

### Standard Plan ($25/month):
- ✅ 2GB RAM
- ✅ Better performance
- ✅ Priority support

---

## 🔐 Environment Variables

### Required Variables:
```
NODE_ENV=production
PORT=3000
```

### API Configuration:
```
NEXT_PUBLIC_API_BASE_URL=https://farmapi.poultrycore.com
NEXT_PUBLIC_ADMIN_API_URL=https://usermanagementapi.poultrycore.com
```

### Optional Variables:
```
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PWA=false
```

### Adding Variables in Render:
1. Go to your service
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Enter key and value
5. Click **"Save Changes"**
6. Service will automatically redeploy

---

## 📊 Performance Optimization

### 1. Enable Caching:
- Next.js automatically caches static assets
- Render CDN caches static files

### 2. Optimize Images:
- Already configured: `images: { unoptimized: true }`
- Consider using Next.js Image Optimization for better performance

### 3. Reduce Bundle Size:
- Already using Next.js standalone output
- Tree-shaking enabled automatically

---

## 🔄 Update Deployment

### Automatic Updates:
- Push to your branch → Auto-deploy

### Manual Deploy:
1. Go to Render Dashboard
2. Click **"Manual Deploy"**
3. Select branch/commit
4. Click **"Deploy"**

### Rollback:
1. Go to **"Events"** tab
2. Find previous successful deployment
3. Click **"Redeploy"**

---

## 📝 Checklist

Before deploying:

- [ ] Code is pushed to Git repository
- [ ] `render.yaml` is in repository (or configure manually)
- [ ] Environment variables are set
- [ ] Dockerfile is correct
- [ ] `next.config.mjs` has `output: 'standalone'`
- [ ] API URLs are correct (production URLs)
- [ ] Test Docker build locally: `docker build -t test .`

After deploying:

- [ ] Service is running (check status)
- [ ] Health check passes
- [ ] Application loads in browser
- [ ] API connections work (check browser console)
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate is active

---

## 🆘 Support

### Render Support:
- **Documentation:** https://render.com/docs
- **Community:** https://community.render.com
- **Status:** https://status.render.com

### Common Commands:

**View logs:**
```bash
# In Render Dashboard → Logs tab
```

**Check service status:**
```bash
# In Render Dashboard → Service → Overview
```

**Test locally:**
```bash
cd frontend/FarmArchive
docker build -t poultry-frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://farmapi.poultrycore.com \
  -e NEXT_PUBLIC_ADMIN_API_URL=https://usermanagementapi.poultrycore.com \
  poultry-frontend
```

---

## ✅ Success!

Once deployed, your application will be available at:
- **Render URL:** `https://poultry-frontend.onrender.com`
- **Custom Domain:** `https://your-domain.com` (if configured)

**Next Steps:**
1. Test all features
2. Monitor logs for errors
3. Set up custom domain (optional)
4. Configure monitoring/alerts (optional)

---

**Happy Deploying! 🚀**

