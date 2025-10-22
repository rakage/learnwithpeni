# Quick Fix Steps - Apply These Now! 🚨

## Step 1: Fix RLS Policy (Infinite Recursion Error)

**Go to Supabase Dashboard → SQL Editor → New Query**

Copy and paste this SQL:

```sql
-- Fix infinite recursion by removing circular policy
DROP POLICY IF EXISTS "Teachers can view their students" ON public.users;

-- Create simple policies without circular dependencies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

DROP POLICY IF EXISTS "Teachers can view themselves" ON public.users;
CREATE POLICY "Teachers can view themselves"
ON public.users FOR SELECT
TO authenticated
USING (
  id = auth.uid()::text
  AND role = 'TEACHER'
);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
TO authenticated
USING (
  auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);
```

**Click "Run" ▶️**

## Step 2: Refresh Your Browser

After running the SQL:
1. Go back to your browser
2. Press `Ctrl + Shift + R` (hard refresh)
3. The errors should be gone!

## What Was Fixed

✅ **Fixed requireAuth function** - Added missing function to auth-helpers.ts
✅ **Fixed admin dashboard API** - Now uses correct authentication
✅ **Fixed RLS infinite recursion** - Removed circular policy dependencies

## Verify Everything Works

After applying the fix:

1. **Navigation should load** ✓
2. **Admin dashboard should display** ✓
3. **No infinite recursion errors** ✓
4. **Real data from database shown** ✓

## If You Still See Errors

Try these in order:

### Option 1: Clear Browser Cache
```
Ctrl + Shift + Delete → Clear cache → Reload
```

### Option 2: Check Policies Were Created
```sql
-- Run this in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'users';
```

You should see 4 policies:
- Users can view own profile
- Teachers can view themselves
- Admins can view all users
- Users can update own profile

### Option 3: Restart Dev Server
```bash
# Stop the server (Ctrl + C)
# Start again
npm run dev
```

## What Changed in Code

1. **Added `requireAuth` function** to `lib/auth-helpers.ts`
   - Returns `{ authorized: boolean, user: UserData | null }`
   - Used by all API routes that need authentication

2. **Fixed admin dashboard API** (`app/api/admin/dashboard/route.ts`)
   - Changed from `requireAdmin` (doesn't exist) to `requireAuth`
   - Added manual admin role check

3. **Fixed RLS policies** (via SQL above)
   - Removed circular "Teachers can view their students" policy
   - Added simple, non-circular policies

## Done! 🎉

Your admin dashboard should now work correctly with real data from the database, and all errors should be resolved.

---

**Need more help?** Check `FIX-INFINITE-RECURSION.md` for detailed troubleshooting.
