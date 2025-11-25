# 🔧 Fix: Missing .next Folder Error

## ❌ Error Message
```
Error: Could not find a production build in the '.next' directory. 
Try building your app with 'next build' before starting the production server.
```

## 🔍 Problem
The `.next` folder (build output) is missing or incomplete on your Plesk server.

---

## ✅ Solution Options

### Option 1: Upload .next Folder (Recommended)

**If you have the .next folder locally:**

1. **Check if .next exists locally:**
   ```bash
   # On your local machine
   cd frontend/FarmArchive
   dir .next
   # or
   ls .next
   ```

2. **Upload .next folder to Plesk:**
   - Via **Plesk File Manager**:
     - Navigate to `httpdocs` folder
     - Upload the entire `.next` folder
     - Make sure it's in the root of httpdocs
   
   - Via **FTP/SFTP**:
     - Connect to your server
     - Navigate to `/httpdocs/` or `/dev-app.poultrycore.com/`
     - Upload the `.next` folder
     - Maintain folder structure

3. **Verify upload:**
   - Check that `.next` folder exists on server
   - Should contain: `server/`, `static/`, `BUILD_ID`, etc.

---

### Option 2: Build on Server (If .next is missing locally)

**If you don't have .next folder locally, build on the server:**

1. **SSH to your Plesk server** or use **Plesk Terminal**

2. **Navigate to your application folder:**
   ```bash
   cd C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com
   # or
   cd /var/www/vhosts/poultrycore.com/httpdocs
   ```

3. **Install dependencies (if not done):**
   ```bash
   npm install
   ```

4. **Build the application:**
   ```bash
   npm run build
   ```

5. **Verify .next folder was created:**
   ```bash
   dir .next
   # or
   ls .next
   ```

6. **Restart the application** in Plesk Node.js settings

---

### Option 3: Rebuild Locally and Re-upload

**If you need to rebuild:**

1. **On your local machine:**
   ```bash
   cd frontend/FarmArchive
   npm run build
   ```

2. **Verify .next folder exists:**
   ```bash
   dir .next
   # Should see: server/, static/, BUILD_ID, etc.
   ```

3. **Upload .next folder to Plesk:**
   - Use Plesk File Manager or FTP
   - Upload to: `httpdocs/.next/` or `dev-app.poultrycore.com/.next/`

---

## 📋 Quick Fix Steps

### Step 1: Check Server Location
Your error shows the path:
```
C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com\
```

**Upload .next to this exact location.**

### Step 2: Verify .next Folder Structure

The `.next` folder should contain:
```
.next/
├── BUILD_ID
├── server/
│   ├── app/
│   ├── pages/
│   └── ...
├── static/
│   └── ...
└── ...
```

### Step 3: Check File Permissions

Ensure `.next` folder and files are readable:
- Files: 644 (readable)
- Folders: 755 (executable)

### Step 4: Restart Application

After uploading `.next`:
1. Go to **Plesk** → **Node.js**
2. Click **Restart App** or **Stop** then **Start**
3. Check if error is resolved

---

## 🔍 Troubleshooting

### Issue: .next folder exists but still getting error

**Solutions:**
1. Check if `.next/BUILD_ID` file exists
2. Verify `.next/server/` folder exists
3. Check file permissions (should be readable)
4. Try rebuilding: `npm run build` on server

### Issue: Can't upload .next folder

**Solutions:**
1. **ZIP the folder** and upload, then extract on server
2. Use **FTP/SFTP** instead of File Manager
3. Check **disk space** on server
4. Build on server instead: `npm run build`

### Issue: Build fails on server

**Solutions:**
1. Check **Node.js version** (needs 18+)
2. Verify all **source files** are uploaded
3. Check **disk space**
4. Review **build errors** in console

---

## ✅ Verification Checklist

After fixing, verify:

- [ ] `.next` folder exists on server
- [ ] `.next/BUILD_ID` file exists
- [ ] `.next/server/` folder exists
- [ ] `.next/static/` folder exists
- [ ] File permissions are correct
- [ ] Application restarted in Plesk
- [ ] No errors in Plesk logs

---

## 🚀 Quick Command Reference

### On Server (via SSH/Terminal):

```bash
# Navigate to app folder
cd C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com

# Check if .next exists
dir .next

# If missing, build
npm install
npm run build

# Verify build
dir .next

# Restart app (or do in Plesk UI)
```

---

## 📝 Important Notes

1. **.next folder is REQUIRED** - Without it, Next.js can't run
2. **Build must be complete** - Partial builds won't work
3. **Match Node.js versions** - Build and server should use same Node version
4. **File structure matters** - Keep .next in root of application folder

---

**After uploading/rebuilding .next folder, your application should start successfully! 🎉**

