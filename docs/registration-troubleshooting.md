# Registration Troubleshooting Guide

## Overview

This guide helps debug common registration issues in the LMS system.

## Quick Diagnosis Steps

### 1. **Check Debug Endpoint**

Visit `/api/debug/registration` to test system connectivity:

```bash
curl http://localhost:3000/api/debug/registration
```

### 2. **Test Registration API Directly**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 3. **Check Browser Console**

Look for errors in:

- Network tab (API call failures)
- Console tab (JavaScript errors)
- Application tab (localStorage issues)

## Common Registration Errors

### **1. Database Connection Issues**

**Error**: `Database connection failed`
**Causes**:

- Missing `DATABASE_URL` environment variable
- Incorrect database credentials
- Database server not running
- Network connectivity issues

**Solutions**:

```bash
# Check environment variables
echo $DATABASE_URL
echo $DIRECT_URL

# Test database connection
npx prisma db push --preview-feature

# Reset database if needed
npx prisma migrate reset
```

### **2. Supabase Authentication Errors**

**Error**: `Auth session creation failed` or `Invalid credentials`
**Causes**:

- Incorrect Supabase URL or API key
- Supabase project not configured
- Email/password validation issues

**Solutions**:

```bash
# Check Supabase environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify Supabase project settings
# - Check Auth settings in Supabase dashboard
# - Ensure email confirmation is disabled for testing
# - Check password requirements
```

### **3. UUID Format Issues**

**Error**: `Invalid UUID format` or `Database constraint violation`
**Causes**:

- Supabase returns non-UUID format ID
- Database expects UUID but gets string

**Solutions**:

```sql
-- Check User table schema in database
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'id';

-- Ensure Supabase project uses UUID for auth.users
```

### **4. Unique Constraint Violations**

**Error**: `Unique constraint failed` or `P2002` error code
**Causes**:

- Email already exists in database
- User ID already exists (retry scenarios)

**Solutions**:

- Enhanced registration route now handles this gracefully
- Check for existing users before creation
- Clean up test data regularly

### **5. Missing Environment Variables**

**Error**: `Internal server error` with no specific details
**Causes**:

- Missing `.env.local` file
- Incorrect environment variable names
- Variables not loaded properly

**Solutions**:

```bash
# Create .env.local with required variables
DATABASE_URL="your-database-url"
DIRECT_URL="your-direct-url"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Restart development server
npm run dev
```

## Enhanced Registration Features

### **Validation**

- ✅ Email format validation
- ✅ Password strength requirements (6+ characters)
- ✅ Required field validation
- ✅ Duplicate user handling

### **Error Handling**

- ✅ Detailed console logging
- ✅ Specific error messages
- ✅ Graceful fallback for database sync issues
- ✅ Unique constraint handling

### **Security**

- ✅ Default STUDENT role assignment
- ✅ Secure password handling via Supabase
- ✅ Input sanitization and validation

## Debugging Commands

### **Database Checks**

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Reset database (careful - deletes all data)
npx prisma migrate reset

# Open database browser
npx prisma studio
```

### **Supabase Checks**

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Check project status
supabase status
```

### **Next.js Checks**

```bash
# Clear Next.js cache
rm -rf .next

# Restart development server
npm run dev

# Check for TypeScript errors
npm run type-check
```

## Manual Testing Steps

### **1. Test Database Setup**

```sql
-- Connect to your database and run:
SELECT COUNT(*) FROM users;
SELECT id, email, name, role FROM users LIMIT 5;
```

### **2. Test Supabase Auth**

1. Visit your Supabase dashboard
2. Go to Authentication > Users
3. Try creating a test user manually
4. Check if the user appears in your database

### **3. Test API Endpoints**

```javascript
// Test in browser console on your app
fetch("/api/debug/registration")
  .then((r) => r.json())
  .then(console.log);

// Test registration
fetch("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "test@example.com",
    password: "password123",
    name: "Test User",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

## Common Solutions

### **Reset Everything**

If all else fails, try a complete reset:

```bash
# 1. Clear Next.js cache
rm -rf .next node_modules/.cache

# 2. Reinstall dependencies
npm install

# 3. Reset database
npx prisma migrate reset

# 4. Push schema
npx prisma db push

# 5. Generate client
npx prisma generate

