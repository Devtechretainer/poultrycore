# ✅ Quick Fix Checklist for IISNode 500.1002

## 🔥 Step 1: Check Logs (DO THIS FIRST!)
- [ ] Open `C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com\iisnode\logs\stderr.log`
- [ ] Read the actual error message
- [ ] Note the error type (missing module, missing .next, syntax error, etc.)

---

## ✅ Step 2: Verify Files Exist

### On Server, Check:
- [ ] `.next` folder exists
- [ ] `server.js` exists
- [ ] `web.config` exists
- [ ] `package.json` exists
- [ ] `node_modules` folder exists (or run `npm install`)

### Commands:
```powershell
cd C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com

# Check .next
Test-Path .next

# Check server.js
Test-Path server.js

# Check web.config
Test-Path web.config
```

---

## ✅ Step 3: Verify Dependencies

- [ ] Run `npm install --production` on server
- [ ] Check for any missing modules in stderr.log

### Command:
```powershell
cd C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com
npm install --production
```

---

## ✅ Step 4: Verify Node.js Version

- [ ] Check Node.js version: `node -v`
- [ ] Should be 18+ (Next.js 15 requires Node 18+)

### Command:
```powershell
node -v
```

### If version is too old:
- Install Node.js 18+ or 20+ LTS
- Update web.config: `nodeProcessCommandLine="C:\Program Files\nodejs\node.exe"`

---

## ✅ Step 5: Verify Build

- [ ] Check if `.next` folder is complete
- [ ] If missing or incomplete, run: `npm run build`

### Command:
```powershell
cd C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com
npm run build
```

### Verify build:
```powershell
# Check if BUILD_ID exists
Test-Path .next\BUILD_ID

# Check if server folder exists
Test-Path .next\server
```

---

## ✅ Step 6: Restart Application

- [ ] Restart Application Pool in IIS/Plesk
- [ ] Or recycle the app pool

---

## 📝 Common Fixes Summary

| Error in stderr.log | Fix |
|---------------------|-----|
| "Could not find .next" | Run `npm run build` |
| "Cannot find module" | Run `npm install` |
| "require is not defined" | Install Node.js 18+ |
| "Port already in use" | Check server.js (shouldn't happen) |
| Syntax errors | Check server.js for typos |

---

## 🎯 Most Likely Issues

1. **Missing .next folder** (90% of cases)
   - **Fix:** `npm run build` on server

2. **Missing dependencies** (5% of cases)
   - **Fix:** `npm install` on server

3. **Wrong Node.js version** (3% of cases)
   - **Fix:** Install Node.js 18+

4. **Other** (2% of cases)
   - **Fix:** Check stderr.log for specific error

---

**Start with Step 1 - Check the logs! The error message will tell you exactly what's wrong.** 🔍

