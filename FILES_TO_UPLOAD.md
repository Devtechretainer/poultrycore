# 📦 Files to Upload to Plesk httpdocs

## ✅ Files/Folders TO UPLOAD

### Essential Files (Required)
```
✅ .next/                    # Build output (CRITICAL - contains compiled app)
✅ server.js                 # Node.js server file (for Plesk)
✅ package.json              # Dependencies list
✅ package-lock.json         # Locked dependency versions
✅ next.config.mjs          # Next.js configuration
✅ .env.production           # Production environment variables
```

### Source Code Folders
```
✅ app/                      # All pages and routes
✅ components/               # React components
✅ lib/                      # Utilities, API clients, stores
✅ public/                   # Static assets (images, icons, etc.)
✅ hooks/                    # Custom React hooks
✅ config/                   # Configuration files
```

### Configuration Files
```
✅ tsconfig.json             # TypeScript configuration
✅ postcss.config.mjs        # PostCSS configuration
✅ components.json           # Component configuration
✅ tailwind.config.js        # Tailwind CSS config (if exists)
```

### Other Important Files
```
✅ README.md                 # Documentation (optional but recommended)
✅ PLESK_DEPLOYMENT_GUIDE.md # Deployment guide (optional)
```

---

## ❌ Files/Folders to EXCLUDE (Don't Upload)

### Development Files
```
❌ node_modules/            # Will install on server
❌ .next/cache/             # Build cache (optional, can exclude)
❌ .git/                    # Git repository (not needed)
❌ .vscode/                 # VS Code settings
❌ .idea/                   # IDE settings
```

### Development Environment Files
```
❌ .env.local               # Local development env (use .env.production instead)
❌ .env.development         # Development env
❌ .env.test                # Test env
```

### Build Scripts (Optional)
```
❌ build-and-deploy.ps1     # Build script (not needed on server)
❌ *.ps1                    # PowerShell scripts
❌ *.sh                     # Shell scripts
```

### Documentation (Optional - can exclude)
```
❌ *.md                     # Markdown docs (except README)
❌ ARCHITECTURE_*.md
❌ CHANGES_*.md
❌ FRONTEND_*.md
```

---

## 📋 Quick Upload Checklist

### Step 1: Prepare Files Locally

Create a folder with only the files to upload:

```
📁 upload-to-plesk/
  ├── 📁 .next/
  ├── 📁 app/
  ├── 📁 components/
  ├── 📁 lib/
  ├── 📁 public/
  ├── 📁 hooks/
  ├── 📁 config/
  ├── 📄 server.js
  ├── 📄 package.json
  ├── 📄 package-lock.json
  ├── 📄 next.config.mjs
  ├── 📄 .env.production
  ├── 📄 tsconfig.json
  ├── 📄 postcss.config.mjs
  └── 📄 components.json
```

### Step 2: Upload Methods

#### Option A: ZIP and Upload (Recommended)
1. **Create ZIP file** of the upload folder
2. **Upload ZIP** to Plesk File Manager
3. **Extract** in httpdocs folder
4. **Delete ZIP** after extraction

#### Option B: FTP/SFTP Upload
1. **Connect** via FileZilla or WinSCP
2. **Upload** all files/folders to `/httpdocs/`
3. **Maintain folder structure**

#### Option C: Plesk File Manager
1. **Navigate** to httpdocs folder
2. **Upload** files one by one (slower)
3. **Create folders** as needed

---

## 🔍 File Structure After Upload

Your Plesk httpdocs should look like this:

```
/var/www/vhosts/yourdomain.com/httpdocs/
├── .next/                  # Build output
│   ├── server/            # Server-side code
│   ├── static/            # Static assets
│   └── ...
├── app/                   # Next.js app directory
│   ├── dashboard/
│   ├── login/
│   └── ...
├── components/            # React components
├── lib/                   # Utilities and API
├── public/                # Static files
├── hooks/                 # Custom hooks
├── config/                # Config files
├── server.js              # Node.js server
├── package.json           # Dependencies
├── package-lock.json      # Lock file
├── next.config.mjs        # Next.js config
├── .env.production       # Environment variables
├── tsconfig.json          # TypeScript config
└── postcss.config.mjs     # PostCSS config
```

---

## ⚠️ Important Notes

### 1. .next Folder is CRITICAL
- **MUST be uploaded** - contains your compiled application
- Without it, the app won't run
- It's created by `npm run build`

### 2. .env.production File
- **Create this file** before uploading
- Contains production API URLs:
  ```env
  NEXT_PUBLIC_API_BASE_URL=https://farmapi.poultrycore.com
  NEXT_PUBLIC_ADMIN_API_URL=https://usermanagementapi.poultrycore.com
  NODE_ENV=production
  PORT=3000
  ```

### 3. node_modules
- **Don't upload** - install on server with `npm install --production`
- Saves upload time and bandwidth

### 4. File Permissions
- Files should be **readable** (644)
- Folders should be **executable** (755)
- Plesk usually sets these automatically

---

## 🚀 After Upload Steps

1. **SSH to server** or use Plesk Terminal
2. **Navigate** to httpdocs:
   ```bash
   cd /var/www/vhosts/yourdomain.com/httpdocs
   ```
3. **Install dependencies**:
   ```bash
   npm install --production
   ```
4. **Verify files**:
   ```bash
   ls -la
   # Should see .next, app, components, server.js, etc.
   ```
5. **Start application** in Plesk Node.js settings

---

## 📊 File Size Estimates

| Item | Size | Upload Time |
|------|------|-------------|
| .next/ | ~50-100 MB | 5-10 min |
| node_modules/ | ~200-300 MB | ❌ Don't upload |
| Source files | ~5-10 MB | 1-2 min |
| **Total (without node_modules)** | **~60-110 MB** | **6-12 min** |

---

## ✅ Final Checklist

Before uploading, ensure you have:

- [ ] Built the app (`npm run build`)
- [ ] Created `.env.production` with correct URLs
- [ ] Created `server.js` file
- [ ] Excluded `node_modules/` folder
- [ ] Included `.next/` folder
- [ ] Included all source folders (app/, components/, lib/, etc.)
- [ ] Included `package.json` and `package-lock.json`
- [ ] Ready to install dependencies on server

---

**Upload these files and your Next.js app will be ready to run on Plesk! 🎉**

