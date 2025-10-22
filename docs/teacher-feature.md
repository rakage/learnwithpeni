# Teacher Role Feature Documentation

## Overview

The Teacher role system allows designated users to create and manage courses, view their students, track payments, and monitor student progress. This feature sits between Admin and Student roles in the hierarchy.

## Features

### For Teachers
- ✅ Create and manage courses (videos, images, text, files)
- ✅ Upload course materials (videos, documents, images)
- ✅ View all enrolled students
- ✅ Track payments (paid/unpaid status)
- ✅ Monitor student progress per course
- ✅ Publish/unpublish courses
- ✅ Edit course content and modules

### For Admins
- ✅ Create teacher accounts
- ✅ View all teachers and their statistics
- ✅ Delete teacher accounts
- ✅ View teacher courses, students, and revenue

## User Roles Hierarchy

```
ADMIN (Full Access)
  └── Can create and manage teachers
  └── Can manage all courses
  └── Can view all users and payments

TEACHER (Course Management)
  └── Can create and manage their own courses
  └── Can view their own students
  └── Can track payments for their courses
  └── Can monitor student progress

STUDENT (Learning Access)
  └── Can enroll in courses
  └── Can view course content
  └── Can track their own progress
```

## Database Schema

### Updated Models

```prisma
enum Role {
  ADMIN
  TEACHER   // New role
  STUDENT
}

model User {
  // ... existing fields
  role             Role     @default(STUDENT)
  teacherCourses   Course[] @relation("TeacherCourses")  // New relation
}

model Course {
  // ... existing fields
  teacherId   String?  @db.Uuid  // New field
  teacher     User?    @relation("TeacherCourses", fields: [teacherId], references: [id], onDelete: SetNull)
}
```

## API Routes

### Admin Routes (Teacher Management)

#### `GET /api/admin/teachers`
Get all teachers with statistics.

**Response:**
```json
{
  "success": true,
  "teachers": [
    {
      "id": "uuid",
      "email": "teacher@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00Z",
      "stats": {
        "totalCourses": 5,
        "publishedCourses": 3,
        "totalStudents": 120,
        "totalRevenue": 5000
      }
    }
  ]
}
```

#### `POST /api/admin/teachers`
Create a new teacher account.

**Request:**
```json
{
  "email": "teacher@example.com",
  "name": "John Doe",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "teacher": {
    "id": "uuid",
    "email": "teacher@example.com",
    "name": "John Doe",
    "role": "TEACHER"
  },
  "message": "Teacher created successfully"
}
```

#### `DELETE /api/admin/teachers/:id`
Delete a teacher account.

**Response:**
```json
{
  "success": true,
  "message": "Teacher deleted successfully"
}
```

### Teacher Routes

#### `GET /api/teacher/check`
Verify teacher authentication.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "teacher@example.com",
    "role": "TEACHER"
  },
  "isTeacher": true
}
```

#### `GET /api/teacher/dashboard`
Get teacher dashboard statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalCourses": 5,
    "publishedCourses": 3,
    "draftCourses": 2,
    "totalStudents": 120,
    "totalRevenue": 5000,
    "pendingRevenue": 500,
    "completedPayments": 100,
    "pendingPayments": 20
  },
  "courses": [...],
  "recentEnrollments": [...]
}
```

