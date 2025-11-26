# EmailJS Setup Guide

This guide will help you configure EmailJS to enable the contact form to send real emails.

## Overview

The Contact form uses [EmailJS](https://www.emailjs.com/) to send emails directly from the browser without requiring a backend server. This is a free service (up to 200 emails/month on the free tier) that's perfect for contact forms.

## Prerequisites

- A Gmail account (or any other email provider supported by EmailJS)
- 10 minutes to set up

## Step-by-Step Setup

### 1. Create an EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click **"Sign Up"** (top right)
3. Sign up with your email or use Google/GitHub login
4. Verify your email address

### 2. Add an Email Service

1. After logging in, go to the **Email Services** page (left sidebar)
2. Click **"Add New Service"**
3. Choose your email provider (e.g., **Gmail**)
4. Follow the prompts to connect your email account:
   - For Gmail: Click "Connect Account" and authorize EmailJS
   - You may need to enable "Less secure app access" or use an App Password
5. Once connected, you'll see a **Service ID** (e.g., `service_abc1234`)
6. **Copy this Service ID** - you'll need it later

### 3. Create an Email Template

1. Go to the **Email Templates** page (left sidebar)
2. Click **"Create New Template"**
3. Configure your template:

   **Subject:**
   ```
   New Contact Form Submission: {{subject}}
   ```

   **Content (Body):**
   ```
   You have received a new message from your website contact form.

   From: {{from_name}}
   Email: {{from_email}}
   Subject: {{subject}}
   Hardware: {{hardware}}

   Message:
   {{message}}

   ---
   This email was sent from softhe.io contact form.
   ```

4. Click **"Save"**
5. You'll see a **Template ID** (e.g., `template_xyz5678`)
6. **Copy this Template ID** - you'll need it later

### 4. Get Your Public Key

1. Go to **Account** → **General** (left sidebar)
2. Scroll down to the **API Keys** section
3. You'll see your **Public Key** (e.g., `AbCdEfGhIjKlMnOp`)
4. **Copy this Public Key**

### 5. Update the Contact Component

Open `react-app/src/pages/Contact.jsx` and replace the placeholder values around **line 128**:

```javascript
// EmailJS Configuration
const serviceId = "YOUR_SERVICE_ID";      // Replace with your Service ID
const templateId = "YOUR_TEMPLATE_ID";    // Replace with your Template ID  
const publicKey = "YOUR_PUBLIC_KEY";      // Replace with your Public Key
```

**Example (with real values):**
```javascript
const serviceId = "service_abc1234";
const templateId = "template_xyz5678";
const publicKey = "AbCdEfGhIjKlMnOp";
```

### 6. Test the Contact Form

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Contact page: `http://localhost:5173/contact`

3. Fill out the form with test data:
   - Name: Test User
   - Email: test@example.com
   - Subject: General Inquiry
   - Message: This is a test message

4. Click **"Send Message"**

5. Check your email inbox - you should receive the test message!

## Security Best Practices

### ✅ What's Safe

- **Public Key in code**: EmailJS public keys are designed to be exposed in client-side code. This is safe.
- **Service/Template IDs**: These are also safe to include in your code.

### 🔒 Additional Security (Optional)

While the basic setup is secure, you can add extra protection:

1. **Enable reCAPTCHA** (EmailJS Dashboard → Account → Security):
   - Prevents bots from spamming your form
   - Free with Google reCAPTCHA v3

2. **Whitelist Your Domain** (EmailJS Dashboard → Account → Security):
   - Only allow emails from `softhe.io` and `localhost`
   - Prevents unauthorized use of your keys

3. **Email Rate Limiting**:
   - Already implemented in `Contact.jsx` via `useRateLimit` hook
   - Limits to 3 submissions per minute per user

## Troubleshooting

### Error: "Service ID is invalid"

**Solution:** Double-check you copied the Service ID correctly from the Email Services page.

### Error: "Template ID is invalid"

**Solution:** Verify the Template ID from the Email Templates page. Make sure the template is saved.

### Emails Not Arriving

1. **Check your spam folder** - EmailJS emails might be filtered
2. **Verify email service connection** - Go to Email Services and reconnect if needed
3. **Check EmailJS logs** - Dashboard → History shows sent emails and errors
4. **Test with EmailJS playground** - Use their test tool to isolate the issue

### CORS Errors

**Solution:** EmailJS handles CORS automatically. If you see CORS errors, verify you're using the correct public key.

### Rate Limit Exceeded (EmailJS)

**Solution:** Free tier allows 200 emails/month. Upgrade to a paid plan or implement server-side email sending.

## Environment Variables (Optional Advanced Setup)

For production deployments, you may want to use environment variables instead of hardcoding values:

### 1. Create `.env` file in `react-app/`:

```env
VITE_EMAILJS_SERVICE_ID=service_abc1234
VITE_EMAILJS_TEMPLATE_ID=template_xyz5678
VITE_EMAILJS_PUBLIC_KEY=AbCdEfGhIjKlMnOp
```

### 2. Update `Contact.jsx`:

```javascript
const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
```

### 3. Add `.env` to `.gitignore`:

```
.env
.env.local
```

### 4. For GitHub Pages deployment:

Add these as **Repository Secrets** in GitHub:
- Settings → Secrets and variables → Actions → New repository secret

Then update your deployment workflow to pass them as environment variables during build.

## Template Variables Reference

The following variables are available in your EmailJS template:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{from_name}}` | User's name | "John Doe" |
| `{{from_email}}` | User's email | "john@example.com" |
| `{{reply_to}}` | Reply-to address (same as from_email) | "john@example.com" |
| `{{subject}}` | Selected subject | "Technical Support" |
| `{{hardware}}` | User's hardware info (optional) | "RTX 4080, i7-13700K" |
| `{{message}}` | User's message | "I need help with..." |

## EmailJS Pricing

- **Free Tier**: 200 emails/month
- **Personal**: $7/month - 1,000 emails/month
- **Professional**: $15/month - 5,000 emails/month
- **Enterprise**: Custom pricing

For a contact form, the free tier is usually sufficient unless you get very high traffic.

## Alternative Solutions

If EmailJS doesn't meet your needs, consider:

1. **Formspree** - Similar service, different pricing model
2. **Netlify Forms** - If hosting on Netlify (100 submissions/month free)
3. **Backend API** - Build your own with Node.js + Nodemailer
4. **Serverless Functions** - AWS Lambda, Vercel Functions, Cloudflare Workers

## Support

- **EmailJS Documentation**: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- **EmailJS Support**: support@emailjs.com
- **Project Issues**: Create an issue in the GitHub repository

---

**Last Updated**: January 2025  
**Contact Form Location**: `react-app/src/pages/Contact.jsx`  
**Test Coverage**: `react-app/src/pages/Contact.test.jsx`
