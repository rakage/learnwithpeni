# reCAPTCHA Setup Guide

## 1. Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" to register a new site
3. Fill in the form:

   - **Label**: Your app name (e.g., "Learn with Peni")
   - **reCAPTCHA type**: Choose "reCAPTCHA v2" → "I'm not a robot" Checkbox
   - **Domains**: Add your domains:
     - For development: `localhost` and `127.0.0.1`
     - For production: your actual domain (e.g., `learnwithpeni.com`)
   - Accept the terms and submit

4. Copy the keys:
   - **Site Key** (starts with `6L...`)
   - **Secret Key** (starts with `6L...`)

## 2. Add Environment Variables

Add these to your `.env.local` file:

```bash
# reCAPTCHA v2 Keys
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

**Important**:

- The `NEXT_PUBLIC_` prefix is required for the site key (used in frontend)
- The secret key should NOT have the `NEXT_PUBLIC_` prefix (used in backend only)

## 3. Test the Setup

1. Restart your development server after adding the environment variables
2. Go to the sign-up or sign-in page
3. You should see the reCAPTCHA checkbox
4. Complete the reCAPTCHA and try to submit the form

## 4. Troubleshooting

### reCAPTCHA not showing:

- Check if `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set correctly
- Restart your development server
- Check browser console for errors

### "reCAPTCHA configuration missing" error:

- The site key is not found in environment variables
- Make sure the variable name is exactly `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

### "reCAPTCHA verification failed" error:

- Check if `RECAPTCHA_SECRET_KEY` is set correctly in `.env.local`
- Make sure you're using the correct secret key (not the site key)
- Check if your domain is registered in reCAPTCHA admin console

### "Invalid domain" error:

- Add your current domain to the reCAPTCHA admin console
- For localhost, add both `localhost` and `127.0.0.1`

## 5. Production Deployment

When deploying to production:

1. Add your production domain to the reCAPTCHA admin console
2. Set the environment variables in your hosting platform:
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - `RECAPTCHA_SECRET_KEY`

## 6. Security Notes

- Never expose the secret key in frontend code
- The site key can be public (it's in the frontend anyway)
- reCAPTCHA tokens are single-use and expire after a few minutes
- Consider implementing rate limiting for additional security
