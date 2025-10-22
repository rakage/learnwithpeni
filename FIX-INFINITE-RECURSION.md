# Fix: Infinite Recursion in RLS Policies

## Problem

You're getting this error:
```
"message": "infinite recursion detected in policy for relation \"users\""
```

This happens because the RLS policy "Teachers can view their students" creates a circular dependency:
1. When fetching user role from `users` table
2. The policy checks `enrollments` table to see if user is a student
3. Which might check `courses` table
4. Which might check `users` table again (for teacherId)
5. Creating an infinite loop ♾️

## Solution

Run the SQL script to fix the policies:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Fix SQL

Copy and paste the entire contents of `supabase-fix-infinite-recursion.sql` into the SQL editor and run it.

The script will:
- ✅ Remove the problematic "Teachers can view their students" policy
- ✅ Create simpler policies without circular dependencies
- ✅ Ensure users can view their own profile
- ✅ Ensure admins can view all users
- ✅ Keep teacher self-access intact

### Step 3: Verify the Fix

After running the SQL, check your policies:

```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

You should see these policies:
- `Users can view own profile` - Basic self-access for all users
- `Teachers can view themselves` - Teacher self-access
- `Admins can view all users` - Admin access to all users
- `Users can update own profile` - User self-update

## How Teacher-Student Viewing Works Now

### Before (Problematic):
- Teacher views student through RLS policy
- Policy queries enrollments → courses → users (circular!)

### After (Fixed):
- Teachers access their students via API routes: `/api/teacher/students`
- API uses Prisma with service authentication (bypasses RLS)
- No circular dependencies
- More efficient and secure

## Why This Fix Works

1. **Removes Circular Dependency**: Teachers can only view themselves directly
2. **API-Based Access**: Teacher-student relationships handled via authenticated API routes
3. **Service Role**: API routes use Prisma which connects with proper credentials
4. **Maintains Security**: Authentication still enforced, just at API level instead of RLS

## Testing

After applying the fix:

1. **Refresh your page** - The error should be gone
2. **Navigation should load** - User role should display correctly
3. **Teacher dashboard should work** - `/teacher/students` page will fetch data via API
4. **Admin panel should work** - `/admin` page should load without errors

## If Error Persists

If you still see the error after running the SQL:

### Option 1: Check for Conflicting Policies
```sql
-- View all policies on users table
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Drop all policies and recreate (nuclear option)
DROP POLICY IF EXISTS "Teachers can view their students" ON public.users;
DROP POLICY IF EXISTS "Teachers can view themselves" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Then run the fix SQL again
```

### Option 2: Temporarily Disable RLS (for debugging only)
```sql
-- ONLY FOR DEBUGGING - DO NOT USE IN PRODUCTION
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test if it works
-- Then re-enable and fix policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

## Summary of Changes

### Removed:
- ❌ `Teachers can view their students` (caused recursion)

### Added/Fixed:
- ✅ `Users can view own profile` (simple self-access)
- ✅ `Teachers can view themselves` (teacher self-access)
- ✅ `Admins can view all users` (admin access)
- ✅ `Users can update own profile` (self-update)

### Architecture Change:
- Teacher-student viewing now handled via `/api/teacher/students` endpoint
- Uses Prisma with proper authentication instead of RLS
- No circular dependencies
- Better performance

## Questions?

If you continue to have issues:
1. Check the browser console for specific errors
2. Check Supabase logs for policy errors
3. Verify all policies were created successfully
4. Make sure the Navigation component is not making multiple simultaneous requests

The fix ensures your app works correctly while maintaining security through API-level authentication! 🚀
