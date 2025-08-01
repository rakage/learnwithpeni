# Admin Setup Guide

## Overview

This guide explains how to set up and test the admin functionality in your LMS application.

## Authentication System

The admin system uses role-based access control with the following flow:

1. **Client-side**: AuthGuard protects admin routes
2. **Server-side**: API routes check user session and role from database
3. **Database**: User roles stored in `users.role` field (`STUDENT` | `ADMIN`)

## Setup Steps

### 1. Database Setup

Make sure your database is up to date with the latest schema:

```bash
npx prisma db push
```

### 2. Create Admin User

First, create a regular user account by signing up normally, then promote them to admin.

#### Option A: Using the Script (Recommended)

```bash
node scripts/make-admin.js your-email@example.com
```

#### Option B: Direct Database Update

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

#### Option C: Using Prisma Studio

```bash
npx prisma studio
```

Then:

1. Open the `users` table
2. Find your user record
3. Change `role` from `STUDENT` to `ADMIN`
4. Save changes

### 3. Test Admin Access

1. **Sign in** with your admin account
2. **Navigate to** `/admin` or `/admin/courses`
3. **Verify** you can access admin features:
   - Course creation
   - Course management
   - Admin dashboard

## API Endpoints

### Authentication Endpoints

- `GET /api/admin/check` - Check if user has admin privileges
- `GET /api/admin/courses` - List all courses (admin only)
- `POST /api/admin/courses` - Create new course (admin only)

### Authentication Flow

```typescript
// Client-side auth check
const response = await fetch("/api/admin/check");
if (!response.ok) {
  // Redirect to dashboard or show error
}

// Server-side auth helper
import { checkAdminAuth } from "@/lib/auth-helpers";

const { error, user } = await checkAdminAuth();
if (error) return error; // Returns appropriate error response
```

## File Structure

```
lib/
├── auth-helpers.ts          # Server-side auth utilities
└── supabase.ts             # Supabase client

app/
├── admin/
│   ├── page.tsx            # Admin dashboard
│   └── courses/
│       ├── page.tsx        # Course management
│       └── create/
│           └── page.tsx    # Course creation
└── api/
    └── admin/
        ├── check/
        │   └── route.ts    # Admin privilege check
        └── courses/
            └── route.ts    # Course CRUD operations

components/
└── AuthGuard.tsx           # Client-side route protection

scripts/
└── make-admin.js           # Admin promotion script
```

## Security Features

### Client-Side Protection

- `AuthGuard` component protects admin routes
- Dynamic navigation based on user role
- Automatic redirects for unauthorized access

### Server-Side Protection

- Session validation using Supabase auth helpers
- Database role checking for each request
- Proper error responses for unauthorized access

### Database Security

- Row Level Security (RLS) policies in Supabase
- Role-based access control in application logic
- Secure session management

## Troubleshooting

### Common Issues

**1. "Unauthorized" Error**

```
Error: Unauthorized (401)
```

**Solution**: User is not signed in. Check authentication status.

**2. "Admin access required" Error**

```
Error: Admin access required (403)
```

**Solution**: User doesn't have admin role. Run the admin promotion script.

**3. "Auth session missing" Error**

```
AuthSessionMissingError: Auth session missing!
```

**Solution**: This was the original issue - fixed by using proper server-side auth helpers.

### Debug Steps

1. **Check user authentication**:

   ```javascript
   const {
     data: { user },
   } = await supabase.auth.getUser();
   console.log("User:", user);
   ```

2. **Check user role in database**:

   ```sql
   SELECT id, email, name, role FROM users WHERE email = 'your-email@example.com';
   ```

3. **Test API endpoint directly**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/admin/check
   ```

## Development vs Production

### Development

- Any authenticated user can be promoted to admin using the script
- Console logging enabled for debugging
- Mock data used in some admin features

### Production Considerations

- Implement proper admin invitation system
- Add audit logging for admin actions
- Restrict admin promotion to super admins only
- Enable database backups before admin operations

## Next Steps

1. **Create your first course** using `/admin/courses/create`
2. **Set up Supabase Storage** using `supabase-storage-setup.sql`
3. **Configure payment system** for course enrollments
4. **Test end-to-end workflow** from signup to course access

## Admin Features Available

- ✅ **Course Creation**: Full CRUD operations with file uploads
- ✅ **Course Management**: View, edit, delete courses
- ✅ **Admin Dashboard**: Statistics and overview
- ✅ **Role-based Access**: Secure admin-only features
- ✅ **File Upload**: Self-hosted videos and documents
- 🔄 **User Management**: Basic view (can be extended)
- 🔄 **Analytics**: Basic stats (can be expanded)
- 🔄 **Settings**: System configuration (future feature)

Ready to start creating courses! 🚀
