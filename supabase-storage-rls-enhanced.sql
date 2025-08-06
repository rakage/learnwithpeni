-- =====================================================
-- Enhanced Storage RLS Policies for Learn with Peni
-- =====================================================
-- This file enhances the existing storage policies with role-based access control
-- Run this after setting up the basic storage policies

-- =====================================================
-- 1. DROP EXISTING POLICIES (if you want to replace them)
-- =====================================================

-- Uncomment these lines if you want to replace the existing policies
-- DROP POLICY IF EXISTS "Allow authenticated users to upload course content" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated users to update their course content" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated users to delete their course content" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public to view course content" ON storage.objects;

-- =====================================================
-- 2. ENHANCED UPLOAD POLICIES (Admin only)
-- =====================================================

-- Only admins can upload course content
CREATE POLICY "Admins can upload course content" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'course-content' 
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

-- Only admins can update course content
CREATE POLICY "Admins can update course content" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'course-content' 
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

-- Only admins can delete course content
CREATE POLICY "Admins can delete course content" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'course-content' 
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

-- =====================================================
-- 3. PROTECTED CONTENT ACCESS POLICIES
-- =====================================================

-- Create a new bucket for protected video content (enrollment required)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('protected-videos', 'protected-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Only enrolled users can view protected videos
CREATE POLICY "Enrolled users can view protected videos" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'protected-videos'
  AND (
    -- User is admin
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
    OR
    -- User is enrolled in a course that uses this video
    -- This assumes the file path contains the course ID
    -- Adjust the path parsing logic based on your naming convention
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e."userId" = auth.uid()::text
      -- You might need to adjust this logic based on how you organize files
      -- Example: if files are stored as "courseId/moduleId/video.mp4"
      AND name LIKE e."courseId" || '%'
    )
  )
);

-- Only admins can upload protected videos
CREATE POLICY "Admins can upload protected videos" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'protected-videos' 
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

-- Only admins can update protected videos
CREATE POLICY "Admins can update protected videos" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'protected-videos' 
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

-- Only admins can delete protected videos
CREATE POLICY "Admins can delete protected videos" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'protected-videos' 
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

-- =====================================================
-- 4. USER PROFILE IMAGES BUCKET
-- =====================================================

-- Create bucket for user profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own profile images
CREATE POLICY "Users can upload own profile images" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own profile images
CREATE POLICY "Users can update own profile images" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own profile images
CREATE POLICY "Users can delete own profile images" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public can view profile images
CREATE POLICY "Public can view profile images" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'profile-images');

-- =====================================================
-- 5. COURSE THUMBNAILS BUCKET
-- =====================================================

-- Create bucket for course thumbnails (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Only admins can upload course thumbnails
CREATE POLICY "Admins can upload course thumbnails" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'course-thumbnails' 
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

-- Only admins can update course thumbnails
CREATE POLICY "Admins can update course thumbnails" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'course-thumbnails' 
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

-- Only admins can delete course thumbnails
CREATE POLICY "Admins can delete course thumbnails" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'course-thumbnails' 
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

-- Public can view course thumbnails
CREATE POLICY "Public can view course thumbnails" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'course-thumbnails');

-- =====================================================
-- 6. DOWNLOADABLE RESOURCES BUCKET
-- =====================================================

-- Create bucket for downloadable course resources (PDFs, documents)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-resources', 'course-resources', false)
ON CONFLICT (id) DO NOTHING;

-- Only enrolled users can download course resources
CREATE POLICY "Enrolled users can download course resources" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'course-resources'
  AND (
    -- User is admin
    auth.uid()::text IN (
      SELECT id FROM public.users WHERE role = 'ADMIN'
    )
    OR
    -- User is enrolled in the course that owns this resource
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e."userId" = auth.uid()::text
      -- Adjust based on your file organization
      AND name LIKE e."courseId" || '%'
    )
  )
);

-- Only admins can upload course resources
CREATE POLICY "Admins can upload course resources" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'course-resources' 
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

-- Only admins can update course resources
CREATE POLICY "Admins can update course resources" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'course-resources' 
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

-- Only admins can delete course resources
CREATE POLICY "Admins can delete course resources" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'course-resources' 
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'ADMIN'
  )
);

-- =====================================================
-- 7. HELPER FUNCTIONS FOR STORAGE
-- =====================================================

-- Function to check if user has access to course content
CREATE OR REPLACE FUNCTION public.user_has_course_access(course_id text)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admin always has access
  IF auth.uid()::text IN (SELECT id FROM public.users WHERE role = 'ADMIN') THEN
    RETURN true;
  END IF;
  
  -- Check if user is enrolled
  RETURN EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE "userId" = auth.uid()::text 
    AND "courseId" = course_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extract course ID from file path
-- Adjust this based on your file naming convention
CREATE OR REPLACE FUNCTION public.extract_course_id_from_path(file_path text)
RETURNS text AS $$
BEGIN
  -- Example: Extract course ID from path like "courseId/moduleId/file.ext"
  -- Adjust the logic based on your actual file organization
  RETURN split_part(file_path, '/', 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 8. SECURITY NOTES FOR STORAGE
-- =====================================================

/*
IMPORTANT SECURITY CONSIDERATIONS:

1. **File Organization**: Organize files by course ID in folder structure
   Example: bucket/courseId/moduleId/filename.ext

2. **Access Control**: The policies above assume a specific file organization
   You may need to adjust the path parsing logic based on your structure

3. **Public vs Private**: 
   - course-thumbnails: Public (for marketing)
   - course-content: Public (general course materials)
   - protected-videos: Private (enrollment required)
   - course-resources: Private (enrollment required)
   - profile-images: Public (but user-owned)

4. **File Naming**: Consider using consistent naming conventions:
   - Videos: courseId/moduleId/video.mp4
   - Resources: courseId/moduleId/resource.pdf
   - Thumbnails: courseId/thumbnail.jpg

5. **Cleanup**: Consider implementing policies for automatic cleanup
   of orphaned files when courses/modules are deleted

6. **Size Limits**: Configure appropriate file size limits in Supabase dashboard

7. **MIME Types**: Consider restricting allowed file types per bucket
*/

-- =====================================================
-- 9. REFRESH STORAGE CACHE
-- =====================================================

-- Refresh Supabase storage policies
NOTIFY pgrst, 'reload schema'; 