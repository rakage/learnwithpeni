# Authentication Troubleshooting Guide

## Issue: Session is null on server-side but user is logged in on client-side

This is a common issue when using Supabase Auth with Next.js App Router. Here are the most likely causes and solutions:

## Debugging Steps

### 1. Test the Debug Endpoint

First, test the debug endpoint while logged in:

```bash
# In your browser console (while logged in):
fetch('/api/debug/auth').then(r => r.json()).then(console.log)
```

This will show you:

- How many cookies are present
- If Supabase auth cookies exist
- Session and user data status
- Any error messages

### 2. Check Your Environment Setup

Make sure your `.env.local` has the correct Supabase URLs:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Important**: The URLs must match exactly between client and server.

### 3. Verify Middleware is Working

Check your browser's developer tools > Network tab when navigating to admin pages. You should see the middleware logs in your server console.

## Common Causes & Solutions

### 1. Missing Middleware Package

You might need to install the middleware client:

```bash
npm install @supabase/auth-helpers-nextjs
```

### 2. Cookie Configuration Issues

**Solution A**: Update your Supabase client configuration:

```typescript
// lib/supabase.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const supabase = createClientComponentClient();
```

**Solution B**: Check cookie settings in Supabase dashboard:

- Go to Authentication > Settings
- Ensure "Secure" is unchecked for localhost development
- Check Site URL settings

### 3. CORS/Domain Issues

Make sure your Site URL in Supabase includes your development URL:

- `http://localhost:3000`
- Your production domain

### 4. Next.js App Router Configuration

Ensure your `next.config.js` is properly configured:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;
```

### 5. Authentication Flow Issues

**Problem**: User logs in but session cookies aren't set properly.

**Solution**: Update your auth pages to refresh the page after login:

```typescript
// In your login component
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (data.user) {
  // Force a page refresh to ensure cookies are set
  window.location.href = "/dashboard";
  // OR use router.refresh() then router.push()
}
```

### 6. Cookie SameSite Issues

If you're having issues in production, check your cookie settings:

```typescript
// This might be needed for some deployments
const supabase = createRouteHandlerClient({
  cookies,
  cookieOptions: {
    sameSite: "lax", // or 'none' for cross-origin
    secure: process.env.NODE_ENV === "production",
  },
});
```

## Alternative Authentication Method

If cookies continue to be problematic, you can use this alternative approach:

```typescript
// lib/auth-helpers-alternative.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies, headers } from "next/headers";

export async function getServerUser() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Try session first
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      return { user: session.user, error: null };
    }

    // Fallback: try to get user from auth header
    const headersList = headers();
    const authorization = headersList.get("authorization");

    if (authorization?.startsWith("Bearer ")) {
      const token = authorization.substring(7);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      return { user, error };
    }

    return { user: null, error: "No authentication found" };
  } catch (error) {
    return { user: null, error };
  }
}
```

## Testing Steps

1. **Clear all browser data** for localhost
2. **Sign up a new user** and immediately test admin access
3. **Check browser cookies** - you should see Supabase auth cookies
4. **Test the debug endpoint** `/api/debug/auth`
5. **Check server logs** for any error messages

## Manual Cookie Inspection

In browser developer tools > Application > Cookies:

- Look for cookies starting with `sb-` (Supabase auth cookies)
- Verify they have proper values and aren't expired
- Check if they're marked as HttpOnly (they should be)

## Quick Fixes to Try

### Fix 1: Force Page Refresh After Login

```typescript
// After successful login
if (data.user) {
  router.refresh(); // Refresh to update server-side session
  router.push("/dashboard");
}
```

### Fix 2: Use Router Refresh

```typescript
// In your admin page useEffect
useEffect(() => {
  router.refresh(); // This helps sync client/server state
}, []);
```

### Fix 3: Clear and Re-authenticate

```bash
# Clear Next.js cache
rm -rf .next

# Restart development server
npm run dev
```

## If All Else Fails

As a last resort, you can implement token-based authentication:

1. Store the session token in localStorage on login
2. Send it as Authorization header in API calls
3. Validate the token server-side using `supabase.auth.getUser(token)`

Let me know which approach works for your specific setup!

## Next Steps

1. Run the debug endpoint and share the results
2. Check your browser cookies for Supabase auth cookies
3. Verify your environment variables
4. Try the alternative authentication methods above

The most common fix is ensuring the middleware is properly set up and that cookies are being transmitted correctly between client and server.
