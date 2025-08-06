# Row Level Security (RLS) Setup Guide for Learn with Peni

This guide will help you implement comprehensive Row Level Security policies for your Supabase database.

## 📋 Prerequisites

- Supabase project set up
- Database schema deployed (using Prisma or direct SQL)
- Admin user created in your application

## 🚀 Step-by-Step Setup

### 1. Run the Base RLS Policies

Execute the main RLS policies file in your Supabase SQL editor:

```bash
# In Supabase Dashboard > SQL Editor
# Copy and paste the contents of supabase-rls-policies.sql
```

**File: `supabase-rls-policies.sql`**

- Enables RLS on all tables
- Creates policies for users, courses, modules, enrollments, progress, and payments
- Sets up helper functions for role checking

### 2. Set Up Enhanced Storage Policies

Execute the enhanced storage policies:

```bash
# In Supabase Dashboard > SQL Editor
# Copy and paste the contents of supabase-storage-rls-enhanced.sql
```

**File: `supabase-storage-rls-enhanced.sql`**

- Creates multiple storage buckets for different content types
- Implements enrollment-based access control for protected content
- Sets up admin-only upload permissions

### 3. Verify User Trigger (Already exists)

Ensure your user creation trigger is working:

```bash
# Already exists in supabase-trigger.sql
# This creates user records when someone signs up
```

## 🔒 Security Features Implemented

### Database Table Policies

| Table           | User Access           | Admin Access    | Notes                                |
| --------------- | --------------------- | --------------- | ------------------------------------ |
| **users**       | Own profile only      | All users       | Users can view/update own data       |
| **courses**     | Published only        | All courses     | Public can see published courses     |
| **modules**     | Enrolled courses only | All modules     | Content restricted to enrolled users |
| **enrollments** | Own enrollments       | All enrollments | Users see their own enrollments      |
| **progress**    | Own progress          | All progress    | Progress tracking per user           |
| **payments**    | Own payments          | All payments    | Payment history protection           |

### Storage Bucket Policies

| Bucket                | Purpose                    | Access Control           |
| --------------------- | -------------------------- | ------------------------ |
| **course-content**    | General course materials   | Public read, Admin write |
| **protected-videos**  | Enrollment-required videos | Enrolled users only      |
| **course-thumbnails** | Course preview images      | Public read, Admin write |
| **course-resources**  | Downloadable materials     | Enrolled users only      |
| **profile-images**    | User avatars               | User-owned, Public read  |

## 🛠️ Configuration Steps

### 1. Create Your First Admin User

After running the policies, create an admin user:

```sql
-- In Supabase SQL Editor
-- Replace 'your-user-id' with actual user ID from auth.users
UPDATE public.users
SET role = 'ADMIN'
WHERE id = 'your-user-id';
```

### 2. Test the Policies

Verify policies work by testing with different user roles:

1. **As Student**: Can only see published courses they're enrolled in
2. **As Admin**: Can see all courses and manage content
3. **Anonymous**: Can only see published course listings

### 3. File Organization Best Practices

Organize your storage files as follows:

```
course-content/
├── courseId1/
│   ├── general-materials.pdf
│   └── course-outline.pdf
└── courseId2/
    └── syllabus.pdf

protected-videos/
├── courseId1/
│   ├── moduleId1/
│   │   └── lesson1.mp4
│   └── moduleId2/
│       └── lesson2.mp4
└── courseId2/
    └── moduleId3/
        └── lesson3.mp4

course-thumbnails/
├── courseId1-thumbnail.jpg
└── courseId2-thumbnail.jpg

profile-images/
├── userId1/
│   └── avatar.jpg
└── userId2/
    └── profile.png
```

## 🔧 Customization

### Adjusting Access Policies

To modify access rules, edit the policies in `supabase-rls-policies.sql`:

```sql
-- Example: Allow free courses to be accessed without enrollment
CREATE POLICY "Free courses accessible to all" ON public.modules
  FOR SELECT USING (
    "courseId" IN (
      SELECT id FROM public.courses
      WHERE published = true AND price = 0
    )
  );
```

### Adding New Buckets

Create additional storage buckets as needed:

```sql
-- Example: Certificates bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false);

-- Policy for certificate access
CREATE POLICY "Users can view own certificates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## 🧪 Testing

### Test User Access

1. **Create test users** with different roles
2. **Enroll users** in different courses
3. **Verify access** using Supabase API

```javascript
// Test in your application
const { data, error } = await supabase.from("courses").select("*");

// Should only return courses the user has access to
```

### Test Storage Access

```javascript
// Test video access
const { data, error } = await supabase.storage
  .from("protected-videos")
  .download("courseId/moduleId/video.mp4");

// Should only work if user is enrolled
```

## 🚨 Important Security Notes

1. **Always test policies** before deploying to production
2. **Monitor access logs** for suspicious activity
3. **Regularly review** and update policies as requirements change
4. **Use HTTPS** for all file uploads and downloads
5. **Implement rate limiting** on sensitive operations
6. **Consider audit logging** for admin actions

## 🐛 Troubleshooting

### Common Issues

1. **Policy conflicts**: Drop and recreate policies if needed
2. **Permission denied**: Check user roles and enrollment status
3. **Storage access**: Verify file paths match policy expectations
4. **Function errors**: Ensure helper functions are properly created

### Debug Queries

```sql
-- Check user role
SELECT id, email, role FROM public.users WHERE id = 'user-id';

-- Check enrollments
SELECT * FROM public.enrollments WHERE "userId" = 'user-id';

-- Test policy functions
SELECT public.is_admin();
SELECT public.is_enrolled_in_course('course-id');
```

## 📞 Support

If you encounter issues:

1. Check Supabase logs in your dashboard
2. Verify all SQL scripts ran successfully
3. Test with a fresh user account
4. Review the policy logic for your specific use case

---

**Security is paramount** - always test thoroughly before deploying to production!
