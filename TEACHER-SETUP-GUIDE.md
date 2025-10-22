# Teacher Feature - Quick Setup Guide

## 🚀 What's New

You now have a **Teacher role** in your LMS! Teachers can:
- ✅ Create and manage their own courses
- ✅ Upload videos, images, text, and files
- ✅ View all their students
- ✅ Track payments (paid/unpaid)
- ✅ Monitor student progress

## 📋 Required Setup Steps

### Step 1: Apply Database Migration

Run this SQL in your database (Supabase SQL Editor or psql):

```sql
-- Add TEACHER to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TEACHER';

-- Add teacherId column to courses table
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "teacherId" UUID;

-- Add foreign key constraint
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacherId_fkey" 
  FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS "courses_teacherId_idx" ON "courses"("teacherId");
```

**Or** copy and paste the contents of `prisma/migrations/add_teacher_role.sql` into your Supabase SQL Editor.

### Step 2: Apply RLS Policies

Run the RLS policies for teacher access control:

**Copy and paste the contents of `supabase-teacher-rls-policies.sql` into your Supabase SQL Editor.**

This creates the necessary permissions for teachers to:
- Access their own courses
- View their students
- See payment information
- Track student progress

### Step 3: Test Your Setup

1. **Login as Admin**
   - Go to your admin dashboard: `/admin`

2. **Create a Teacher**
   - Navigate to "Manage Teachers" or go to `/admin/teachers`
   - Click "Add Teacher"
   - Fill in:
     - Name: Test Teacher
     - Email: teacher@test.com
     - Password: test123456
   - Click "Create Teacher"

3. **Login as Teacher**
   - Sign out from admin
   - Login with: teacher@test.com / test123456
   - You should see the Teacher Dashboard

4. **Create a Test Course**
   - Click "Create Course" from teacher dashboard
   - Fill in course details
   - Add modules (video, text, or file)
   - Click "Create Course"

## 🎯 User Flow

### Admin Flow
```
Admin Login → Admin Dashboard → Manage Teachers
  ├─ Create Teacher (email, name, password)
  ├─ View Teacher Stats (courses, students, revenue)
  └─ Delete Teacher (courses remain, teacherId set to null)
```

### Teacher Flow
```
Teacher Login → Teacher Dashboard
  ├─ My Courses
  │   ├─ Create Course
  │   ├─ Edit Course
  │   └─ Publish/Unpublish
  ├─ My Students
  │   ├─ View Enrollments
  │   ├─ Payment Status
  │   └─ Progress Tracking
  └─ Analytics (coming soon)
```

### Student Flow (unchanged)
```
Student Login → Dashboard → Browse Courses → Enroll → Learn
```

## 📂 New Pages Created

### Admin Pages
- `/admin/teachers` - List all teachers with stats
- `/admin/teachers/create` - Create new teacher account

### Teacher Pages
- `/teacher/dashboard` - Main teacher dashboard
- `/teacher/courses` - List teacher's courses
- `/teacher/courses/create` - Create new course
- `/teacher/students` - View students, payments, and progress

## 🔐 Security & Permissions

### What Teachers CAN Do:
- ✅ Create courses (automatically assigned to them)
- ✅ Edit their own courses
- ✅ View students enrolled in their courses
- ✅ Track payments for their courses
- ✅ Monitor student progress
- ✅ Upload course materials (videos, files, images)

### What Teachers CANNOT Do:
- ❌ Edit other teachers' courses
- ❌ Create other teacher accounts
- ❌ Access admin functions
- ❌ Modify student accounts
- ❌ View/edit courses they don't own

## 🐛 Troubleshooting

### Issue: Migration fails with "value already exists"
**Solution:** The TEACHER role already exists. Skip that line and continue with the rest of the migration.

### Issue: Teacher can't see their students
**Solution:** 
1. Ensure RLS policies are applied
2. Check that courses have `teacherId` set correctly
3. Verify students are enrolled in teacher's courses

### Issue: Payment status not showing
**Solution:**
1. Ensure payments table has data
2. Check RLS policies allow teacher to view payments
3. Verify `courseId` in payments matches teacher's courses

### Issue: Teacher can't create courses
**Solution:**
1. Verify user role is set to 'TEACHER' in database
2. Check RLS policies are applied
3. Ensure teacher is authenticated

## 📊 Database Schema Changes

### User Model
```prisma
model User {
  role             Role     @default(STUDENT)
  teacherCourses   Course[] @relation("TeacherCourses")  // NEW
}
```

### Course Model
```prisma
model Course {
  teacherId   String?  @db.Uuid  // NEW
  teacher     User?    @relation("TeacherCourses", ...)  // NEW
}
```

### Role Enum
```prisma
enum Role {
  ADMIN
  TEACHER   // NEW
  STUDENT
}
```

## 📖 Documentation

Full documentation available at: `docs/teacher-feature.md`

Includes:
- Complete API documentation
- All routes and endpoints
- Request/response examples
- Security guidelines
- Advanced usage examples

## ✅ Verification Checklist

- [ ] Database migration applied successfully
- [ ] RLS policies applied successfully
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Can create teacher from admin panel
- [ ] Teacher can login successfully
- [ ] Teacher dashboard shows correctly
- [ ] Teacher can create courses
- [ ] Teacher can view students
- [ ] Navigation shows correct links for each role

## 🎉 You're Done!

Your LMS now supports three user types:
1. **Admin** - Full platform management
2. **Teacher** - Course creation and student management
3. **Student** - Learning and progress tracking

## 💡 Next Steps

Consider adding:
- Teacher analytics dashboard with charts
- Bulk student management
- Course templates
- Student messaging
- Certificate generation
- Revenue reports and exports

---

**Need Help?**
- Check `docs/teacher-feature.md` for detailed documentation
- Review `supabase-teacher-rls-policies.sql` for RLS policy details
- Inspect browser console for API errors
