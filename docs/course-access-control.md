# Course Access Control System

## Overview

The course access control system ensures that only authorized users can access course content. It supports two types of access:

1. **Admin Access**: Administrators can access any course (published or unpublished) for management purposes
2. **Student Access**: Students can only access courses they have enrolled in (paid for)

## Access Control Logic

### For Administrators (ADMIN role)

- ✅ Can access any course, published or unpublished
- ✅ Can edit courses via admin interface
- ✅ Progress tracking is optional (but supported)
- ✅ Clear visual indicators (Admin badge)

### For Students (STUDENT role)

- ✅ Can only access courses they've enrolled in (paid for)
- ✅ Can only access published courses
- ❌ Cannot access unpublished courses
- ✅ Progress tracking is automatically managed
- ✅ Auto-advancement to next incomplete module

## API Endpoints

### GET `/api/user/profile`

Returns current user profile with role information.

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "ADMIN" | "STUDENT"
  }
}
```

### GET `/api/courses/[id]`

Returns course data with access control.

**Response for Enrolled Users/Admins:**

```json
{
  "success": true,
  "course": {
    "id": "course-id",
    "title": "Course Title",
    "description": "Course Description",
    "price": 97,
    "image": "course-image-url",
    "published": true,
    "modules": [
      {
        "id": "module-id",
        "title": "Module Title",
        "description": "Module Description",
        "type": "VIDEO",
        "content": "...",
        "videoUrl": "...",
        "fileUrl": "...",
        "duration": 15,
        "order": 1
      }
    ]
  },
  "enrollment": {
    "id": "enrollment-id",
    "userId": "user-id",
    "courseId": "course-id",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "progress": [
    {
      "moduleId": "module-id",
      "completed": true,
      "completedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "hasAccess": true
}
```

**Response for Non-Enrolled Users:**

```json
{
  "success": true,
  "course": {
    "id": "course-id",
    "title": "Course Title",
    "description": "Course Description",
    "price": 97,
    "image": "course-image-url",
    "published": true,
    "modules": [] // Empty - no content exposed
  },
  "enrollment": null,
  "progress": [],
  "hasAccess": false
}
```

### POST `/api/progress/complete`

Mark a module as complete for the current user.

**Request Body:**

```json
{
  "courseId": "course-id",
  "moduleId": "module-id"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Module marked as complete",
  "progress": {
    "id": "progress-id",
    "completed": true,
    "completedAt": "2024-01-01T00:00:00Z",
    "module": {
      "title": "Module Title"
    }
  }
}
```

## User Interface Features

### Course Page Layout

1. **Header**: Shows current module title, admin edit button (if admin), mark complete button
2. **Sidebar**: Course progress, module list with completion status, enrollment indicator
3. **Content Area**: Module content (video, text, or file download)
4. **Navigation**: Previous/Next module buttons with progress indicators

### Access Control UI

1. **Admin Badge**: Visible shield icon with tooltip for admin users
2. **Enrollment Status**: Green badge showing "Enrolled Student" status
3. **Purchase Prompt**: For non-enrolled users, shows course info and purchase button
4. **Progress Tracking**: Visual progress bar and module completion checkmarks

### Admin Features

- **Edit Course Button**: Direct link to course editing interface
- **Access All Content**: Can view any course regardless of enrollment
- **Admin Tooltip**: Hover indicator showing admin access level

## Database Schema

### Key Models

```sql
-- Users with role-based access
User {
  id: UUID (primary key)
  email: String (unique)
  name: String?
  role: ADMIN | STUDENT
}

-- Course enrollment (payment-based access)
Enrollment {
  id: String (primary key)
  userId: UUID (foreign key to User)
  courseId: String (foreign key to Course)
  createdAt: DateTime

  @@unique([userId, courseId])
}

-- Progress tracking per module
Progress {
  id: String (primary key)
  userId: UUID (foreign key to User)
  moduleId: String (foreign key to Module)
  completed: Boolean
  completedAt: DateTime?

  @@unique([userId, moduleId])
}
```

## Security Considerations

### Server-Side Validation

- ✅ All API routes check user authentication
- ✅ Role-based access control enforced
- ✅ Enrollment verification for course access
- ✅ Module ownership verification for progress updates

### Content Protection

- ✅ Module content only exposed to authorized users
- ✅ Unpublished courses hidden from students
- ✅ File URLs protected by access control
- ✅ Progress tracking limited to enrolled users

## Error Handling

### Common Error Responses

- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User lacks permission (not enrolled, not admin)
- **404 Not Found**: Course or module doesn't exist
- **400 Bad Request**: Invalid request parameters

### User-Friendly Messages

- "Enrollment Required": For non-enrolled students
- "Course Not Found": For invalid course IDs
- "Access Denied": For insufficient permissions
- "Failed to load course data": For server errors

## Testing Access Control

### As Administrator

1. Sign in with admin account
2. Visit any course URL
3. Verify admin badge appears
4. Verify edit course button is visible
5. Test progress tracking functionality

### As Student (Enrolled)

1. Sign in with student account
2. Ensure enrollment exists in database
3. Visit enrolled course URL
4. Verify "Enrolled Student" badge appears
5. Test progress tracking and auto-advancement

### As Student (Not Enrolled)

1. Sign in with student account
2. Visit non-enrolled course URL
3. Verify purchase prompt appears
4. Verify no module content is accessible
5. Test enrollment flow via payment

## Implementation Notes

### Bearer Token Authentication

- All API routes use Bearer token authentication
- Client-side token management via localStorage
- Automatic token refresh and error handling

### Progress Auto-Advancement

- Automatically moves to next incomplete module after completion
- 1-second delay for user feedback
- Respects module order for logical progression

### Real-Time Updates

- Progress updates immediately reflected in UI
- Module completion status synchronized across components
- Progress bar updates automatically

The course access control system provides secure, role-based access to course content while maintaining a smooth user experience for both administrators and students. 🔐
