# Course Creation Guide

## Overview

The Course Creation system allows admins to create comprehensive courses with multiple types of content including videos, text lessons, and downloadable documents. All files are self-hosted using Supabase Storage.

## Features

### 📚 Course Management

- **Course Information**: Title, description, price, and cover image
- **Module Types**: Support for video, text, and file-based modules
- **Self-Hosted Media**: All videos and documents stored in Supabase Storage
- **Module Ordering**: Drag and drop or use arrow buttons to reorder modules
- **Real-time Preview**: See course structure as you build it

### 🎥 Video Modules

- **Upload Support**: MP4, WebM, OGV formats
- **Self-Hosted**: Videos stored in Supabase Storage for full control
- **Duration Tracking**: Optional duration field for course planning
- **Preview**: Built-in video player for uploaded content

### 📝 Text Modules

- **Rich Content**: Large text areas for lesson content
- **Markdown Support**: Write lessons with formatting (future enhancement)
- **Descriptions**: Optional descriptions for each text module

### 📁 File Modules

- **Document Upload**: PDF, DOC, DOCX, TXT, ZIP files supported
- **Download Links**: Students can download course materials
- **File Management**: Easy upload, preview, and removal

## Setup Instructions

### 1. Supabase Storage Setup

Run the SQL commands in `supabase-storage-setup.sql` in your Supabase SQL Editor:

```sql
-- Create storage bucket for course content
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-content', 'course-content', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies (see full file for all policies)
```

### 2. Database Schema

Ensure your Prisma schema includes the Course and Module models (already included in `prisma/schema.prisma`).

### 3. Environment Variables

Make sure your `.env.local` includes:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=your-database-url
```

## Using the Course Creator

### 1. Access the Course Creator

- Navigate to `/admin/courses/create` (requires authentication)
- Or use the "Create Course" button from the admin dashboard

### 2. Course Information

- **Title**: Required course title
- **Description**: Required course description
- **Price**: Optional pricing (defaults to 0)
- **Image**: Optional course cover image

### 3. Adding Modules

#### Video Modules

1. Click "Add Video" button
2. Enter module title and optional description
3. Click upload area to select video file
4. Wait for upload to complete
5. Optionally set duration in minutes

#### Text Modules

1. Click "Add Text" button
2. Enter module title and optional description
3. Write lesson content in the text area
4. Content supports basic formatting

#### File Modules

1. Click "Add File" button
2. Enter module title and optional description
3. Click upload area to select document
4. File will be available for download by students

### 4. Module Management

- **Reorder**: Use ▲ ▼ buttons or drag to reorder modules
- **Edit**: Update titles, descriptions, and content inline
- **Remove**: Click X button to delete modules
- **Preview**: Video player and file previews available

### 5. Course Summary

The sidebar shows:

- Total module count
- Breakdown by module type
- Course price
- Validation status

### 6. Save Course

- Click "Create Course" when ready
- System validates all required fields
- Course is saved as "Draft" status initially
- Redirects to course management page

## File Storage Structure

```
course-content/
├── courses/
│   └── images/
│       └── course-{timestamp}.{ext}
├── videos/
│   └── video-{moduleId}-{timestamp}.{ext}
└── documents/
    └── document-{moduleId}-{timestamp}.{ext}
```

## API Endpoints

### POST /api/admin/courses

Creates a new course with modules

**Request Body:**

```json
{
  "title": "Course Title",
  "description": "Course Description",
  "price": 97,
  "imageUrl": "https://...",
  "modules": [
    {
      "title": "Module 1",
      "type": "VIDEO",
      "videoUrl": "https://...",
      "description": "Module description",
      "duration": 15
    }
  ]
}
```

### GET /api/admin/courses

Lists all courses with module counts and enrollment statistics

## Security Considerations

### Authentication

- All course creation routes protected by `AuthGuard`
- Requires valid Supabase authentication session
- Admin role checking recommended for production

### File Upload Security

- File type validation on client and server
- Size limits recommended (not implemented yet)
- Virus scanning recommended for production

### Storage Permissions

- Current setup allows any authenticated user to upload
- Consider restricting to admin users only
- Public read access for course content delivery

## Future Enhancements

### Planned Features

- [ ] Rich text editor for text modules
- [ ] Video transcoding and optimization
- [ ] Module templates and reusable content
- [ ] Bulk import/export functionality
- [ ] Analytics and engagement tracking
- [ ] Quiz and assessment modules
- [ ] Live streaming integration

### Performance Optimizations

- [ ] Lazy loading for large courses
- [ ] CDN integration for global delivery
- [ ] Video streaming optimization
- [ ] Progressive download for large files

## Troubleshooting

### Common Issues

**Upload Failures**

- Check Supabase storage bucket exists
- Verify RLS policies are correctly configured
- Ensure file size within limits
- Check network connectivity

**Module Not Saving**

- Verify all required fields are filled
- Check console for validation errors
- Ensure proper authentication session

**Storage Access Denied**

- Run the storage setup SQL commands
- Check RLS policies in Supabase dashboard
- Verify bucket permissions

### Getting Help

1. Check browser console for errors
2. Review Supabase logs in dashboard
3. Verify API endpoint responses
4. Test with minimal course content first

## Technical Architecture

### Frontend Components

- `CreateCoursePage`: Main course creation interface
- `ModuleEditor`: Individual module editing component
- `AuthGuard`: Authentication protection wrapper
- `Navigation`: Dynamic navigation based on auth state

### Backend Services

- `/api/admin/courses`: Course CRUD operations
- Supabase Storage: File upload and serving
- Prisma ORM: Database operations
- Next.js API Routes: Server-side logic

### Data Flow

1. User creates course content in frontend
2. Files uploaded directly to Supabase Storage
3. Course data sent to API endpoint
4. Database transaction creates course and modules
5. User redirected to course management

This system provides a complete, self-hosted solution for creating rich, multimedia courses with professional-grade content management capabilities.
