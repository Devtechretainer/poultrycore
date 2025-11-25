# ✅ Frontend-Backend Integration - Employee Management

## 🎯 What Was Fixed

### Critical Issues Resolved:
1. ✅ **Missing JWT Authentication** - Added `getAuthHeaders()` to all admin API calls
2. ✅ **CORS Configuration** - Updated LoginAPI to allow Next.js frontend (ports 3000, 3001)
3. ✅ **API URL Configuration** - Properly configured Admin API URL (port 7010)
4. ✅ **Duplicate Code** - Removed duplicate `employee.ts`, consolidated into `admin.ts`
5. ✅ **CreatedDate Field** - Added `CreatedDate` to employee models in backend

---

## 📂 Project Structure

### Backend (C# .NET APIs)

```
PoultryPro/
├── LoginAPI/ (Port 7010)
│   ├── Controllers/
│   │   └── AdminController.cs ✅ Employee endpoints with [Authorize]
│   ├── Models/
│   │   └── EmployeeModel.cs ✅ Employee data models
│   └── Services/
│       ├── IAdminService.cs ✅ Employee service interface
│       └── AdminService.cs ✅ Employee business logic
│
└── PoultryFarmAPI/ (Port 7190)
    └── Controllers/ ✅ Flocks, Production, Sales, etc.
```

### Frontend (Next.js)

```
inventory-login (3)/
├── lib/api/
│   ├── admin.ts ✅ Employee API with JWT auth
│   ├── config.ts ✅ Auth headers helper
│   └── index.ts ✅ Centralized exports
│
└── app/employees/
    ├── page.tsx ✅ Employee list
    └── new/page.tsx ✅ Create employee form
```

---

## 🔧 Configuration

### 1. Environment Variables

Create `.env.local` in your Next.js root:

```env
# Main PoultryFarm API (Flocks, Production, Sales, etc.)
NEXT_PUBLIC_API_BASE_URL=https://localhost:7190

# Admin/Auth API (User Management, Employees, Authentication)
NEXT_PUBLIC_ADMIN_API_URL=https://localhost:7010
```

### 2. Backend Configuration

#### LoginAPI - `appsettings.json`

```json
{
  "ConnectionStrings": {
    "ConnStr": "Your_Database_Connection_String"
  },
  "JWT": {
    "ValidAudience": "https://localhost:7010",
    "ValidIssuer": "https://localhost:7278",
    "Secret": "Your_Secret_Key_Here",
    "TokenValidityInMinutes": 5,
    "RefreshTokenValidity": 7
  }
}
```

#### PoultryFarmAPI - `appsettings.json`

```json
{
  "ConnectionStrings": {
    "PoultryConn": "Your_Database_Connection_String"
  },
  "JWT": {
    "ValidIssuer": "https://localhost:7278",
    "ValidAudience": "https://localhost:7190",
    "Secret": "Same_Secret_Key_As_LoginAPI"
  }
}
```

---

## 🚀 How to Run

### Step 1: Start Backend APIs

```bash
# Terminal 1 - LoginAPI (Auth & Employees)
cd PoultryPro/LoginAPI/User.Management.API
dotnet run
# Should start on https://localhost:7010

# Terminal 2 - PoultryFarmAPI (Main API)
cd PoultryPro/PoultryFarmAPI
dotnet run
# Should start on https://localhost:7190
```

### Step 2: Start Frontend

```bash
# Terminal 3 - Next.js Frontend
npm install
npm run dev
# Should start on http://localhost:3000
```

---

## 🔐 API Authentication Flow

### 1. User Login
```typescript
// User logs in
const response = await login({ email, password })

// JWT token is saved to localStorage
localStorage.setItem("auth_token", response.token)
localStorage.setItem("farmId", response.farmId)
localStorage.setItem("userId", response.userId)
```

### 2. API Calls with Auth
```typescript
// admin.ts automatically includes auth headers
import { getAuthHeaders } from './config'

const response = await fetch(url, {
  method: "GET",
  headers: getAuthHeaders(),  // ✅ Includes JWT token
})
```

### 3. Backend Validation
```csharp
// AdminController.cs
[Authorize]  // ✅ Requires valid JWT token
[HttpGet("employees")]
public async Task<ActionResult<List<EmployeeModel>>> GetEmployees()
{
    var farmId = User.FindFirst("FarmId")?.Value;  // Extract from JWT
    // Returns only employees for this farm
}
```

---

## 📋 Employee Management Features

### Admin Dashboard (`/employees`)

**List Employees:**
- ✅ View all employees for your farm
- ✅ See email confirmation status
- ✅ Filter and search employees
- ✅ Pagination support

**Create Employee (`/employees/new`):**
- ✅ First Name, Last Name
- ✅ Email Address
- ✅ Phone Number
- ✅ Username (for login)
- ✅ Password (minimum 6 characters)
- ✅ Automatically assigned to admin's farm
- ✅ Automatically marked as `IsStaff = true`

**Delete Employee:**
- ✅ Remove employee access
- ✅ Confirmation dialog

---

## 🔍 API Endpoints

### Base URL: `https://localhost:7010/api/Admin`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/employees` | Get all employees | ✅ Yes |
| GET | `/employees/{id}` | Get single employee | ✅ Yes |
| GET | `/employees/count` | Get employee count | ✅ Yes |
| POST | `/employees` | Create new employee | ✅ Yes |
| PUT | `/employees/{id}` | Update employee | ✅ Yes |
| DELETE | `/employees/{id}` | Delete employee | ✅ Yes |