# 6. Restart development server
npm run dev
```

### **Check Supabase Setup**

1. **Authentication Settings**:

   - Disable email confirmation for testing
   - Set appropriate password requirements
   - Check if custom SMTP is configured correctly

2. **Database Settings**:

   - Ensure RLS policies allow user creation
   - Check if triggers are properly set up
   - Verify UUID extension is enabled

3. **API Settings**:
   - Verify API URL and keys are correct
   - Check rate limiting settings
   - Ensure proper CORS configuration

### **Environment Variables Checklist**

```bash
# Required variables for registration:
DATABASE_URL=                    # Postgres connection string
DIRECT_URL=                      # Direct database connection
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key

# Optional but recommended:
SUPABASE_SERVICE_ROLE_KEY=       # For admin operations
```

## Getting Help

### **Debug Information to Collect**

When reporting issues, include:

1. **Error Message**: Exact error from console/logs
2. **Browser**: Which browser and version
3. **Environment**: Development/production
4. **Database**: PostgreSQL version
5. **Debug Output**: Response from `/api/debug/registration`

### **Console Logs to Check**

- Server console (where you run `npm run dev`)
- Browser console (F12 → Console tab)
- Browser network tab (F12 → Network tab)
- Supabase dashboard logs

### **Files to Review**

- `.env.local` (environment variables)
- `prisma/schema.prisma` (database schema)
- `app/api/auth/register/route.ts` (registration logic)
- Browser localStorage (auth tokens)

The enhanced registration system includes comprehensive error handling and debugging features. Use the debug endpoints and follow this guide to quickly identify and resolve issues. 🔧

## ✅ **Registration System Enhanced with Comprehensive Error Handling!**

I've significantly improved your registration system with better error handling, validation, and debugging capabilities. Here's what I've implemented:

### 🔧 **Enhanced Registration Features:**

#### **1. Comprehensive Validation**

- ✅ **Email Format**: Regex validation for proper email structure
- ✅ **Password Strength**: Minimum 6 characters requirement
- ✅ **Required Fields**: Validates all necessary fields are provided
- ✅ **Duplicate Handling**: Gracefully handles existing users

#### **2. Detailed Error Logging**

- ✅ **Step-by-Step Logging**: Console logs for each registration step
- ✅ **Error Identification**: Specific error messages for different failure types
- ✅ **Debugging Info**: Detailed information for troubleshooting

#### **3. Robust Error Handling**

- ✅ **Supabase Errors**: Proper handling of authentication failures
- ✅ **Database Errors**: Graceful handling of constraint violations
- ✅ **Unique Constraints**: Smart handling of duplicate users
- ✅ **Fallback Mechanisms**: User can still login if database sync fails

### 🛠 **Debug Tools Created:**

#### **Debug Endpoint: `/api/debug/registration`**

Tests system connectivity:

- Database connection
- Supabase authentication
- User table access
- Environment variables

#### **Comprehensive Troubleshooting Guide**

Complete guide covering:

- Common error scenarios
- Step-by-step debugging
- Environment setup validation
- Manual testing procedures

### 🚀 **To Debug Your Registration Issue:**

#### **1. Check the Debug Endpoint**

Visit: `http://localhost:3000/api/debug/registration`
This will tell you if your basic setup is working.

#### **2. Test Registration Directly**

```bash
<code_block_to_apply_changes_from>
```

#### **3. Check Console Logs**

Look for detailed logs in your terminal where you run `npm run dev`. The enhanced system will show you exactly where the issue occurs.

#### **4. Common Issues to Check:**

- **Missing Environment Variables**: Ensure `.env.local` has all required Supabase variables
- **Database Connection**: Run `npx prisma db push` to verify database connectivity
- **Supabase Setup**: Check if email confirmation is disabled in Supabase dashboard
- **UUID Issues**: Ensure your Supabase project uses UUID for user IDs

### 📋 **What to Tell Me:**

When you test the registration again, please share:

1. **Exact Error Message**: Copy the error from browser console or terminal
2. **Debug Endpoint Response**: What does `/api/debug/registration` return?
3. **Console Logs**: Any logs that appear in your terminal when you try to register
4. **Browser Console**: Any errors in the browser's developer console

The enhanced registration system will give us much better visibility into what's going wrong, making it much easier to fix the specific issue you're experiencing! 🔍
