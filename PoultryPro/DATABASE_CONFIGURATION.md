# Database Configuration Guide

## Production Database

**Database Server:** `195.250.26.22`  
**Database Name:** `poultry2_Prod`  
**Database User:** `poultry2_ProdUser`  
**Password:** `Techretainer@77`

### Connection Strings

#### PoultryFarmAPI
```json
"ConnectionStrings": {
  "PoultryConn": "Server=195.250.26.22;Database=poultry2_Prod;User Id=poultry2_ProdUser;Password=Techretainer@77;MultipleActiveResultSets=true;Encrypt=True;TrustServerCertificate=True;"
}
```

#### User Management API (LoginAPI)
```json
"ConnectionStrings": {
  "ConnStr": "Server=195.250.26.22;Database=poultry2_Prod;User Id=poultry2_ProdUser;Password=Techretainer@77;MultipleActiveResultSets=true;Encrypt=True;TrustServerCertificate=True;"
}
```

## ⚠️ Important Security Notice

**DO NOT use the production database for development or testing!**

### Best Practices:

1. **Separate Databases:**
   - **Production:** `poultry2_Prod` - Only for live/production environment
   - **Development:** `poultry2_Dev` - For local development
   - **Testing/Staging:** `poultry2_Test` - For testing before production

2. **Separate Database Users:**
   - Production user should have **read/write** access only
   - Development users should have **full access** for testing
   - Use different passwords for each environment

3. **Connection String Management:**
   - Production: `appsettings.Production.json` (deployed to server)
   - Development: `appsettings.Development.json` (local only)
   - Never commit production passwords to source control

4. **Access Control:**
   - Limit production database access to authorized personnel only
   - Use firewall rules to restrict remote access
   - Enable SQL Server audit logging for production

## Current Configuration Files

- ✅ `PoultryFarmAPI/appsettings.Production.json` - Updated with production credentials
- ✅ `LoginAPI/User.Management.API/appsettings.Production.json` - Updated with production credentials

## Next Steps

1. **Create Development Database:**
   - Create `poultry2_Dev` database
   - Create `poultry2_DevUser` with appropriate permissions
   - Update `appsettings.Development.json` files

2. **Update Development Connection Strings:**
   - Use local or development server
   - Use development database credentials

3. **Deploy Updated Production Settings:**
   - Rebuild and publish APIs with updated connection strings
   - Deploy to Plesk server
   - Test connection to production database

## Testing Production Connection

After deployment, verify the connection:
1. Check application logs for connection errors
2. Test login endpoint: `POST /api/Authentication/login`
3. Verify database queries are working

---

**Last Updated:** 2025-12-18  
**Database:** `poultry2_Prod`  
**User:** `poultry2_ProdUser`

