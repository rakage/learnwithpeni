# Payment Flow Testing Guide

## Overview
This guide helps you test the updated pembayaran registration flow that no longer relies on localStorage and uses payment reference in URL parameters for stateless operation.

## Prerequisites
1. Ensure you have all environment variables set in `.env.local`:
   ```env
   # Database
   DATABASE_URL="your-database-url"
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
   
   # Duitku Payment Gateway
   DUITKU_MERCHANT_CODE="DS24219"
   DUITKU_API_KEY="d2547323e018a40ddfd10d81923823ca"
   DUITKU_ENVIRONMENT="sandbox"
   BASE_URL="http://localhost:3000"  # NO trailing slash
   
   # Resend Email
   RESEND_API_KEY="re_..."
   
   # App Configuration
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

2. **IMPORTANT**: Ensure `BASE_URL` does NOT end with a trailing slash to prevent double slash issues in webhook/callback URLs.

3. For production testing with ngrok:
   ```bash
   ngrok http 3000
   ```
   Then update `BASE_URL` to your ngrok URL (e.g., `https://abc123.ngrok-free.app`)

## Test Scenarios

### 1. New User Pembayaran Flow

#### Steps:
1. Navigate to a course page
2. Click "Pembayaran Dulu, Daftar Kemudian"
3. Choose a payment method (e.g., BCA Virtual Account)
4. Complete payment simulation in Duitku sandbox
5. Verify automatic redirect to success page with payment reference in URL
6. Complete registration form
7. Check email for confirmation

#### Expected Results:
- ✅ Payment creates a pending payment record
- ✅ Success page URL contains `?ref=DK-xxxxx&courseId=xxxxx`
- ✅ Success page shows payment verification success
- ✅ Registration form is pre-filled with payment info
- ✅ Registration completion sends email with invoice details
- ✅ User can access course after registration

### 2. Existing User Pembayaran Flow

#### Steps:
1. Use email address that already has an account
2. Follow pembayaran flow
3. Complete payment
4. Try to register with existing email

#### Expected Results:
- ✅ Payment completes successfully
- ✅ Registration form detects existing email
- ✅ Shows message to sign in instead
- ✅ Provides link to sign in page
- ✅ After sign in, user gets access to the course

### 3. Manual Registration Completion

#### Steps:
1. Complete payment but don't complete registration
2. Navigate to `/complete-registration`
3. Enter payment reference (e.g., DK-12345678)
4. Click "Check Payment & Continue"

#### Expected Results:
- ✅ Payment verification succeeds with payment reference
- ✅ Redirects to success page with correct parameters
- ✅ Can complete registration normally

### 4. Webhook Processing

#### Steps:
1. Make a payment through pembayaran flow
2. Monitor server logs for webhook calls
3. Check database for payment status updates

#### Expected Results:
- ✅ Webhook receives callback at `/api/webhook/duitku-pembayaran`
- ✅ Payment status updates to "completed"
- ✅ Email notifications sent
- ✅ No localStorage dependencies

### 5. URL Structure Validation

#### Check these URLs are correctly formatted:
- **Callback URL**: `https://yourdomain.com/api/webhook/duitku-pembayaran` (no double slashes)
- **Return URL**: `https://yourdomain.com/pembayaran/success?courseId=xxx&merchantOrderId=PAYF-xxx` (no double slashes)
- **Success URL (via email)**: `https://yourdomain.com/pembayaran/success?ref=DK-xxx&courseId=xxx`
- **Success URL (direct return)**: `https://yourdomain.com/pembayaran/success?courseId=xxx&merchantOrderId=PAYF-xxx`

## Common Issues and Solutions

### 1. Double Slash in URLs
**Issue**: URLs like `https://domain.com//api/webhook/...`
**Solution**: Ensure `BASE_URL` environment variable doesn't end with `/`

### 2. Payment Reference Not Found
**Issue**: "Payment not found" error in manual registration
**Solution**: 
- Check payment reference format (should be like `DK-12345678`)
- Verify payment was completed in sandbox
- Check database for payment record

### 3. Email Not Sending
**Issue**: Registration confirmation emails not received
**Solution**:
- Verify `RESEND_API_KEY` is correct
- Check domain `verify.learnwithpeni.com` is verified in Resend
- Check spam folder

### 4. Redirect Not Working After Payment
**Issue**: User stays on Duitku page instead of returning to success page
**Solution**:
- Verify return URL in Duitku dashboard settings
- Check if return URL is correctly formed without double slashes
- Test with different browsers
- Don't worry - the system has fallback mechanisms to find payments even without payment reference in URL

### 5. No Payment Reference in URL When Returning
**Issue**: Success page shows "no reference found" error
**Solution**: 
- This is expected behavior when returning directly from payment page
- The system will automatically look up the payment using:
  1. Payment reference from URL (if available)
  2. Merchant Order ID from URL (if available) 
  3. Course ID and recent payments fallback
- If all lookups fail, user is redirected to manual registration page

## Database Checks

### Payment Records
```sql
-- Check pending payment status
SELECT * FROM pending_payments 
WHERE stripePaymentId LIKE 'DK-%' 
ORDER BY createdAt DESC;

-- Check pending payment by merchant order ID
SELECT pp.*, c.title, c.price 
FROM pending_payments pp
JOIN courses c ON pp.courseId = c.id
WHERE pp.merchantOrderId = 'PAYF-12345678';

-- Check pending payment by payment reference
SELECT pp.*, c.title, c.price 
FROM pending_payments pp
JOIN courses c ON pp.courseId = c.id
WHERE pp.stripePaymentId = 'DK-12345678';
```

### User Registration
```sql
-- Check if user exists
SELECT * FROM users WHERE email = 'test@example.com';

-- Check user course access
SELECT u.email, uc.courseId, c.title 
FROM users u
JOIN user_courses uc ON u.id = uc.userId
JOIN courses c ON uc.courseId = c.id
WHERE u.email = 'test@example.com';
```

## Testing Checklist

- [ ] Environment variables configured correctly
- [ ] BASE_URL has no trailing slash
- [ ] Pembayaran flow creates pending payment
- [ ] Payment completion updates status
- [ ] Success page loads with payment reference
- [ ] Registration form pre-fills correctly
- [ ] Email notifications work
- [ ] Manual registration completion works
- [ ] Existing user detection works
- [ ] Webhook processing works
- [ ] No localStorage usage anywhere
- [ ] URLs have no double slashes
- [ ] Course access granted after registration

## Logs to Monitor

1. **Server logs** for webhook calls
2. **Browser Network tab** for API calls
3. **Database logs** for payment status updates
4. **Resend dashboard** for email delivery status
5. **Browser Console** for any JavaScript errors

## Success Criteria

The payment flow is working correctly when:
1. ✅ All payments are processed without localStorage
2. ✅ Payment reference is correctly passed via URL parameters
3. ✅ Webhooks update payment status reliably
4. ✅ Email notifications are sent with invoice details
5. ✅ Users can complete registration or are redirected to sign in
6. ✅ Course access is granted correctly
7. ✅ Manual registration recovery works
8. ✅ No double slashes in any URLs
