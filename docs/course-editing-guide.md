# Course Editing Feature Guide

## Overview

The course editing system allows administrators to modify existing courses, including content, modules, pricing, and publication status. This feature provides full CRUD operations for course management.

## Features

### 📝 **Course Information Editing**

- **Title & Description**: Modify course title and description
- **Pricing**: Update course price
- **Course Image**: Upload and change course cover images
- **Status Management**: Toggle between Published and Draft states

### 🎯 **Module Management**

- **Add New Modules**: Add VIDEO, TEXT, or FILE modules
- **Edit Existing Modules**: Modify module content and properties
- **Reorder Modules**: Move modules up/down to change sequence
- **Remove Modules**: Delete unwanted modules
- **Upload Media**: Add videos and documents to modules

### 🔐 **Security & Validation**

- **Admin Authentication**: Bearer token authentication required
- **Content Validation**: Ensures all required fields are filled before saving
- **Publish Validation**: Prevents publishing incomplete courses
- **Safe Deletion**: Prevents deleting courses with enrollments

## Access Points

### 1. From Course Listing

Navigate to `/admin/courses` and click the Edit (✏️) button on any course.

### 2. Direct URL

Access directly via `/admin/courses/{course-id}/edit`

## User Interface

### Header Section

- **Course Status Badge**: Shows Published/Draft status
- **Course ID**: Displays unique course identifier
- **Navigation**: Back button to return to course listing

### Main Content Area

#### Course Information Panel

- Title input field (required)
- Description textarea (required)
- Price input field (numeric)
- Image upload with preview

#### Modules Panel

- **Add Module Buttons**: Create VIDEO, TEXT, or FILE modules
- **Module Cards**: Individual editors for each module
- **Module Controls**: Reorder (↑↓) and delete (✖) buttons

### Sidebar Actions

#### Primary Actions

- **Save Changes**: Updates course with all modifications
- **Publish/Unpublish**: Toggles course availability
- **Cancel**: Returns to course listing without saving

#### Course Summary

- Real-time statistics of modules by type
- Current course price
- Publication status

## API Endpoints

### GET `/api/admin/courses/[id]`

Fetches single course with all modules for editing.

**Response:**

```json
{
  "success": true,
  "course": {
    "id": "course-id",
    "title": "Course Title",
    "description": "Course Description",
    "price": 97,
    "image": "image-url",
    "published": false,
    "modules": [
      {
        "id": "module-id",
        "title": "Module Title",
        "type": "VIDEO",
        "content": "...",
        "order": 1
      }
    ]
  }
}
```

### PUT `/api/admin/courses/[id]`

Updates course with new data and modules.

**Request Body:**

```json
{
  "title": "Updated Title",
  "description": "Updated Description",
  "price": 127,
  "imageUrl": "new-image-url",
  "published": true,
  "modules": [...]
}
```

### PATCH `/api/admin/courses/[id]/publish`

Toggles course published status with validation.

**Request Body:**

```json
{
  "published": true
}
```

### DELETE `/api/admin/courses/[id]`

Deletes course if no enrollments exist.

## Module Types

### 📹 **VIDEO Modules**

- **Video Upload**: Support for MP4, WebM, OGV files
- **Duration**: Optional duration in minutes
- **Video Preview**: Embedded video player for review

### 📝 **TEXT Modules**

- **Rich Content**: Large textarea for lesson content
- **Formatting**: Plain text with line breaks preserved
- **Required Content**: Must have content to publish

### 📄 **FILE Modules**

- **Document Upload**: PDF, DOC, DOCX, TXT, ZIP files
- **File Preview**: Shows filename and file type icon
- **Download Access**: Files accessible via public URLs

## Validation Rules

### Course Level

- ✅ Title is required
- ✅ Description is required
- ✅ At least one module required
- ✅ Valid price (>= 0)

### Module Level

- ✅ All modules must have titles
- ✅ TEXT modules must have content
- ✅ VIDEO modules must have uploaded videos
- ✅ FILE modules must have uploaded documents

### Publication Requirements

- ✅ All course validation rules
- ✅ All module validation rules
- ✅ Course must have cover image (recommended)

## File Storage

### Upload Locations

```
courses/
├── images/          # Course cover images
├── videos/          # Module videos
└── documents/       # Module documents
```

### File Naming

- **Images**: `course-{courseId}-{timestamp}.{ext}`
- **Videos**: `video-{moduleId}-{timestamp}.{ext}`
- **Documents**: `document-{moduleId}-{timestamp}.{ext}`

## Workflow Examples

### 1. Basic Course Edit

1. Navigate to course listing
2. Click Edit button on desired course
3. Modify title, description, or price
4. Click "Save Changes"
5. Course is updated with new information

### 2. Adding New Module

1. Open course for editing
2. Click "Add Video", "Add Text", or "Add File"
3. Fill in module title and content
4. Upload media if required
5. Save changes to persist new module

### 3. Publishing Course

1. Ensure all validation requirements are met
2. Click "Publish Course" button
3. System validates all content
4. Course becomes available to students

### 4. Reordering Modules

1. Use ↑ and ↓ arrows on module cards
2. Modules automatically renumber
3. Save changes to persist new order

## Error Handling

### Common Errors

- **404**: Course not found
- **400**: Validation errors (missing required fields)
- **403**: Insufficient admin privileges
- **500**: Server errors during file upload

### User Feedback

- ✅ Success toasts for completed actions
- ❌ Error toasts with specific messages
- 🔄 Loading states during uploads
- 📝 Form validation feedback

## Technical Implementation

### Authentication

- Uses Bearer token system from `@/lib/auth-client`
- Server-side admin validation via `checkAdminAuth()`
- Protected routes with `AuthGuard` component

### State Management

- React useState for form data
- Optimistic UI updates for better UX
- Local state synchronization with server

### File Uploads

- Direct uploads to Supabase Storage
- Progress indicators during upload
- Error handling for failed uploads

## Best Practices

### For Administrators

1. **Preview Before Publishing**: Always review course content before making it public
2. **Logical Module Order**: Arrange modules in logical learning sequence
3. **Clear Titles**: Use descriptive module titles for better student navigation
4. **Quality Media**: Ensure videos and documents are high quality

### For Developers

1. **Validation**: Always validate on both client and server
2. **Error Handling**: Provide clear error messages to users
3. **Performance**: Optimize file uploads and loading states
4. **Backup**: Consider module versioning for future rollback capability

## Troubleshooting

### Upload Issues

```
Problem: File upload fails
Solution: Check file size limits and network connection
Debug: Check browser console for specific errors
```

### Save Failures

```
Problem: Changes don't save
Solution: Verify all required fields are filled
Debug: Check API response in network tab
```

### Module Reordering

```
Problem: Module order doesn't persist
Solution: Ensure "Save Changes" is clicked after reordering
Debug: Check if API call is made with correct order
```

The course editing feature provides a comprehensive interface for course management while maintaining data integrity and user experience standards. 🚀
