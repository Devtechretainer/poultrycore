# Poultry Core

A complete farm inventory management system built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

### Authentication
- **Login** - User authentication with remember me functionality
- **Registration** - New user account creation with farm details
- **Forgot Password** - Email-based password reset with OTP
- **Reset Password** - Secure password reset with token verification
- **User Profile** - View and edit user profile information

### Inventory Management
- **Production Records** - Track daily bird counts, mortality, feed, medication, and egg production
- **Customer Management** - Maintain customer database with contact information
- **Egg Production Tracking** - Record daily egg counts and broken eggs by flock
- **Feed Usage Tracking** - Monitor feed consumption by type and quantity

## API Integration

The application integrates with a backend API at `https://localhost:7010` with the following endpoints:

### Authentication
- `POST /api/Authentication/Register` - Create new user account
- `POST /api/Authentication/login` - Authenticate user
- `POST /api/Authentication/ForgotPassword` - Request password reset code
- `POST /api/Authentication/ResetPassword` - Reset password with token

### User Profile
- `GET /api/UserProfile/findByUserName` - Get user profile by username
- `POST /api/UserProfile/create` - Create user profile
- `POST /api/UserProfile/update` - Update user profile
- `DELETE /api/UserProfile/{id}` - Delete user profile

### Production Records
- `GET /api/ProductionRecord` - Get all production records
- `POST /api/ProductionRecord` - Create production record
- `GET /api/ProductionRecord/{id}` - Get production record by ID
- `PUT /api/ProductionRecord/{id}` - Update production record
- `DELETE /api/ProductionRecord/{id}` - Delete production record

### Customers
- `GET /api/Customer` - Get all customers
- `POST /api/Customer` - Create customer
- `GET /api/Customer/{id}` - Get customer by ID
- `PUT /api/Customer/{id}` - Update customer
- `DELETE /api/Customer/{id}` - Delete customer

### Egg Production
- `GET /api/EggProduction` - Get all egg production records
- `POST /api/EggProduction` - Create egg production record
- `GET /api/EggProduction/{id}` - Get egg production record by ID
- `PUT /api/EggProduction/{id}` - Update egg production record
- `DELETE /api/EggProduction/{id}` - Delete egg production record

### Feed Usage
- `GET /api/FeedUsage` - Get all feed usage records
- `POST /api/FeedUsage` - Create feed usage record
- `GET /api/FeedUsage/{id}` - Get feed usage record by ID
- `PUT /api/FeedUsage/{id}` - Update feed usage record
- `DELETE /api/FeedUsage/{id}` - Delete feed usage record

## Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
NEXT_PUBLIC_API_BASE_URL=https://localhost:7010
\`\`\`

**Note**: The base URL should NOT include `/api` or any endpoint paths. Each API module adds its own path.

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables (copy `.env.local.example` to `.env.local`)

3. Make sure your backend API is running on `https://localhost:7010`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Pages

### Authentication
- `/` - Landing page (redirects to login)
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Forgot password page
- `/reset-password` - Reset password page

### Dashboard & Profile
- `/dashboard` - Main dashboard with navigation to all modules
- `/profile` - User profile page

### Inventory Management
- `/production-records` - List all production records
- `/production-records/new` - Create new production record
- `/production-records/[id]` - Edit production record
- `/customers` - List all customers
- `/customers/new` - Create new customer
- `/customers/[id]` - Edit customer
- `/egg-production` - List all egg production records
- `/egg-production/new` - Create new egg production record
- `/egg-production/[id]` - Edit egg production record
- `/feed-usage` - List all feed usage records
- `/feed-usage/new` - Create new feed usage record
- `/feed-usage/[id]` - Edit feed usage record

## Design

The UI follows the provided design specifications with:
- Colorful cube logo (blue, yellow, red)
- Clean white cards on light gradient background
- Blue accent color (#0066FF)
- Consistent spacing and typography
- Responsive design for all screen sizes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Troubleshooting

### CORS Errors
If you encounter CORS errors, make sure your backend API is configured to allow requests from `http://localhost:3000`.

### SSL Certificate Errors
If using `https://localhost:7010`, you may need to:
1. Accept the self-signed certificate in your browser
2. Or configure your backend to use HTTP instead: `http://localhost:7010`

### "User context not found" Error
This error occurs when userId or farmId is not stored after login. Make sure:
1. You're logging in successfully
2. The login response includes `userId` and `farmId` in the `response` object
3. Check browser console for storage logs

### API Endpoint Not Found
If you see "Page not found" errors:
1. Verify your backend API is running
2. Check that `NEXT_PUBLIC_API_BASE_URL` is set correctly (should be `https://localhost:7010` without `/api`)
3. Verify the endpoint exists in your backend API
