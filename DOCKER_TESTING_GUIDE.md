# 🐳 Docker Testing Guide

Complete guide to build, run, and test your Next.js frontend application using Docker.

---

## 📋 Prerequisites

- **Docker Desktop** installed and running (or Docker Engine on Linux)
- **Docker Compose** (included with Docker Desktop)
- Terminal/PowerShell access

**Verify Docker is running:**
```bash
docker --version
docker compose version
```

---

## 🚀 Quick Start

### Step 1: Navigate to Project Directory

```bash
cd frontend/FarmArchive
```

### Step 2: Build the Docker Image

```bash
# Using Docker Compose (recommended)
docker compose build

# OR using Docker directly
docker build -t poultry-frontend .
```

**Expected output:**
```
Building frontend...
Step 1/10 : FROM node:20-alpine AS deps
...
Successfully built [image-id]
Successfully tagged poultry-frontend:latest
```

---

### Step 3: Run the Container

```bash
# Using Docker Compose (recommended)
docker compose up -d

# OR using Docker directly
docker run -d \
  --name poultry-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://farmapi.poultrycore.com \
  -e NEXT_PUBLIC_ADMIN_API_URL=https://usermanagementapi.poultrycore.com \
  poultry-frontend
```

**The `-d` flag runs it in detached mode (background)**

---

### Step 4: Check Container Status

```bash
# Check if container is running
docker ps

# OR with Docker Compose
docker compose ps
```

**Expected output:**
```
CONTAINER ID   IMAGE                 STATUS          PORTS
abc123def456   poultry-frontend      Up 2 minutes    0.0.0.0:3000->3000/tcp
```

---

## 🧪 Testing the Application

### 1. Basic Health Check

**Check if the container is healthy:**
```bash
docker ps --filter "name=poultry-frontend" --format "table {{.Names}}\t{{.Status}}"
```

**Test the health endpoint:**
```bash
# Using curl
curl http://localhost:3000/api/health

# OR using PowerShell (Windows)
Invoke-WebRequest -Uri http://localhost:3000/api/health

# OR using wget
wget http://localhost:3000/api/health
```

### 2. Open in Browser

Open your web browser and navigate to:
- **Frontend:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health
- **Login Page:** http://localhost:3000/login
- **Dashboard:** http://localhost:3000/dashboard

### 3. Test API Connections

The frontend should connect to:
- **Main API:** `https://farmapi.poultrycore.com`
- **Admin API:** `https://usermanagementapi.poultrycore.com`

**Check browser console (F12)** for any connection errors.

---

## 📊 Viewing Logs

### Real-time Logs

```bash
# Using Docker Compose
docker compose logs -f frontend

# OR using Docker directly
docker logs -f poultry-frontend
```

**Press `Ctrl+C` to stop following logs**

### Last 100 Lines

```bash
docker logs --tail 100 poultry-frontend
```

### Search Logs for Errors

```bash
docker logs poultry-frontend 2>&1 | grep -i error
```

---

## 🔧 Common Testing Commands

### Stop the Container

```bash
# Using Docker Compose
docker compose down

# OR using Docker directly
docker stop poultry-frontend
docker rm poultry-frontend
```

### Restart the Container

```bash
# Using Docker Compose
docker compose restart

# OR using Docker directly
docker restart poultry-frontend
```

### Rebuild After Code Changes

```bash
# Stop existing container
docker compose down

# Rebuild with no cache (fresh build)
docker compose build --no-cache

# Start again
docker compose up -d
```

### Execute Commands Inside Container

```bash
# Open a shell inside the container
docker exec -it poultry-frontend sh

# Check Node.js version
docker exec poultry-frontend node --version

# Check environment variables
docker exec poultry-frontend env | grep NEXT_PUBLIC

# Check if files exist
docker exec poultry-frontend ls -la /app
```

---

## 🔍 Debugging

### Check Container Logs for Errors

```bash
# View all logs
docker logs poultry-frontend

# Filter for errors only
docker logs poultry-frontend 2>&1 | grep -i "error\|fail\|exception"
```

### Inspect Container Configuration

```bash
# View container details
docker inspect poultry-frontend

# View environment variables
docker inspect poultry-frontend | grep -A 20 "Env"

# View network configuration
docker inspect poultry-frontend | grep -A 10 "Networks"
```

### Check Port Binding

```bash
# Verify port is listening
# Windows PowerShell
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
# OR
netstat -tulpn | grep 3000
```

### Test Network Connectivity from Container

```bash
# Test if container can reach external APIs
docker exec poultry-frontend wget -O- https://farmapi.poultrycore.com/api/health

# OR with curl (if installed)
docker exec poultry-frontend curl https://farmapi.poultrycore.com/api/health
```

---

## 🧹 Clean Up

### Remove Container and Image

