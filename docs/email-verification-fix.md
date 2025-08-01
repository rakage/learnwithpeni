# 📧 Fixing Email Verification Redirect Issue

## 🔍 **The Problem**

Email verification links are redirecting to `localhost:3000` instead of your production URL:

```
https://xxtsxrtuxllmwzngpewe.supabase.co/auth/v1/verify?token=...&redirect_to=http://localhost:3000
```

## 🎯 **Root Cause**

The issue is in your **Supabase project configuration**. The Site URL is set to `localhost:3000`, so all email verification links redirect there.

## ✅ **The Fix**

### **Step 1: Update Supabase Site URL**

1. **Go to Supabase Dashboard**

   - Visit [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Authentication Settings**

   - Go to **Settings** → **Authentication**
   - Scroll down to **URL Configuration**

3. **Update Site URL**
   Change from:

   ```
   http://localhost:3000
   ```

   To your production URL:

   ```
   https://your-vercel-app-url.vercel.app
   ```

4. **Add Redirect URLs**
   In the **Redirect URLs** section, add both:
   ```
   http://localhost:3000/**
   https://your-vercel-app-url.vercel.app/**
   ```

### **Step 2: Update Environment Variables**

**Vercel Environment Variables:**

```bash
NEXT_PUBLIC_APP_URL="https://your-vercel-app-url.vercel.app"
```

**Local (.env.local):**

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### **Step 3: Verify Callback Handler**

I've created `/app/auth/callback/route.ts` to properly handle email verification:

```typescript
// This handles the redirect after email verification
export async function GET(request: NextRequest) {
  // Exchange verification code for session
  // Redirect to dashboard on success
}
```

## 🧪 **Test the Fix**

### **1. Test Registration Flow**

1. Register a new account
2. Check the email verification link
3. Verify it redirects to your production URL

### **2. Test Email Verification**

1. Click the verification link from email
2. Should redirect to `/auth/callback`
3. Then automatically redirect to `/dashboard`

### **3. Check Different Environments**

**Production:**

- Registration → Email → Verification → Dashboard ✅

**Local Development:**

- Registration → Email → Verification → Dashboard ✅

## 🔧 **Additional Configuration**

### **Custom Email Templates (Optional)**

If you want to customize the email templates:

1. **Go to Authentication → Email Templates**
2. **Edit the "Confirm signup" template**
3. **Make sure it uses dynamic URLs:**
   ```html
   <a href="{{ .ConfirmationURL }}">Confirm your email</a>
   ```

### **Multiple Environment Setup**

For teams with multiple environments:

**Development:**

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Staging:**

```bash
NEXT_PUBLIC_APP_URL="https://your-staging-url.vercel.app"
```

**Production:**

```bash
NEXT_PUBLIC_APP_URL="https://your-production-url.vercel.app"
```

## 🆘 **Troubleshooting**

### **Still Getting localhost URLs?**

1. **Clear Supabase Cache**

   - Wait 5-10 minutes after changing settings
   - Email templates may be cached

2. **Check Environment Variables**

   - Verify `NEXT_PUBLIC_APP_URL` in Vercel
   - Make sure no trailing slashes

3. **Test with New Registration**
   - Existing pending verifications may use old URLs
   - Try registering with a new email

### **Verification Not Working?**

1. **Check Callback Route**

   - Visit `/auth/callback` directly
   - Should redirect to sign in

2. **Check Console Logs**
   - Look for callback processing logs
   - Verify code exchange is working

## 📋 **Quick Checklist**

- [ ] Update Supabase Site URL to production URL
- [ ] Add both localhost and production to Redirect URLs
- [ ] Set `NEXT_PUBLIC_APP_URL` in Vercel environment variables
- [ ] Test registration with new email
- [ ] Verify email link redirects correctly
- [ ] Confirm callback handler works

## 🎯 **Expected Flow After Fix**

```
User Registration
      ↓
Email Verification Link (production URL)
      ↓
Click Link → /auth/callback
      ↓
Process Verification Code
      ↓
Redirect to /dashboard
      ↓
✅ User Logged In
```

After following these steps, email verification should work correctly for both development and production! 🎉
