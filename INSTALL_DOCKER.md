# 🐳 Docker Installation Guide for Windows

Step-by-step guide to install Docker Desktop on Windows.

---

## 📋 System Requirements

Before installing, ensure your system meets these requirements:

- **Windows 10 64-bit:** Pro, Enterprise, or Education (Build 19041 or higher)
- **OR Windows 11 64-bit:** Home or Pro version
- **WSL 2** feature enabled
- **Virtualization** enabled in BIOS
- At least **4GB RAM** (8GB+ recommended)
- Administrator access

---

## 🔧 Step 1: Enable WSL 2 (Windows Subsystem for Linux)

Docker Desktop requires WSL 2 on Windows.

### Method A: Using PowerShell (Recommended)

1. **Open PowerShell as Administrator:**
   - Press `Windows Key + X`
   - Select **"Windows PowerShell (Admin)"** or **"Terminal (Admin)"**

2. **Run these commands:**

```powershell
# Enable WSL feature
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Restart your computer (required)
Restart-Computer
```

3. **After restart, open PowerShell as Admin again and set WSL 2 as default:**

```powershell
wsl --set-default-version 2
```

### Method B: Using Windows Features GUI

1. Press `Windows Key + R`
2. Type `optionalfeatures` and press Enter
3. Check these boxes:
   - ☑️ **Windows Subsystem for Linux**
   - ☑️ **Virtual Machine Platform**
4. Click **OK** and restart when prompted

---

## 🔧 Step 2: Install WSL 2 Linux Kernel Update

1. **Download WSL2 Update:**
   - Visit: https://aka.ms/wsl2kernel
   - Download the **"WSL2 Linux kernel update package"**

2. **Run the installer:**
   - Double-click the downloaded `.msi` file
   - Follow the installation wizard
   - Click **Restart now** when prompted

---

## 🔧 Step 3: Install a Linux Distribution (Optional but Recommended)

1. **Open Microsoft Store:**
   - Press `Windows Key`
   - Search for **"Microsoft Store"**

2. **Install Ubuntu (recommended):**
   - Search for **"Ubuntu"** in the Store
   - Click **Install** (choose Ubuntu 22.04 LTS or latest)
   - Wait for installation to complete

3. **Launch Ubuntu:**
   - Open Ubuntu from Start Menu
   - Create a username and password when prompted
   - Close Ubuntu after setup

---

## 🔧 Step 4: Verify WSL 2 Installation

Open PowerShell and run:

```powershell
wsl --list --verbose
```