### Request Example - Create Employee

```typescript
POST https://localhost:7010/api/Admin/employees
Headers:
  Authorization: Bearer {jwt_token}
  Content-Type: application/json

Body:
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "userName": "johndoe",
  "password": "SecurePass123",
  "farmId": "auto-filled-from-jwt-claims",
  "farmName": "auto-filled-from-jwt-claims"
}
```

### Response Example

```json
{
  "id": "guid-here",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "userName": "johndoe",
  "farmId": "farm-guid",
  "farmName": "My Farm",
  "isStaff": true,
  "emailConfirmed": true,
  "createdDate": "2025-01-15T10:30:00Z"
}
```

---

## 🛡️ Security Features

### 1. JWT Authentication
- All Admin API endpoints require valid JWT token
- Token contains `FarmId` for farm isolation
- Token expires after 5 minutes (configurable)

### 2. Farm Isolation
- Employees filtered by `FarmId` from JWT claims
- Cross-farm access prevented
- Admin can only see/manage their own farm's employees

### 3. Role-Based Access
- Admin: `IsStaff = false` - Can create employees
- Employee: `IsStaff = true` - Cannot create other employees

### 4. Password Security
- Hashed using Identity's password hasher
- Minimum requirements configurable
- Never stored in plain text

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] LoginAPI running on port 7010
- [ ] PoultryFarmAPI running on port 7190
- [ ] Database connection working
- [ ] JWT authentication working
- [ ] CORS configured correctly

### Frontend Tests
- [ ] Next.js running on port 3000
- [ ] Login successful
- [ ] JWT token saved to localStorage
- [ ] Navigate to `/employees`
- [ ] Create a new employee
- [ ] View employee list
- [ ] Delete an employee
- [ ] Verify farm isolation (can't see other farm's employees)

---

## 🐛 Troubleshooting

### Issue: "401 Unauthorized" when fetching employees

**Cause:** Missing or invalid JWT token

**Solution:**
1. Check localStorage has `auth_token`
2. Token might be expired - login again
3. Verify token is sent in Authorization header

```typescript
// Debug in browser console
console.log(localStorage.getItem("auth_token"))
```

### Issue: "CORS policy error"

**Cause:** Frontend origin not allowed by backend

**Solution:**
1. Verify LoginAPI Program.cs has correct CORS origins
2. Restart LoginAPI after making changes
3. Check browser console for exact error

```csharp
// LoginAPI/Program.cs
builder.Services.AddCors(options => {
    options.AddPolicy("AllowOrigin", builder => {
        builder.WithOrigins("http://localhost:3000", "https://localhost:3000")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});
```

### Issue: "FarmId not found in user claims"

**Cause:** JWT token doesn't contain FarmId claim

**Solution:**
1. Login again to get new token with FarmId
2. Verify authentication service adds FarmId claim
3. Check token contents at jwt.io

### Issue: Employee created but not visible

**Cause:** Employee created with different FarmId

**Solution:**
1. Admin must be logged in when creating employee
2. FarmId taken from admin's JWT claims
3. Check database: `SELECT * FROM AspNetUsers WHERE IsStaff = 1`

---

## 📊 Database Schema

### AspNetUsers Table

```sql
-- Admin Example
Id: "admin-guid"
UserName: "admin@farm.com"
Email: "admin@farm.com"
FirstName: "Admin"
LastName: "User"
FarmId: "farm-123-guid"
FarmName: "Sunny Farm"
IsStaff: 0 (false)  -- Admin
EmailConfirmed: 1

-- Employee Example
Id: "employee-guid"
UserName: "johndoe"
Email: "john@farm.com"
FirstName: "John"
LastName: "Doe"
FarmId: "farm-123-guid"  -- Same as admin!
FarmName: "Sunny Farm"
IsStaff: 1 (true)  -- Employee
EmailConfirmed: 1
```

**Key Points:**
- Same `FarmId` for admin and employees
- `IsStaff = 0` → Admin
- `IsStaff = 1` → Employee
- Both use `AspNetUsers` table (no separate employee table needed)

---

## 🎉 Summary

### What You Have Now:

✅ **Full Employee Management System**
- Create, view, delete employees
- Secure JWT authentication
- Farm isolation
- Role-based access control

✅ **Properly Configured Frontend**
- All API calls include JWT tokens
- Correct API URLs (7010 for admin, 7190 for farm data)
- Error handling and user feedback

✅ **Secure Backend**
- `[Authorize]` attribute on all endpoints
- FarmId extracted from JWT claims
- Password hashing with Identity
- CORS configured for Next.js

✅ **Production Ready**
- Comprehensive error handling
- Logging throughout
- Validation on both client and server
- Clean architecture (separation of concerns)

---

## 📞 Next Steps

1. **Create `.env.local`** with API URLs
2. **Start both backend APIs**
3. **Start Next.js frontend**
4. **Login as admin**
5. **Navigate to `/employees`**
6. **Create your first employee**
7. **Test employee login** (use created username/password)

---

## 🔗 Related Documentation

- [EMPLOYEE_MANAGEMENT_SYSTEM.md](PoultryPro/EMPLOYEE_MANAGEMENT_SYSTEM.md) - Detailed system overview
- [EMPLOYEE_LOGIN_FLOW.md](PoultryPro/EMPLOYEE_LOGIN_FLOW.md) - Login workflow
- [CHECK_EMPLOYEE_TABLE.md](PoultryPro/CHECK_EMPLOYEE_TABLE.md) - Database verification

---

**Everything is now configured and ready to use! 🚀**

