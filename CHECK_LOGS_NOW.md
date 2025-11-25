# 🔥 CRITICAL: Check Logs to Find the Real Error

## ⚠️ The Most Important Step

**The 500.1002 error means your app crashed. The real error is in the logs!**

---

## 📍 Where to Find Logs

### On Your Server:
```
C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com\
└── iisnode/
    └── logs/
        ├── stderr.log    ← THE REAL ERROR IS HERE
        └── stdout.log    ← Console output here
```

---

## 🔍 How to Check Logs

### Option 1: Via Plesk File Manager
1. Login to Plesk
2. Go to **Files** → **File Manager**
3. Navigate to: `dev-app.poultrycore.com/iisnode/logs/`
4. Open `stderr.log` - **This shows the actual error!**

### Option 2: Via SSH/PowerShell
```powershell
# Navigate to app folder
cd C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com

# View last 100 lines of stderr (the error log)
Get-Content iisnode\logs\stderr.log -Tail 100

# View last 100 lines of stdout (console output)
Get-Content iisnode\logs\stdout.log -Tail 100
```

### Option 3: Via Remote Desktop
1. Connect to your server
2. Open File Explorer
3. Navigate to: `C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com\iisnode\logs\`
4. Open `stderr.log` with Notepad

---

## 🎯 What to Look For

The `stderr.log` will show errors like:

### Common Errors:

1. **Missing .next folder:**
   ```
   Error: Could not find a production build in the '.next' directory
   ```

2. **Missing module:**
   ```
   Error: Cannot find module 'next'
   ```

3. **Syntax error:**
   ```
   SyntaxError: Unexpected token
   ```

4. **Node version mismatch:**
   ```
   Error: require is not defined
   ```

5. **Port conflict:**
   ```
   Error: listen EADDRINUSE: address already in use
   ```

---

## ✅ Quick Actions Based on Error

### If Error: "Could not find .next directory"
**Fix:**
```powershell
cd C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com
npm run build
```

### If Error: "Cannot find module"
**Fix:**
```powershell
cd C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com
npm install
```

### If Error: "Node version"
**Fix:** Install Node.js 18+ on server

### If Error: "Port already in use"
**Fix:** Our server.js is correct (doesn't use app.listen), so this shouldn't happen

---

## 📋 Current Configuration Status

✅ **server.js** - Correctly exports handler (no app.listen)
✅ **web.config** - Has IISNode handler and rewrite rules
✅ **Logging enabled** - `loggingEnabled="true"` in web.config

---

## 🚀 Next Steps

1. **CHECK `stderr.log`** - This will tell you exactly what's wrong
2. **Share the error** from stderr.log if you need help
3. **Fix based on error** - Use the quick actions above

---

## 💡 Pro Tip

The Buffer deprecation warning you see is **harmless** - it's just a warning from dependencies. The real error is something else, and it's in `stderr.log`.

---

**The logs will tell you exactly what's wrong! Check `iisnode/logs/stderr.log` now!** 🔍

