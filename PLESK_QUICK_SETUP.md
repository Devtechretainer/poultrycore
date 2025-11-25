# ⚡ Plesk Quick Setup Guide

## 🎯 Fast Deployment Steps (15 minutes)

### 1. Prepare Files (2 minutes)

```bash
# On your local machine
npm run build
```

**Files to upload:**
- All project files (except `node_modules`)
- `.next` folder (build output)
- `server.js` (create from template)
- `.env.production` (with production URLs)

### 2. Enable Node.js in Plesk (3 minutes)

```
1. Plesk → Your Domain → Node.js
2. Enable Node.js
3. Select Node.js 18+ version
4. Application root: /httpdocs
5. Startup file: server.js
6. Mode: production
```

### 3. Upload Files (5 minutes)

```
1. Plesk → Files → File Manager
2. Navigate to /httpdocs
3. Upload all files (ZIP and extract for speed)
```

### 4. Install Dependencies (2 minutes)

**Via SSH or Plesk Terminal:**
```bash
cd /var/www/vhosts/yourdomain.com/httpdocs
npm install --production
```

### 5. Configure Environment (2 minutes)

**Create `.env.production`:**
```env
NEXT_PUBLIC_API_BASE_URL=https://farmapi.poultrycore.com
NEXT_PUBLIC_ADMIN_API_URL=https://usermanagementapi.poultrycore.com
NODE_ENV=production
```

### 6. Start Application (1 minute)

```
1. Plesk → Node.js
2. Click "Restart App" or "Start App"
3. Check status is "Running"
```

---

## ✅ Done!

Your frontend is live at: `https://yourdomain.com`

**Total Time: ~15 minutes**

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| App won't start | Check Node.js version (18+), verify server.js exists |
| 500 Error | Check .env.production, verify API URLs |
| Port in use | Change PORT in .env.production |
| Files missing | Ensure .next folder uploaded |

---

## 📝 Required Files Checklist

- [ ] All source files (app/, components/, lib/, etc.)
- [ ] `.next` folder (from `npm run build`)
- [ ] `server.js` (created)
- [ ] `package.json` and `package-lock.json`
- [ ] `.env.production` (with production URLs)
- [ ] `public` folder
- [ ] `next.config.mjs`

---

**Need help? Check the full guide: `PLESK_DEPLOYMENT_GUIDE.md`**

