-- Create storage bucket for course content
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-content', 'course-content', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for course content bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload course content" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'course-content');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Allow authenticated users to update their course content" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'course-content');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Allow authenticated users to delete their course content" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'course-content');

-- Allow public access to view course content
CREATE POLICY "Allow public to view course content" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'course-content');

-- Note: In production, you might want to restrict upload/update/delete permissions 
-- to only admin users by checking the user's role in the auth.users table or 
-- a custom users table. 