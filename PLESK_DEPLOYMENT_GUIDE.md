# 🚀 Deploying Next.js Frontend to Plesk

This guide will help you deploy your Next.js 15 frontend application to Plesk hosting.

---

## 📋 Prerequisites

1. ✅ **Plesk Access** - Admin or domain owner access
2. ✅ **Node.js Support** - Node.js 18+ installed on Plesk server
3. ✅ **Built Application** - Your app is already built (`npm run build` completed)
4. ✅ **Domain/Subdomain** - Pointing to your Plesk server (e.g., `farmarchive.poultrycore.com`)

---

## 🔧 Method 1: Node.js Hosting (Recommended)

### Step 1: Enable Node.js in Plesk

1. **Login to Plesk**
   - Go to your Plesk control panel
   - Select your domain

2. **Enable Node.js**
   - Go to **Websites & Domains** → **Node.js**
   - Click **Enable Node.js**
   - Select **Node.js version** (18.x or higher recommended)
   - Set **Application root**: `/httpdocs` (or your subdomain folder)
   - Set **Application startup file**: `server.js` (we'll create this)
   - Set **Application mode**: `production`

### Step 2: Prepare Files for Upload

Your build is complete. You need to upload:

1. **All project files** (except `node_modules`)
2. **`.next` folder** (build output)
3. **`package.json`** and **`package-lock.json`**
4. **`.env.local`** (with production values)
5. **`next.config.mjs`**
6. **`public` folder**
7. **`app` folder**
8. **`components` folder**
9. **`lib` folder**
10. **All other source files**

### Step 3: Create server.js for Plesk

Create a `server.js` file in your project root:

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
```

### Step 4: Update package.json Scripts

Ensure your `package.json` has:

```json
{
  "scripts": {
    "build": "next build",
    "start": "NODE_ENV=production node server.js",
    "dev": "next dev"
  }
}
```

### Step 5: Upload Files to Plesk

1. **Using Plesk File Manager**
   - Go to **Files** → **File Manager**
   - Navigate to `httpdocs` (or your subdomain folder)
   - Upload all files (use ZIP and extract for faster upload)

2. **Using FTP/SFTP**
   - Connect via FileZilla or WinSCP
   - Upload all files to `httpdocs/` folder

### Step 6: Install Dependencies on Server

1. **Using Plesk Terminal/SSH**
   - Go to **Tools & Settings** → **SSH Terminal** (if available)
   - Or use SSH client to connect

2. **Run Commands**
   ```bash
   cd /var/www/vhosts/yourdomain.com/httpdocs
   npm install --production
   ```

### Step 7: Configure Environment Variables

1. **In Plesk File Manager**
   - Edit `.env.local` or create `.env.production`
   - Set production values:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://farmapi.poultrycore.com
   NEXT_PUBLIC_ADMIN_API_URL=https://usermanagementapi.poultrycore.com
   NODE_ENV=production
   ```

### Step 8: Configure Node.js in Plesk

1. **Go to Node.js Settings**
   - **Application root**: `/httpdocs`
   - **Application startup file**: `server.js`
   - **Application mode**: `production`
   - **Node.js version**: Latest LTS (18.x or 20.x)

2. **Start Application**
   - Click **Restart App** or **Start App**

---

## 🔧 Method 2: Static Export (Alternative)

If you want a fully static site (no server-side rendering):

### Step 1: Update next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

### Step 2: Build Static Export

```bash
npm run build
```

This creates an `out` folder with static files.

### Step 3: Upload to Plesk

1. Upload the entire `out` folder contents to `httpdocs/`
2. No Node.js needed - works with regular web hosting

**Note**: Static export has limitations:
- No API routes
- No server-side rendering
- No dynamic routes at build time

---

## 🔧 Method 3: Standalone Build (Best Performance)

### Step 1: Update next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

### Step 2: Build Standalone

```bash
npm run build
```

This creates a `.next/standalone` folder with minimal dependencies.

### Step 3: Upload Standalone Build

1. Upload `.next/standalone` folder contents
2. Upload `.next/static` folder
3. Upload `public` folder
4. Create `server.js` in the root

### Step 4: Create server.js

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = false
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port, dir: __dirname })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
```

---

## ⚙️ Configuration Steps

### 1. Update Environment Variables

Create `.env.production` in Plesk:

```env
NEXT_PUBLIC_API_BASE_URL=https://farmapi.poultrycore.com
NEXT_PUBLIC_ADMIN_API_URL=https://usermanagementapi.poultrycore.com
NODE_ENV=production
PORT=3000
```

### 2. Configure Domain/Subdomain

1. **Create Subdomain** (if needed)
   - Go to **Websites & Domains** → **Add Subdomain**
   - Subdomain: `farmarchive` (or your choice)
   - Document root: `/httpdocs` (or your folder)

2. **SSL Certificate**
   - Go to **SSL/TLS Settings**
   - Install Let's Encrypt certificate (free)
   - Enable **Force HTTPS**

### 3. Configure Process Manager (PM2) - Optional

If Plesk doesn't manage Node.js processes well:

1. **Install PM2 via SSH**
   ```bash
   npm install -g pm2
   ```

2. **Create ecosystem.config.js**
   ```javascript
   module.exports = {
     apps: [{
       name: 'poultry-core',
       script: 'server.js',
       instances: 1,
       exec_mode: 'fork',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   }
   ```

3. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

---

## 🧪 Testing the Deployment

### 1. Check Application Status

- In Plesk Node.js settings, check if app is **Running**
- Check logs for errors

### 2. Test URLs

- Home: `https://farmarchive.poultrycore.com`
- Login: `https://farmarchive.poultrycore.com/login`
- Dashboard: `https://farmarchive.poultrycore.com/dashboard`

### 3. Check Logs

- **Plesk Logs**: **Logs** → **Application Logs**
- **Node.js Logs**: Check in Plesk Node.js section
- **SSH Logs**: `pm2 logs` (if using PM2)

---

## 🔧 Troubleshooting

### Issue: Application Won't Start

**Solutions:**
1. Check Node.js version (needs 18+)
2. Verify `server.js` exists and is correct
3. Check `package.json` has correct scripts
4. Verify all dependencies installed (`npm install`)
5. Check application logs in Plesk

### Issue: 500 Internal Server Error

**Solutions:**
1. Check `.env` files are uploaded
2. Verify API URLs are correct
3. Check CORS settings in backend
4. Review application logs

### Issue: Port Already in Use

**Solutions:**
1. Change PORT in `.env.production`
2. Update Plesk Node.js port settings
3. Kill existing process: `pm2 stop all` (if using PM2)

### Issue: Build Files Missing

**Solutions:**
1. Ensure `.next` folder is uploaded
2. Run `npm run build` on server if needed
3. Check file permissions (should be readable)

### Issue: Static Assets Not Loading

**Solutions:**
1. Verify `public` folder is uploaded
2. Check `next.config.mjs` has `images.unoptimized: true`
3. Verify `.next/static` folder exists

---

## 📝 Production Checklist

- [ ] Node.js enabled in Plesk
- [ ] All files uploaded to server
- [ ] Dependencies installed (`npm install --production`)
- [ ] `.env.production` configured with correct API URLs
- [ ] `server.js` created and configured
- [ ] Application started in Plesk
- [ ] SSL certificate installed and HTTPS enabled
- [ ] Domain/subdomain configured correctly
- [ ] Application tested and working
- [ ] Logs accessible and monitored
- [ ] Process manager configured (PM2 if needed)

---

## 🚀 Quick Start Commands

### On Your Local Machine (Before Upload)

```bash
# Build the application
npm run build

# Create server.js (if using Method 1 or 3)
# Copy the server.js content above

# Create .env.production
echo "NEXT_PUBLIC_API_BASE_URL=https://farmapi.poultrycore.com" > .env.production
echo "NEXT_PUBLIC_ADMIN_API_URL=https://usermanagementapi.poultrycore.com" >> .env.production
echo "NODE_ENV=production" >> .env.production
```

### On Plesk Server (After Upload)

```bash
# Navigate to your domain folder
cd /var/www/vhosts/yourdomain.com/httpdocs

# Install dependencies
npm install --production

# Start application (if not using Plesk Node.js manager)
node server.js
# OR with PM2
pm2 start server.js --name poultry-core
```

---

## 📞 Support Resources

- **Plesk Documentation**: https://docs.plesk.com/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Node.js on Plesk**: Check Plesk's Node.js hosting documentation

---

## 🎯 Summary

Your Next.js frontend is now ready to deploy to Plesk!

**Recommended Approach**: Use **Method 1 (Node.js Hosting)** for full Next.js features, or **Method 2 (Static Export)** if you don't need server-side rendering.

**Your frontend will be accessible at:**
- `https://farmarchive.poultrycore.com` (or your domain)

**Remember to:**
1. ✅ Update environment variables with production API URLs
2. ✅ Test all pages after deployment
3. ✅ Monitor logs for errors
4. ✅ Set up automated backups

---

**Your Next.js frontend is ready for Plesk deployment! 🎉**