```bash
# Stop and remove container (keeps image)
docker compose down

# Remove container, image, and volumes
docker compose down -v --rmi all

# Remove all unused Docker resources
docker system prune -a
```

### Remove Specific Image

```bash
# List images
docker images

# Remove specific image
docker rmi poultry-frontend

# Force remove if container exists
docker rmi -f poultry-frontend
```

---

## ⚙️ Custom Configuration

### Use Custom Environment Variables

**Option 1: Create `.env.production` file**

Create `frontend/FarmArchive/.env.production`:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-custom-api.com
NEXT_PUBLIC_ADMIN_API_URL=https://your-custom-admin-api.com
NODE_ENV=production
PORT=3000
```

**Option 2: Pass via command line**

```bash
docker run -d \
  --name poultry-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://custom-api.com \
  -e NEXT_PUBLIC_ADMIN_API_URL=https://custom-admin.com \
  poultry-frontend
```

**Option 3: Use environment file**

```bash
docker run -d \
  --name poultry-frontend \
  -p 3000:3000 \
  --env-file .env.production \
  poultry-frontend
```

### Use Different Port

Edit `docker compose.yml`:
```yaml
ports:
  - "8080:3000"  # Maps host port 8080 to container port 3000
```

Or with Docker directly:
```bash
docker run -d -p 8080:3000 --name poultry-frontend poultry-frontend
```

---

## 🐛 Troubleshooting

### Issue: Container exits immediately

**Check logs:**
```bash
docker logs poultry-frontend
```

**Common causes:**
- Build failed - check Dockerfile
- Port already in use - change port mapping
- Missing environment variables

### Issue: Can't access localhost:3000

**Check if container is running:**
```bash
docker ps
```

**Check port binding:**
```bash
docker port poultry-frontend
```

**Try accessing via container IP:**
```bash
docker inspect poultry-frontend | grep IPAddress
```

### Issue: API connection errors

**Verify environment variables:**
```bash
docker exec poultry-frontend env | grep NEXT_PUBLIC
```

**Test from container:**
```bash
docker exec poultry-frontend wget -O- https://farmapi.poultrycore.com
```

**Check if APIs are accessible from your machine:**
```bash
curl https://farmapi.poultrycore.com/api/health
```

### Issue: Build fails

**Clear Docker cache and rebuild:**
```bash
docker compose build --no-cache --pull
```

**Check Dockerfile syntax:**
```bash
docker build -t test-build . 2>&1 | tee build.log
```

---

## 📝 Testing Checklist

- [ ] Docker Desktop is running
- [ ] Image builds successfully (`docker compose build`)
- [ ] Container starts without errors (`docker compose up -d`)
- [ ] Container is running (`docker ps`)
- [ ] Health endpoint responds (`curl http://localhost:3000/api/health`)
- [ ] Frontend loads in browser (`http://localhost:3000`)
- [ ] Login page loads (`http://localhost:3000/login`)
- [ ] API connections work (check browser console)
- [ ] Logs show no errors (`docker logs poultry-frontend`)
- [ ] Environment variables are correct (`docker exec poultry-frontend env`)

---

## 🚀 Quick Test Scripts

### Windows PowerShell Test Script

Create `test-docker.ps1`:
```powershell
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker compose build

Write-Host "Starting container..." -ForegroundColor Yellow
docker compose up -d

Write-Host "Waiting for container to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Checking container status..." -ForegroundColor Yellow
docker ps --filter "name=poultry-frontend"

Write-Host "Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing
    Write-Host "✓ Health check passed! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health check failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`nView logs with: docker compose logs -f frontend" -ForegroundColor Cyan
Write-Host "Open browser: http://localhost:3000" -ForegroundColor Cyan
```

### Linux/Mac Bash Test Script

Create `test-docker.sh`:
```bash
#!/bin/bash

echo "Building Docker image..."
docker compose build

echo "Starting container..."
docker compose up -d

echo "Waiting for container to start..."
sleep 5

echo "Checking container status..."
docker ps --filter "name=poultry-frontend"

echo "Testing health endpoint..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ Health check passed!"
else
    echo "✗ Health check failed!"
fi

echo ""
echo "View logs with: docker compose logs -f frontend"
echo "Open browser: http://localhost:3000"
```

Make it executable:
```bash
chmod +x test-docker.sh
./test-docker.sh
```

---

## 📚 Additional Resources

- **Docker Documentation:** https://docs.docker.com/
- **Docker Compose Documentation:** https://docs.docker.com/compose/
- **Next.js Docker Deployment:** https://nextjs.org/docs/deployment#docker-image

---

## ✅ Summary

**Quick Commands Reference:**

```bash
# Build
docker compose build

# Start
docker compose up -d

# Stop
docker compose down

# Logs
docker compose logs -f frontend

# Status
docker compose ps

# Rebuild
docker compose up -d --build
```

**Your frontend is now running at:** http://localhost:3000 🎉

