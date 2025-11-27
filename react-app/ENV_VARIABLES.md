# Environment Variables Configuration

This document describes the environment variables required for the Softhe.io website.

## Overview

The application uses Vite's environment variable system. All environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

## Setup Instructions

### Local Development

1. Create a `.env` file in the `react-app` directory:
   ```bash
   cd react-app
   cp .env.example .env
   ```

2. Edit the `.env` file and add your actual values (see below for where to get them)

3. Restart the development server if it's already running:
   ```bash
   npm run dev
   ```

### Production Deployment (GitHub Pages)

For GitHub Pages deployment, you need to set these as **repository secrets**:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each variable (without the `VITE_` prefix in the secret name)

## Required Variables

### EmailJS Configuration

These variables are required for the contact form to function:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

#### How to Get EmailJS Credentials

1. **Sign up** at [EmailJS](https://www.emailjs.com/)
2. **Create an Email Service**:
   - Go to **Email Services** → **Add New Service**
   - Choose your email provider (Gmail, Outlook, etc.)
   - Follow the setup instructions
   - Copy the **Service ID** → Use as `VITE_EMAILJS_SERVICE_ID`

3. **Create an Email Template**:
   - Go to **Email Templates** → **Create New Template**
   - Design your template using these variables:
     - `{{from_name}}` - Sender's name
     - `{{from_email}}` - Sender's email
     - `{{reply_to}}` - Reply-to email address
     - `{{subject}}` - Email subject
     - `{{hardware}}` - User's hardware info (optional)
     - `{{message}}` - Message body
   - Save and copy the **Template ID** → Use as `VITE_EMAILJS_TEMPLATE_ID`

4. **Get Public Key**:
   - Go to **Account** → **General**
   - Copy your **Public Key** → Use as `VITE_EMAILJS_PUBLIC_KEY`

## Security Best Practices

### ✅ DO:
- Keep `.env` file in `.gitignore` (already configured)
- Use `.env.example` as a template without actual credentials
- Rotate keys if they are accidentally exposed
- Use different keys for development and production if possible

### ❌ DON'T:
- Never commit `.env` file to version control
- Never hardcode API keys in source code
- Never share your `.env` file publicly
- Never expose private keys in client-side code

## Verification

To verify your environment variables are loaded correctly:

1. **Development**: Check the browser console for any EmailJS errors when submitting the contact form
2. **Build**: Run `npm run build` and check for any missing variable warnings
3. **Test**: Submit a test message through the contact form

## Troubleshooting

### Environment Variables Not Loading

If your environment variables aren't working:

1. **Check the prefix**: All variables must start with `VITE_`
2. **Restart the dev server**: Vite only loads `.env` on startup
3. **Check the file location**: `.env` must be in the `react-app` directory
4. **Verify syntax**: No spaces around `=`, no quotes needed

### Contact Form Not Sending Emails

1. **Check EmailJS dashboard**: Verify your account has remaining quota
2. **Check browser console**: Look for specific error messages
3. **Verify credentials**: Ensure all three EmailJS variables are correct
4. **Test EmailJS**: Use their [test page](https://www.emailjs.com/docs/examples/reactjs/) to verify service

### GitHub Actions Build Failing

1. **Check repository secrets**: Ensure all secrets are added correctly
2. **Verify secret names**: They should match the variable names (without `VITE_` prefix)
3. **Check workflow file**: Ensure secrets are properly referenced in `.github/workflows/`

## Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [EmailJS Documentation](https://www.emailjs.com/docs/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Support

If you encounter issues with environment variable configuration:
- Check the [ENV_SETUP.md](./ENV_SETUP.md) for general setup instructions
- Review [EMAILJS_SETUP.md](../docs/EMAILJS_SETUP.md) for EmailJS-specific guidance
- Contact support at support@softhe.io