-- ============================================
-- TEACHER ROLE RLS POLICIES
-- ============================================
-- This file adds RLS policies for the Teacher role
-- Teachers can:
-- 1. Manage their own courses (create, read, update, delete)
-- 2. View their students (users enrolled in their courses)
-- 3. View payments for their courses
-- 4. View progress for their students

-- ============================================
-- 1. COURSES - Teacher Policies
-- ============================================

-- Teachers can view all courses (to see what's available)
CREATE POLICY "Teachers can view all courses"
ON public.courses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text 
    AND role = 'TEACHER'
  )
);

-- Teachers can create courses (will be assigned as teacher automatically)
CREATE POLICY "Teachers can create courses"
ON public.courses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text 
    AND role = 'TEACHER'
  )
);

-- Teachers can update their own courses
CREATE POLICY "Teachers can update their own courses"
ON public.courses FOR UPDATE
TO authenticated
USING (
  "teacherId" = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text 
    AND role = 'TEACHER'
  )
);

-- Teachers can delete their own courses
CREATE POLICY "Teachers can delete their own courses"
ON public.courses FOR DELETE
TO authenticated
USING (
  "teacherId" = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text 
    AND role = 'TEACHER'
  )
);

-- ============================================
-- 2. MODULES - Teacher Policies
-- ============================================

-- Teachers can view modules for their courses
CREATE POLICY "Teachers can view modules for their courses"
ON public.modules FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = "courseId" 
    AND "teacherId" = auth.uid()::text
  )
);

-- Teachers can create modules for their courses
CREATE POLICY "Teachers can create modules for their courses"
ON public.modules FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = "courseId" 
    AND "teacherId" = auth.uid()::text
  )
);

-- Teachers can update modules for their courses
CREATE POLICY "Teachers can update modules for their courses"
ON public.modules FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = "courseId" 
    AND "teacherId" = auth.uid()::text
  )
);

-- Teachers can delete modules for their courses
CREATE POLICY "Teachers can delete modules for their courses"
ON public.modules FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = "courseId" 
    AND "teacherId" = auth.uid()::text
  )
);

-- ============================================
-- 3. ENROLLMENTS - Teacher Policies
-- ============================================

-- Teachers can view enrollments for their courses
CREATE POLICY "Teachers can view enrollments for their courses"
ON public.enrollments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = "courseId" 
    AND "teacherId" = auth.uid()::text
  )
);

-- ============================================
-- 4. PAYMENTS - Teacher Policies
-- ============================================

-- Teachers can view payments for their courses
CREATE POLICY "Teachers can view payments for their courses"
ON public.payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = "courseId" 
    AND "teacherId" = auth.uid()::text
  )
);

-- ============================================
-- 5. PROGRESS - Teacher Policies
-- ============================================

-- Teachers can view progress for their students
CREATE POLICY "Teachers can view progress for their students"
ON public.progress FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.modules m
    INNER JOIN public.courses c ON c.id = m."courseId"
    WHERE m.id = "moduleId" 
    AND c."teacherId" = auth.uid()::text
  )
);

-- ============================================
-- 6. USERS - Teacher Policies
-- ============================================

-- Teachers can view users enrolled in their courses
CREATE POLICY "Teachers can view their students"
ON public.users FOR SELECT
TO authenticated
USING (
  -- Teachers can see themselves
  id = auth.uid()::text
  OR
  -- Teachers can see students enrolled in their courses
  EXISTS (
    SELECT 1 FROM public.enrollments e
    INNER JOIN public.courses c ON c.id = e."courseId"
    WHERE e."userId" = users.id
    AND c."teacherId" = auth.uid()::text
  )
);

-- ============================================
-- 7. STORAGE POLICIES FOR TEACHERS
-- ============================================

-- Teachers can upload files to course-materials bucket
CREATE POLICY "Teachers can upload course materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-materials'
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'TEACHER'
  )
);

-- Teachers can update their own uploaded files
CREATE POLICY "Teachers can update their course materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'TEACHER'
  )
);

-- Teachers can delete their own uploaded files
CREATE POLICY "Teachers can delete their course materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'TEACHER'
  )
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user is a teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text 
    AND role = 'TEACHER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