**Expected output:**
```
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

If VERSION shows **2**, you're good! ✅

If it shows **1**, convert it:
```powershell
wsl --set-version Ubuntu 2
```

---

## 🔧 Step 5: Download Docker Desktop

1. **Visit Docker Desktop for Windows:**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Click **"Download for Windows"**

2. **Or download directly:**
   - Direct link: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

---

## 🔧 Step 6: Install Docker Desktop

1. **Run the installer:**
   - Double-click `Docker Desktop Installer.exe`
   - If prompted by User Account Control, click **Yes**

2. **Installation options:**
   - ☑️ **Use WSL 2 instead of Hyper-V** (recommended - should be checked by default)
   - Click **OK**

3. **Wait for installation:**
   - The installer will copy files and set up Docker
   - This may take 5-10 minutes

4. **When installation completes:**
   - Click **Close and restart** (recommended)
   - OR click **Close** and restart manually

---

## 🔧 Step 7: Start Docker Desktop

1. **Launch Docker Desktop:**
   - Press `Windows Key`
   - Search for **"Docker Desktop"**
   - Click to open

2. **Accept the service agreement:**
   - Read and accept Docker's terms
   - Click **Accept**

3. **Wait for Docker to start:**
   - Docker Desktop will start the Docker Engine
   - Look for the Docker whale icon in system tray (bottom-right)
   - Wait until it shows "Docker Desktop is running" ✅

4. **Optional: Sign in:**
   - You can sign in to Docker Hub (optional)
   - Click **Skip** if you don't want to sign in now

---

## 🔧 Step 8: Verify Docker Installation

1. **Open PowerShell or Command Prompt**

2. **Check Docker version:**
```powershell
docker --version
```

**Expected output:**
```
Docker version 24.0.x, build xxxxxxx
```

3. **Check Docker Compose:**
```powershell
docker compose version
```

**Expected output:**
```
Docker Compose version v2.x.x
```

4. **Test Docker:**
```powershell
docker run hello-world
```

**Expected output:**
```
Hello from Docker!
This message shows that your installation appears to be working correctly.
...
```

✅ **If you see this, Docker is installed correctly!**

---

## 🔧 Step 9: Configure Docker Desktop (Optional)

1. **Open Docker Desktop settings:**
   - Right-click Docker whale icon in system tray
   - Click **Settings**

2. **Recommended settings:**

   **General:**
   - ☑️ **Start Docker Desktop when you log in**
   - ☑️ **Use the WSL 2 based engine**
   - **Resources → Advanced:**
     - Set Memory: **4GB or more** (if you have 8GB+ RAM)
     - Set CPUs: **2 or more**

   **WSL Integration:**
   - ☑️ **Enable integration with my default WSL distro**
   - ☑️ Enable integration with your installed distros (Ubuntu, etc.)

---

## 🐛 Troubleshooting

### Issue: "WSL 2 installation is incomplete"

**Solution:**
1. Download WSL2 update: https://aka.ms/wsl2kernel
2. Install the update
3. Restart your computer
4. Run: `wsl --set-default-version 2`

### Issue: "Hardware assisted virtualization and data execution protection must be enabled"

**Solution:**
1. **Enable Virtualization in BIOS:**
   - Restart computer
   - Press `F2`, `F10`, `F12`, or `Del` during boot (depends on manufacturer)
   - Find **Virtualization Technology** or **VT-x**
   - Enable it
   - Save and exit

2. **Enable Hyper-V (if using Hyper-V mode):**
   ```powershell
   # Run as Administrator
   Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
   ```

### Issue: Docker Desktop won't start

**Solutions:**
1. **Restart Docker Desktop:**
   - Right-click Docker icon → **Quit Docker Desktop**
   - Launch it again

2. **Check WSL 2:**
   ```powershell
   wsl --status
   ```
   Should show: `Default Version: 2`

3. **Reset Docker Desktop:**
   - Open Docker Desktop
   - Settings → **Troubleshoot** → **Reset to factory defaults**

### Issue: "WSL 2 distribution is not found"

**Solution:**
1. Install a Linux distribution from Microsoft Store (Ubuntu recommended)
2. Open it once to complete setup
3. Restart Docker Desktop

### Issue: Docker commands not recognized

**Solution:**
1. Restart your terminal/PowerShell after installing Docker
2. Verify Docker Desktop is running (check system tray)
3. Try restarting Docker Desktop

---

## ✅ Installation Checklist

- [ ] WSL 2 enabled and set as default
- [ ] WSL 2 Linux kernel update installed
- [ ] Docker Desktop downloaded
- [ ] Docker Desktop installed
- [ ] Docker Desktop started and running
- [ ] `docker --version` works
- [ ] `docker compose version` works
- [ ] `docker run hello-world` works

---

## 🚀 After Installation

Once Docker is installed, you can now:

1. **Build your frontend:**
   ```powershell
   cd frontend/FarmArchive
   docker compose build
   ```

2. **Run your container:**
   ```powershell
   docker compose up -d
   ```

3. **Or use the test script:**
   ```powershell
   .\test-docker.ps1
   ```

---

## 📚 Additional Resources

- **Docker Desktop Documentation:** https://docs.docker.com/desktop/install/windows-install/
- **WSL 2 Documentation:** https://docs.microsoft.com/en-us/windows/wsl/
- **Docker Get Started Guide:** https://docs.docker.com/get-started/

---

## 🎉 You're Ready!

Docker Desktop is now installed and ready to use! 🐳

**Next Steps:**
1. Navigate to your project: `cd frontend/FarmArchive`
2. Build the Docker image: `docker compose build`
3. Start the container: `docker compose up -d`
4. Open browser: http://localhost:3000

---

## 💡 Quick Tips

- **Docker Desktop runs in the background** - keep it running when using Docker commands
- **Check system tray** - Docker whale icon shows if Docker is running
- **Use WSL 2** - It's faster and more efficient than Hyper-V
- **Keep Docker updated** - Docker Desktop will notify you of updates

---

**Need help?** Check the troubleshooting section above or visit Docker's official documentation.

