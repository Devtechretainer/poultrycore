# 🔧 IISNode 500.1002 Error - Complete Troubleshooting Guide

## ❌ Error: 500.1002
This means your Node.js app crashed before sending a response.

---

## 🔍 Step 1: Check Logs (MOST IMPORTANT)

### Find the Logs
Go to your application folder on the server:
```
C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com\
├── iisnode/
│   └── logs/
│       ├── stderr.log    ← CHECK THIS FIRST
│       └── stdout.log    ← Check this too
```

### Read the Logs
1. **Open `stderr.log`** - This shows the actual error
2. **Open `stdout.log`** - This shows console.log output

**The real error will be in stderr.log!**

---

## ✅ Step 2: Verify server.js Configuration

### ✅ CORRECT (for IISNode):
```javascript
// Export handler function - IIS handles the server
module.exports = async function(req, res) {
  // Handle request
}
```

### ❌ WRONG (will cause 500.1002):
```javascript
// DON'T do this - IISNode doesn't need you to create a server
app.listen(3000)  // ❌ This will fail!
```

**Our current server.js is correct** - it exports a handler function.

---

## ✅ Step 3: Check web.config

### Simplified web.config (Recommended)

Your web.config should have:

1. **Handler pointing to server.js**
2. **Rewrite rule routing to server.js**
3. **IISNode configuration with logging enabled**

**Current web.config looks good**, but let's verify the rewrite rule is correct.

---

## ✅ Step 4: Verify Node.js Version

### Check Server Node Version
On the server, run:
```powershell
node -v
```

**Required**: Node.js 18+ (Next.js 15 requires Node 18+)

### If Version is Too Old
1. Install Node.js 18+ or 20+ LTS
2. Update `web.config` with correct path:
   ```xml
   <iisnode nodeProcessCommandLine="C:\Program Files\nodejs\node.exe" />
   ```

---

## ✅ Step 5: Verify Dependencies

### Install Dependencies
On the server, in your app folder:
```powershell
cd C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com
npm install --production
```

### Check for Missing Modules
If you see errors like "Cannot find module", run:
```powershell
npm install
```

---

## ✅ Step 6: Verify .next Folder

### Check if .next exists
```powershell
dir .next
```

### Should contain:
- `.next/BUILD_ID`
- `.next/server/`
- `.next/static/`

### If Missing
1. Build on server:
   ```powershell
   npm run build
   ```
2. Or upload `.next` folder from your local build

---

## ✅ Step 7: Check File Permissions

### Verify Permissions
Files should be readable:
- Files: **644** (readable)
- Folders: **755** (executable)

### Fix Permissions (if needed)
```powershell
icacls "C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com" /grant "IIS_IUSRS:(OI)(CI)F"
```

---

## 🔧 Common Fixes

### Fix 1: Missing .next Folder
**Error**: "Could not find a production build in the '.next' directory"

**Solution**:
```powershell
cd C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com
npm run build
```

### Fix 2: Port Conflict
**Error**: "EADDRINUSE: address already in use"

**Solution**: 
- Don't use `app.listen()` - IISNode handles ports
- Our server.js is correct (exports handler, doesn't listen)

### Fix 3: Module Not Found
**Error**: "Cannot find module 'xxx'"

**Solution**:
```powershell
npm install
```

### Fix 4: Node Version Mismatch
**Error**: Syntax errors or "require is not defined"

**Solution**: Install Node.js 18+ or 20+

### Fix 5: Wrong Path in web.config
**Error**: Handler not found

**Solution**: Verify `path="server.js"` matches your actual file name

---

## 📋 Quick Checklist

- [ ] Check `iisnode/logs/stderr.log` for actual error
- [ ] Verify `.next` folder exists and is complete
- [ ] Run `npm install --production` on server
- [ ] Check Node.js version (18+ required)
- [ ] Verify `web.config` has correct handler path
- [ ] Verify `server.js` exports handler (not using `app.listen()`)
- [ ] Check file permissions
- [ ] Restart application pool in IIS

---

## 🎯 Next Steps

1. **Upload the content of `stderr.log`** - This will show the exact error
2. **Check if `.next` folder exists** on the server
3. **Verify Node.js version** on the server
4. **Run `npm install`** on the server if needed

---

## 📝 Debugging Commands

### On Server (PowerShell):
```powershell
# Check Node version
node -v

# Check if .next exists
Test-Path "C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com\.next"

# Check if server.js exists
Test-Path "C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com\server.js"

# View stderr log (last 50 lines)
Get-Content "C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com\iisnode\logs\stderr.log" -Tail 50

# View stdout log (last 50 lines)
Get-Content "C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com\iisnode\logs\stdout.log" -Tail 50
```

---

**The most important step is checking `stderr.log` - it will tell you exactly what's wrong!** 🔍