#### `GET /api/teacher/students`
Get all students enrolled in teacher's courses.

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "id": "uuid",
      "email": "student@example.com",
      "name": "Jane Smith",
      "courses": [
        {
          "course": { "id": "uuid", "title": "Course Title" },
          "payment": {
            "status": "COMPLETED",
            "amount": 97
          },
          "progress": {
            "completed": 5,
            "total": 10,
            "percentage": 50
          }
        }
      ]
    }
  ],
  "totalStudents": 120
}
```

#### `GET /api/teacher/payments`
Get all payments for teacher's courses.

**Response:**
```json
{
  "success": true,
  "payments": [...],
  "stats": {
    "totalPayments": 120,
    "completedPayments": 100,
    "pendingPayments": 20,
    "totalRevenue": 5000,
    "pendingRevenue": 500
  }
}
```

#### `GET /api/teacher/progress?courseId=uuid`
Get student progress for teacher's courses.

**Response:**
```json
{
  "success": true,
  "progressData": [
    {
      "student": { "id": "uuid", "name": "Jane Smith" },
      "course": { "id": "uuid", "title": "Course Title" },
      "progress": {
        "completed": 5,
        "total": 10,
        "percentage": 50,
        "modules": [...]
      }
    }
  ],
  "stats": {
    "totalStudents": 120,
    "averageProgress": 65.5,
    "completedStudents": 30
  }
}
```

#### `POST /api/teacher/courses`
Create a new course (automatically assigned to teacher).

**Request:**
```json
{
  "title": "Course Title",
  "description": "Course description",
  "price": 97,
  "imageUrl": "https://...",
  "modules": [
    {
      "title": "Module 1",
      "type": "VIDEO",
      "videoUrl": "https://...",
      "order": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "course": {...},
  "message": "Course created successfully"
}
```

## UI Pages

### Admin Pages

- `/admin/teachers` - List all teachers
- `/admin/teachers/create` - Create new teacher

### Teacher Pages

- `/teacher/dashboard` - Main dashboard with stats
- `/teacher/courses` - List teacher's courses
- `/teacher/courses/create` - Create new course
- `/teacher/students` - View all students with payments and progress

## Setup Instructions

### 1. Database Migration

Run the migration SQL to update your database:

```bash
# Connect to your database and run:
psql -h your-host -U your-user -d your-db -f prisma/migrations/add_teacher_role.sql
```

Or manually execute:
```sql
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TEACHER';
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "teacherId" UUID;
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacherId_fkey" 
  FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "courses_teacherId_idx" ON "courses"("teacherId");
```

### 2. Update RLS Policies (Supabase)

Apply the teacher RLS policies:

```bash
psql -h your-host -U your-user -d your-db -f supabase-teacher-rls-policies.sql
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Create Your First Teacher

As an admin, navigate to `/admin/teachers` and click "Add Teacher" to create a teacher account.

## Security & Permissions

### Teacher Permissions

Teachers can:
- ✅ Create courses (automatically assigned as teacher)
- ✅ Edit their own courses
- ✅ Delete their own courses
- ✅ View students enrolled in their courses
- ✅ View payments for their courses
- ✅ View progress for their students
- ✅ Upload files to their courses

Teachers cannot:
- ❌ View or edit other teachers' courses
- ❌ Create other teacher accounts
- ❌ Modify student accounts
- ❌ Access admin functions
- ❌ Delete students or payments

### RLS Policies

All database operations are protected by Row Level Security policies:

- Teachers can only access courses where `teacherId` matches their user ID
- Teachers can only view enrollments, payments, and progress for their courses
- Students can only view published courses
- Admins have full access to all data

## Usage Examples

### Creating a Teacher (Admin)

1. Login as Admin
2. Navigate to `/admin/teachers`
3. Click "Add Teacher"
4. Fill in email, name, and password
5. Click "Create Teacher"

### Creating a Course (Teacher)

1. Login as Teacher
2. Navigate to `/teacher/courses/create`
3. Fill in course details
4. Add modules (video, text, or file)
5. Upload content
6. Click "Create Course"

### Viewing Students (Teacher)

1. Login as Teacher
2. Navigate to `/teacher/students`
3. View all enrolled students
4. See payment status (paid/unpaid)
5. Track progress per course

## Troubleshooting

### Issue: Teacher can't create courses

**Solution:** Ensure:
- User role is set to 'TEACHER' in database
- RLS policies are applied correctly
- Teacher is authenticated with valid session

### Issue: Students not showing in teacher dashboard

**Solution:** Ensure:
- Students have enrolled in teacher's courses
- Enrollments table has correct data
- RLS policies allow teacher to view enrollments

### Issue: Payment status not showing

**Solution:** Ensure:
- Payments table has data for the courses
- Payment status is set correctly (COMPLETED, PENDING, etc.)
- RLS policies allow teacher to view payments

## Future Enhancements

Potential features to add:
- [ ] Teacher analytics dashboard with charts
- [ ] Bulk student actions
- [ ] Course templates
- [ ] Student messaging system
- [ ] Certificate generation
- [ ] Revenue reports and exports
- [ ] Course analytics (view counts, completion rates)
- [ ] Teacher profile customization
- [ ] Multi-teacher collaboration on courses

## Support

For issues or questions:
1. Check this documentation
2. Review RLS policies in database
3. Check browser console for errors
4. Verify API responses in Network tab
