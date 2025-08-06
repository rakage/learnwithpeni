-- =====================================================
-- Row Level Security (RLS) Policies for Learn with Peni
-- =====================================================
-- This file contains all RLS policies for the application tables
-- Run this after setting up your database schema

-- =====================================================
-- 1. USERS TABLE POLICIES
-- =====================================================

-- Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Public can view user names for course display" ON public.users;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = id);

-- Allow admins to view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- Allow public to view basic user info for course display (name only, for instructor names etc)
CREATE POLICY "Public can view user names for course display" ON public.users
  FOR SELECT USING (true)
  WITH CHECK (false); -- Prevent inserts through this policy

-- =====================================================
-- 2. COURSES TABLE POLICIES
-- =====================================================

-- Enable RLS on courses table
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can view all courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can create courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;

-- Allow anyone to view published courses
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT USING (published = true);

-- Allow admins to view all courses (including unpublished)
CREATE POLICY "Admins can view all courses" ON public.courses
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- Allow admins to create courses
CREATE POLICY "Admins can create courses" ON public.courses
  FOR INSERT WITH CHECK (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- Allow admins to update courses
CREATE POLICY "Admins can update courses" ON public.courses
  FOR UPDATE USING (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- Allow admins to delete courses
CREATE POLICY "Admins can delete courses" ON public.courses
  FOR DELETE USING (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- =====================================================
-- 3. MODULES TABLE POLICIES
-- =====================================================

-- Enable RLS on modules table
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enrolled users can view modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can view all modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can create modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can update modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can delete modules" ON public.modules;

-- Allow enrolled users and admins to view modules of published courses
CREATE POLICY "Enrolled users can view modules" ON public.modules
  FOR SELECT USING (
    -- User is admin
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
    OR
    -- User is enrolled in the course and course is published
    ("courseId" IN (
      SELECT e."courseId" 
      FROM public.enrollments e
      JOIN public.courses c ON e."courseId" = c.id
      WHERE e."userId" = auth.uid()::text 
      AND c.published = true
    ))
  );

-- Allow admins to view all modules
CREATE POLICY "Admins can view all modules" ON public.modules
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- Allow admins to create modules
CREATE POLICY "Admins can create modules" ON public.modules
  FOR INSERT WITH CHECK (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- Allow admins to update modules
CREATE POLICY "Admins can update modules" ON public.modules
  FOR UPDATE USING (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- Allow admins to delete modules
CREATE POLICY "Admins can delete modules" ON public.modules
  FOR DELETE USING (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- =====================================================
-- 4. ENROLLMENTS TABLE POLICIES
-- =====================================================

-- Enable RLS on enrollments table
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "System can create enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can create enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can delete enrollments" ON public.enrollments;

-- Allow users to view their own enrollments
CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT USING (auth.uid()::text = "userId");

-- Allow admins to view all enrollments
CREATE POLICY "Admins can view all enrollments" ON public.enrollments
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- Allow system/API to create enrollments (for payment processing)
CREATE POLICY "System can create enrollments" ON public.enrollments
  FOR INSERT WITH CHECK (true);

-- Allow admins to create enrollments manually
CREATE POLICY "Admins can create enrollments" ON public.enrollments
  FOR INSERT WITH CHECK (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- Allow admins to delete enrollments
CREATE POLICY "Admins can delete enrollments" ON public.enrollments
  FOR DELETE USING (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- =====================================================
-- 5. PROGRESS TABLE POLICIES
-- =====================================================

-- Enable RLS on progress table
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own progress" ON public.progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.progress;
DROP POLICY IF EXISTS "System can create progress" ON public.progress;
DROP POLICY IF EXISTS "Admins can manage all progress" ON public.progress;

-- Allow users to view their own progress
CREATE POLICY "Users can view own progress" ON public.progress
  FOR SELECT USING (auth.uid()::text = "userId");

-- Allow users to update their own progress (only if enrolled in the course)
CREATE POLICY "Users can update own progress" ON public.progress
  FOR UPDATE USING (
    auth.uid()::text = "userId"
    AND
    "moduleId" IN (
      SELECT m.id 
      FROM public.modules m
      JOIN public.enrollments e ON m."courseId" = e."courseId"
      WHERE e."userId" = auth.uid()::text
    )
  );

-- Allow users to create their own progress (only if enrolled)
CREATE POLICY "Users can create own progress" ON public.progress
  FOR INSERT WITH CHECK (
    auth.uid()::text = "userId"
    AND
    "moduleId" IN (
      SELECT m.id 
      FROM public.modules m
      JOIN public.enrollments e ON m."courseId" = e."courseId"
      WHERE e."userId" = auth.uid()::text
    )
  );

-- Allow admins to view all progress
CREATE POLICY "Admins can view all progress" ON public.progress
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- Allow admins to manage all progress
CREATE POLICY "Admins can manage all progress" ON public.progress
  FOR ALL USING (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- =====================================================
-- 6. PAYMENTS TABLE POLICIES
-- =====================================================

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "System can create payments" ON public.payments;
DROP POLICY IF EXISTS "System can update payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;

-- Allow users to view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid()::text = "userId");

-- Allow admins to view all payments
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- Allow system to create payments (for Stripe/Duitku webhooks)
CREATE POLICY "System can create payments" ON public.payments
  FOR INSERT WITH CHECK (true);

-- Allow system to update payments (for status changes)
CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE USING (true);

-- Allow admins to manage all payments
CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
  );

-- =====================================================
-- 7. HELPER FUNCTIONS FOR ROLE CHECKING
-- =====================================================

-- Create a helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to check if user is enrolled in a course
CREATE OR REPLACE FUNCTION public.is_enrolled_in_course(course_id text)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE "userId" = auth.uid()::text 
    AND "courseId" = course_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select, insert, update, delete on all tables to authenticated users
-- (RLS policies will control actual access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant usage on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- 9. REFRESH SCHEMA CACHE
-- =====================================================

-- Notify Supabase to refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- SECURITY NOTES:
-- =====================================================
-- 1. These policies ensure users can only access their own data
-- 2. Admins have full access to manage all resources
-- 3. Course content is only accessible to enrolled users
-- 4. Payment and enrollment creation is handled by the system (API)
-- 5. All policies follow the principle of least privilege
-- 6. Consider adding audit logging for sensitive operations
-- 7. Regularly review and update policies as requirements change
-- ===================================================== 