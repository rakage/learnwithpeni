-- ============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================
-- This fixes the circular dependency in users table RLS policies
-- that was causing infinite recursion errors

-- Step 1: Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Teachers can view their students" ON public.users;

-- Step 2: Create a simpler policy without circular dependencies
-- Teachers can only see themselves directly, not through enrollment lookups
-- (Teacher-student relationships will be handled via API routes using service role)
CREATE POLICY "Teachers can view themselves"
ON public.users FOR SELECT
TO authenticated
USING (
  id = auth.uid()::text
  AND role = 'TEACHER'
);

-- Step 3: Ensure basic user self-access policy exists
-- (This allows any authenticated user to view their own profile)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

-- Step 4: Admin policy for viewing all users
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
TO authenticated
USING (
  auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

-- Step 5: Update users (self-update only)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- ============================================
-- NOTES:
-- ============================================
-- 1. The problematic "Teachers can view their students" policy has been removed
-- 2. Teachers now only have direct self-access to their profile
-- 3. Teacher-student viewing is handled via API routes (/api/teacher/students)
--    which use Prisma with proper authentication, not RLS
-- 4. This prevents circular dependencies while maintaining security
-- 5. API routes use service role credentials to bypass RLS when needed

-- ============================================
-- VERIFICATION:
-- ============================================
-- Run this to check current policies on users table:
-- SELECT * FROM pg_policies WHERE tablename = 'users';
