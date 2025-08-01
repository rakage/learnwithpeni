# Bearer Token Authentication Setup Guide

## Overview

We've replaced the problematic cookie-based authentication with a robust Bearer token system that stores the Supabase access token in localStorage and sends it via Authorization headers.

## How It Works

### 1. Token Storage

- **Client-side**: Access tokens are stored in `localStorage`
- **Server-side**: Tokens are read from `Authorization: Bearer <token>` headers
- **Automatic management**: Tokens are refreshed automatically when needed

### 2. Authentication Flow

```
1. User signs in → Supabase returns session with access_token
2. AuthClient stores token in localStorage
3. API calls automatically include Authorization header
4. Server validates token with Supabase
5. If token expires, client refreshes automatically
```

## Setup Steps

### 1. Install Dependencies

The required packages should already be installed:

```bash
npm install @supabase/auth-helpers-nextjs
```

### 2. Initialize Auth System

The `AuthInitializer` component is automatically loaded in the root layout to:

- Store fresh tokens when users sign in
- Listen for auth state changes
- Remove tokens when users sign out

### 3. Create Admin User

Use the admin promotion script:

```bash
node scripts/make-admin.js your-email@example.com
```

### 4. Test the System

Visit `/test-auth` while logged in to test both authentication methods:

- Cookie-based (legacy)
- Bearer token (new system)
- Admin access validation

## API Usage

### Client-Side (Components)

```typescript
import { apiGet, apiPost, AuthClient } from "@/lib/auth-client";

// GET request with automatic authentication
const response = await apiGet("/api/admin/courses");

// POST request with automatic authentication
const response = await apiPost("/api/admin/courses", courseData);

// Manual token management
const token = AuthClient.getToken();
await AuthClient.refreshToken();
```

### Server-Side (API Routes)

```typescript
import { checkAdminAuth } from "@/lib/auth-helpers";

export async function GET() {
  const { error, user } = await checkAdminAuth();
  if (error) return error;

  // User is authenticated and has admin role
  // Proceed with admin operations
}
```

## File Structure

```
lib/
├── auth-client.ts       # Client-side token management
├── auth-helpers.ts      # Server-side authentication
└── supabase.ts         # Supabase client

components/
└── AuthInitializer.tsx  # Auto-initializes auth system

app/
├── layout.tsx          # Includes AuthInitializer
├── test-auth/          # Authentication testing page
└── api/
    ├── debug/auth/     # Debug endpoint
    └── admin/          # Protected admin routes
```

## Key Components

### AuthClient Class

- `setToken(token)` - Store token in localStorage
- `getToken()` - Retrieve current token
- `refreshToken()` - Get fresh token from Supabase
- `authenticatedFetch()` - Make authenticated requests
- `initialize()` - Set up auth listeners

### Authentication Helpers

- `checkAdminAuth()` - Validate admin access (server-side)
- `checkUserAuth()` - Validate user access (server-side)

## Advantages Over Cookies

### ✅ **Reliability**

- No cookie transmission issues
- Works in all deployment environments
- Consistent behavior across browsers

### ✅ **Debugging**

- Easy to inspect tokens in localStorage
- Clear error messages in console
- Detailed logging for troubleshooting

### ✅ **Flexibility**

- Manual token refresh when needed
- Fallback to cookie auth if available
- Works with any HTTP client

### ✅ **Performance**

- Tokens cached in memory after first load
- Automatic retry on token expiration
- No unnecessary API calls

## Security Considerations

### Token Storage

- Stored in localStorage (accessible to JavaScript)
- Consider httpOnly cookies for higher security in production
- Tokens have limited lifespan and auto-refresh

### HTTPS Required

- Always use HTTPS in production
- Tokens transmitted in Authorization headers
- Supabase handles token validation

### Token Refresh

- Automatic refresh on 401 responses
- Falls back to Supabase session if available
- Graceful handling of expired tokens

## Testing the System

### 1. Manual Testing

Visit `/test-auth` and test all buttons:

- **Test Cookie Auth** - Traditional cookie method
- **Test Bearer Auth** - New token method
- **Test Admin Access** - Verify admin permissions
- **Show Current Token** - Inspect stored token
- **Refresh Token** - Get fresh token

### 2. Browser Debug

Check localStorage for the token:

```javascript
// In browser console
localStorage.getItem("supabase_access_token");
```

### 3. Network Inspection

Check Network tab in DevTools:

- API calls should include `Authorization: Bearer <token>`
- Look for 401 responses followed by retries

## Migration from Cookie System

### What Changed

- ✅ **Client-side**: Automatic token management
- ✅ **Server-side**: Priority on Bearer token validation
- ✅ **Fallback**: Cookie auth still works as backup
- ✅ **Compatibility**: Existing components work without changes

### Updated Components

- ✅ Admin dashboard (`/admin`)
- ✅ Course creation (`/admin/courses/create`)
- ✅ Course management (`/admin/courses`)
- ✅ All API routes in `/api/admin/*`

## Troubleshooting

### Common Issues

**1. Token Not Stored**

```
Problem: No token in localStorage
Solution: Check if user is properly signed in
Debug: Visit /test-auth and click "Check Session"
```

**2. 401 Unauthorized**

```
Problem: Token invalid or expired
Solution: Token should auto-refresh
Debug: Check console for refresh attempts
```

**3. Admin Access Denied**

```
Problem: User role is not ADMIN
Solution: Run admin promotion script
Debug: Check database user.role field
```

### Debug Commands

```javascript
// Check current authentication state
const {
  data: { session },
} = await supabase.auth.getSession();
console.log("Session:", session);

// Check stored token
const token = AuthClient.getToken();
console.log("Stored token:", token?.substring(0, 50));

// Test API call
const response = await apiGet("/api/admin/check");
console.log("Admin check:", await response.json());
```

## Production Deployment

### Environment Variables

Ensure all Supabase variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Security Headers

Consider adding security headers:

```javascript
// next.config.js
module.exports = {
  headers: [
    {
      source: "/api/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    },
  ],
};
```

### Monitoring

Add logging for token usage:

- Token refresh frequency
- Authentication failures
- Admin access attempts

## Next Steps

1. **Test the system** at `/test-auth`
2. **Promote yourself to admin** using the script
3. **Try creating a course** at `/admin/courses/create`
4. **Monitor console logs** for authentication flow
5. **Deploy with confidence** - no more session issues!

The Bearer token system provides reliable, debuggable authentication that works consistently across all environments. 🚀
