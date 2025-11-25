# 🔧 IISNode Setup for Next.js

## ✅ Fixed server.js for IISNode

The `server.js` file has been updated to work correctly with IISNode. IISNode works differently than a standalone Node.js server:

- **IIS handles the HTTP server** - You don't create your own
- **Export a request handler function** - IISNode calls it for each request
- **No port binding needed** - IIS manages the port

---

## 📋 IISNode Configuration

### 1. web.config File

Create a `web.config` file in your application root:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
    <iisnode 
      node_env="production"
      nodeProcessCountPerApplication="1"
      maxConcurrentRequestsPerProcess="1024"
      maxNamedPipeConnectionRetry="100"
      namedPipeConnectionRetryDelay="250"
      maxNamedPipeConnectionPoolSize="512"
      maxNamedPipePooledConnectionAge="30000"
      asyncCompletionThreadCount="0"
      initialRequestBufferSize="4096"
      maxRequestBufferSize="65536"
      watchedFiles="*.js"
      uncFileChangesPollingInterval="5000"
      gracefulShutdownTimeout="60000"
      loggingEnabled="true"
      logDirectory="iisnode"
      debuggingEnabled="false"
      debugHeaderEnabled="false"
      debuggerPortRange="5058-6058"
      debuggerPathSegment="debug"
      maxLogFileSizeInKB="128"
      maxTotalLogFileSizeInKB="1024"
      maxLogFiles="20"
      devErrorsEnabled="true"
      flushResponse="false"
      enableXFF="false"
      promoteServerVars=""
      configOverrides="iisnode.yml"
    />
  </system.webServer>
</configuration>
```

### 2. Required Files Structure

```
C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com\
├── server.js              # Your Next.js handler (updated)
├── web.config             # IISNode configuration (create this)
├── package.json           # Dependencies
├── .next/                 # Build output (CRITICAL)
├── app/                   # Next.js app directory
├── components/            # React components
├── lib/                   # Utilities
├── public/                # Static files
└── ...                    # Other source files
```

---

## 🔧 Setup Steps

### Step 1: Create web.config

Create `web.config` in your application root with the content above.

### Step 2: Upload Updated server.js

Upload the updated `server.js` file that exports a request handler.

### Step 3: Verify .next Folder

Ensure `.next` folder exists and is complete:
- `.next/BUILD_ID`
- `.next/server/`
- `.next/static/`

### Step 4: Install Dependencies

On the server, run:
```bash
cd C:\Inetpub\vhosts\poultrycore.com\dev-app.poultrycore.com
npm install --production
```

### Step 5: Restart Application Pool

In Plesk or IIS:
1. Go to **Application Pools**
2. Find your application pool
3. Click **Recycle** or **Restart**

---

## 🧪 Testing

After setup, test your application:
- Visit: `https://dev-app.poultrycore.com`
- Should load without errors
- Check browser console for any client-side errors

---

## 🔍 Troubleshooting

### Issue: Still getting 500 errors

**Solutions:**
1. Check **IIS logs**: `C:\inetpub\logs\LogFiles\`
2. Check **iisnode logs**: `C:\Inetpub\vhosts\...\iisnode\`
3. Verify `.next` folder exists and is complete
4. Check `web.config` is in root directory
5. Verify `server.js` exports the handler function

### Issue: Buffer deprecation warning

The Buffer warning is just a deprecation notice from dependencies. It won't break your app, but you can:
1. Update Node.js to latest LTS version
2. Update dependencies: `npm update`
3. The warning is harmless for now

### Issue: Application not starting

**Solutions:**
1. Check **IISNode is installed** on the server
2. Verify **Node.js is installed** (18+ recommended)
3. Check **application pool** is running
4. Review **event logs** in Windows Event Viewer

---

## 📝 Important Notes

1. **IISNode handles the server** - Don't create your own HTTP server
2. **Export a function** - `module.exports = async function(req, res) {...}`
3. **web.config is required** - Tells IIS how to handle Node.js
4. **.next folder is critical** - Must be uploaded and complete
5. **Environment variables** - Set in Plesk or web.config

---

## ✅ Checklist

- [ ] `server.js` updated for IISNode (exports handler function)
- [ ] `web.config` created in root directory
- [ ] `.next` folder uploaded and complete
- [ ] Dependencies installed (`npm install --production`)
- [ ] Application pool restarted
- [ ] IISNode installed on server
- [ ] Node.js 18+ installed on server

---

**Your Next.js app should now work correctly with IISNode! 🎉**

