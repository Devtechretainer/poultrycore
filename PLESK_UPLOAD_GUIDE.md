# 📦 Plesk Upload Guide - What Files to Upload

## Step 1: Build Your Application Locally

**Run this command in your terminal:**
```bash
cd frontend/FarmArchive
npm run build
```

This will create the `.next` folder with all compiled files. **Wait for this to complete before uploading.**

---

## Step 2: Files to Upload to Plesk

Upload the **entire contents** of the `frontend/FarmArchive` folder **EXCEPT**:

### ❌ DO NOT Upload:
- `node_modules/` folder (you'll install on server)
- `.git/` folder (if exists)
- `.next/cache/` (optional - can be regenerated)
- Any `.log` files
- `.env.local` (upload `.env.production` instead)

### ✅ DO Upload These Folders/Files:

#### Required Files:
1. **`.next/`** folder (build output - **MOST IMPORTANT!**)
2. **`public/`** folder (static assets)
3. **`package.json`** and **`package-lock.json`**
4. **`server.js`** (already exists in your project)
5. **`web.config`** (for IIS/IISNode configuration)
6. **`next.config.mjs`**

#### Source Code Folders:
7. **`app/`** folder (Next.js app directory)
8. **`components/`** folder
9. **`lib/`** folder
10. **`hooks/`** folder
11. **`styles/`** folder
12. **`config/`** folder

#### Configuration Files:
13. **`.env.production`** (create this with production values - see below)
14. **`tsconfig.json`**
15. **`postcss.config.mjs`**
16. **`next-env.d.ts`**

---

## Step 3: Create Production Environment File

Create a file named `.env.production` in the `frontend/FarmArchive` folder:

```env
NEXT_PUBLIC_API_BASE_URL=https://farmapi.poultrycore.com
NEXT_PUBLIC_ADMIN_API_URL=https://usermanagementapi.poultrycore.com
NODE_ENV=production
PORT=3000
```

**Upload this file to Plesk** (but NOT `.env.local`)

---

## Step 4: Quick Upload Checklist

Before uploading, verify you have:

- [ ] Run `npm run build` successfully
- [ ] `.next` folder exists and has content
- [ ] Created `.env.production` with production API URLs
- [ ] `server.js` file exists (already in your project ✓)
- [ ] `web.config` file exists (already in your project ✓)
- [ ] `package.json` exists

---

## Step 5: Upload Methods

### Option A: ZIP Upload (Recommended for large folders)

1. **On your local machine:**
   ```bash
   cd frontend/FarmArchive
   # Create a ZIP file (excluding node_modules)
   # On Windows: Right-click folder → Send to → Compressed folder
   # Or use: 7-Zip / WinRAR to create ZIP
   ```

2. **In Plesk:**
   - Go to **Files** → **File Manager**
   - Navigate to your domain's `httpdocs` folder
   - Upload the ZIP file
   - Right-click ZIP → **Extract**

### Option B: FTP/SFTP Upload

1. Use FileZilla, WinSCP, or similar
2. Connect to your Plesk server
3. Navigate to `httpdocs/` folder
4. Upload all the files listed above

---

## Step 6: After Upload - Install Dependencies

**Via Plesk SSH/Terminal:**
```bash
cd /var/www/vhosts/yourdomain.com/httpdocs
npm install --production
```

**Or via Plesk Node.js Panel:**
- Plesk will auto-install when you enable Node.js and click "NPM Install"

---

## Step 7: Configure Node.js in Plesk

1. Go to **Websites & Domains** → **Node.js**
2. Click **Enable Node.js**
3. Set:
   - **Application root**: `/httpdocs`
   - **Application startup file**: `server.js`
   - **Application mode**: `production`
   - **Node.js version**: 18.x or 20.x
4. Click **NPM Install** (to install dependencies)
5. Click **Restart App**

---

## 📋 Complete File Structure in Plesk

After upload, your `httpdocs/` should contain:

```
httpdocs/
├── .next/              ← Build output (CRITICAL!)
│   ├── static/
│   ├── server/
│   └── ...
├── app/                ← Source code
├── components/         ← Source code
├── lib/                ← Source code
├── hooks/              ← Source code
├── styles/             ← Source code
├── config/             ← Source code
├── public/             ← Static assets
├── server.js           ← Server entry point
├── web.config          ← IIS configuration
├── package.json        ← Dependencies list
├── package-lock.json   ← Lock file
├── next.config.mjs     ← Next.js config
├── tsconfig.json       ← TypeScript config
├── postcss.config.mjs  ← PostCSS config
├── .env.production     ← Environment variables
└── next-env.d.ts       ← Type definitions
```

---

## ✅ Summary

**What to do:**
1. Run `npm run build` locally
2. Upload all files **except** `node_modules/`
3. Create and upload `.env.production`
4. Install dependencies on server (`npm install --production`)
5. Configure Node.js in Plesk pointing to `server.js`
6. Start the app!

**The `.next` folder is the most important** - it contains your compiled application. Without it, your app won't work!

---

## 🚨 Common Mistakes to Avoid

- ❌ **Don't upload `node_modules/`** - Install on server instead
- ❌ **Don't forget to build first** - The `.next` folder must exist
- ❌ **Don't upload `.env.local`** - Use `.env.production` instead
- ❌ **Don't forget `server.js`** - Required for Node.js hosting
- ❌ **Don't forget `web.config`** - Required for IIS/IISNode

---

## 🔍 Verify Your Upload

After uploading, check that these files exist in Plesk:
- ✅ `.next/server/app/` (should have files)
- ✅ `.next/static/` (should have folders)
- ✅ `server.js` (should be readable)
- ✅ `package.json` (should exist)

If any are missing, your app won't work!

