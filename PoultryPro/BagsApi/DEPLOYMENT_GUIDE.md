# BagsApi Deployment Guide

## Overview
BagsApi has been configured to use the production database (`poultry2_Prod`) and is ready for deployment to Plesk.

## Database Setup

### Step 1: Create Database Tables
Before deploying the API, you need to create the database tables. Run the SQL script:

**File:** `BagsApi/Database/CreateTables.sql`

**Connection Details:**
- Server: `195.250.26.22`
- Database: `poultry2_Prod`
- User: `poultry2_ProdUser`
- Password: `Techretainer@77`

**To execute:**
1. Connect to SQL Server Management Studio (SSMS)
2. Connect to server `195.250.26.22`
3. Open the file `BagsApi/Database/CreateTables.sql`
4. Execute the script

**Tables Created:**
- `Products` - Product catalog
- `Orders` - Customer orders
- `BlogPosts` - Blog posts

## Build and Publish

The API has been built and published to: `.\publish\BagsApi\`

### Published Files Include:
- `BagsApi.exe` - Main executable
- `web.config` - IIS/Plesk configuration
- `appsettings.Production.json` - Production configuration
- All required DLLs and dependencies
- `logs/` directory - For application logs

## Plesk Deployment

### Step 1: Upload Files
1. Log into Plesk
2. Navigate to your domain/subdomain
3. Upload all files from `.\publish\BagsApi\` to the domain's `httpdocs` directory

### Step 2: Configure Application Pool
1. In Plesk, go to **Websites & Domains** > **ASP.NET Settings**
2. Ensure **ASP.NET Core** is enabled
3. Set **Application Pool** to use **.NET 8.0** or **Integrated Pipeline**

### Step 3: Set Environment Variable
1. In Plesk, go to **Websites & Domains** > **ASP.NET Settings**
2. Set **ASPNETCORE_ENVIRONMENT** to `Production`

### Step 4: Configure Connection String
The connection string is already configured in `appsettings.Production.json`:
```json
"ConnectionStrings": {
  "BagsConn": "Server=195.250.26.22;Database=poultry2_Prod;User Id=poultry2_ProdUser;Password=Techretainer@77;MultipleActiveResultSets=true;Encrypt=True;TrustServerCertificate=True;"
}
```

### Step 5: Set Permissions
1. Ensure the `logs` directory has write permissions for the application pool user
2. In Plesk, go to **File Manager** > Right-click `logs` folder > **Change Permissions**
3. Set appropriate write permissions

### Step 6: Test the API
1. Navigate to `https://yourdomain.com/` - Should return "BagsApi is running"
2. Navigate to `https://yourdomain.com/swagger` - Should show Swagger UI
3. Test API endpoints

## Configuration

### Production Settings
- **Database:** `poultry2_Prod`
- **Server:** `195.250.26.22`
- **Frontend URL:** `https://poultrymaster.com`
- **Allowed Origins:**
  - `https://poultrymaster.com`
  - `https://farmarchive.poultrycore.com`

### API Endpoints
- **Products:** `/api/Products`
- **Orders:** `/api/Orders`
- **Blog Posts:** `/api/BlogPosts`
- **Swagger UI:** `/swagger`

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify the SQL script was executed successfully
   - Check connection string in `appsettings.Production.json`
   - Verify database user has proper permissions

2. **500 Internal Server Error**
   - Check `logs/stdout` file for error details
   - Verify `web.config` is present
   - Check application pool is running

3. **CORS Errors**
   - Verify `AllowedOrigins` in `appsettings.Production.json`
   - Check frontend URL matches configured origins

4. **Entity Framework Errors**
   - Ensure database tables exist
   - Verify connection string is correct
   - Check Entity Framework packages are included in publish

## Next Steps

1. ✅ Create database tables (run SQL script)
2. ✅ Build and publish API
3. ⏳ Upload to Plesk
4. ⏳ Configure application pool
5. ⏳ Test API endpoints
6. ⏳ Monitor logs for errors

## Support

For issues or questions, check:
- Application logs: `logs/stdout`
- Plesk error logs
- Database connection status

