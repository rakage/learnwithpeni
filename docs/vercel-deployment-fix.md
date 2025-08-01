# 🚀 Fixing Vercel Deployment Issue with Duitku

## 🔍 **The Problem**

You're getting this error on Vercel but not locally:

```
❌ Error getting payment methods: Error: Failed to get payment methods: Not Found
```

## 🎯 **Root Cause**

When you deploy to Vercel, `NODE_ENV` is automatically set to `"production"`, which was making your app try to use the **production Duitku API** instead of the **sandbox API**.

However, you're using **sandbox credentials** (`DS24219`), which don't work with the production Duitku URL.

## ✅ **The Fix**

I've updated the code to use a separate environment variable (`DUITKU_ENVIRONMENT`) to control Duitku's production mode independently from `NODE_ENV`.

### **1. Add Environment Variable in Vercel**

Go to your Vercel project settings and add this environment variable:

**Variable Name:** `DUITKU_ENVIRONMENT`
**Value:** `sandbox`

### **2. Steps to Fix:**

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add New Variable:**

   - Name: `DUITKU_ENVIRONMENT`
   - Value: `sandbox`
   - Apply to: All environments (Production, Preview, Development)

3. **Verify Other Variables:**
   Make sure these are also set in Vercel:

   - `DUITKU_MERCHANT_CODE`: `DS24219`
   - `DUITKU_API_KEY`: `d2547323e018a40ddfd10d81923823ca`
   - `NEXT_PUBLIC_APP_URL`: `https://your-vercel-app-url.vercel.app`
   - All your Supabase variables

4. **Redeploy:**
   - Trigger a new deployment (push a commit or manual redeploy)

## 🧪 **Test the Fix**

After redeploying, test your Duitku integration:

### **1. Test API Endpoint**

Visit: `https://your-app.vercel.app/api/test-duitku`

This will show you:

- ✅ Environment configuration
- ✅ API connectivity status
- ✅ Detailed error information if any

### **2. Check Logs**

The updated code now provides detailed logging:

```
🔍 Duitku Payment Methods Request:
- API URL: https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod
- Environment: SANDBOX
- Merchant Code: DS24219
```

### **3. Test Payment Flow**

Try the complete payment flow:

1. Go to your landing page
2. Click "Enroll Now"
3. Fill in payment details
4. Select a payment method

## 🔧 **Configuration Changes Made**

### **Before (Problematic):**

```javascript
IS_PRODUCTION: process.env.NODE_ENV === "production";
```

- ❌ Always used production API when deployed to Vercel
- ❌ Sandbox credentials don't work with production API

### **After (Fixed):**

```javascript
IS_PRODUCTION: process.env.DUITKU_ENVIRONMENT === "production";
```

- ✅ Uses sandbox API even when deployed to production
- ✅ Only switches to production when you explicitly set `DUITKU_ENVIRONMENT=production`

## 🚀 **Future Production Setup**

When you're ready to go live with real payments:

1. **Get Production Credentials** from Duitku
2. **Update Environment Variables:**
   - `DUITKU_ENVIRONMENT`: `production`
   - `DUITKU_MERCHANT_CODE`: `your-production-merchant-code`
   - `DUITKU_API_KEY`: `your-production-api-key`

## 🆘 **Troubleshooting**

If you still get errors after the fix:

### **1. Check Environment Variables**

Visit `/api/test-duitku` to see exactly what environment variables are being used.

### **2. Check Function Logs**

In Vercel → Functions → View Function Logs to see the detailed console output.

### **3. Common Issues:**

- **Missing Environment Variables**: Make sure all Duitku variables are set in Vercel
- **Wrong API URL**: Should use sandbox URL when `DUITKU_ENVIRONMENT=sandbox`
- **Invalid Signature**: Usually caused by wrong API key or merchant code

## 📋 **Quick Checklist**

- [ ] Add `DUITKU_ENVIRONMENT=sandbox` to Vercel environment variables
- [ ] Verify `DUITKU_MERCHANT_CODE=DS24219` is set
- [ ] Verify `DUITKU_API_KEY` is set correctly
- [ ] Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
- [ ] Redeploy the application
- [ ] Test `/api/test-duitku` endpoint
- [ ] Test complete payment flow

After following these steps, your Duitku integration should work correctly on Vercel! 🎉
