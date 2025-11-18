# Environment Variables Setup Guide

## 📋 Overview

This document outlines all environment variables used in the Softhe.io React application. Environment variables allow you to configure the application for different environments (development, staging, production) without changing the code.

---

## 🔧 Quick Setup

### 1. Create Environment File

Create a `.env` file in the `react-app/` directory:

```bash
cd react-app
touch .env
```

### 2. Copy Template

Copy the example below and paste into your `.env` file:

```env
# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Application URL
VITE_APP_URL=http://localhost:5173

# Stripe (Optional - only if you want to customize payment links)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXX

# Contact Email (Optional - defaults to support@softhe.io)
VITE_CONTACT_EMAIL=support@softhe.io

# Environment
VITE_ENVIRONMENT=development
```

### 3. Install Dependencies (if needed)

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

---

## 📝 Environment Variables Reference

### Required Variables

#### `VITE_GA_MEASUREMENT_ID`
- **Type**: String
- **Required**: No (optional for development, required for production)
- **Description**: Google Analytics 4 Measurement ID
- **Example**: `G-XXXXXXXXXX`
- **How to get**:
  1. Go to [Google Analytics](https://analytics.google.com/)
  2. Create a new property or use existing
  3. Go to Admin > Data Streams
  4. Copy the Measurement ID (starts with `G-`)

#### `VITE_APP_URL`
- **Type**: String (URL)
- **Required**: No (has default)
- **Description**: Base URL of your application
- **Default**: `http://localhost:5173` (development)
- **Examples**:
  - Development: `http://localhost:5173`
  - Production: `https://softhe.io`
  - Staging: `https://staging.softhe.io`

### Optional Variables

#### `VITE_STRIPE_PUBLISHABLE_KEY`
- **Type**: String
- **Required**: No (payment links are hardcoded)
- **Description**: Stripe publishable key for payment processing
- **Example**: `pk_test_XXXXXXXXXXXXXXXXXXXXXXXX`
- **Note**: Currently not used as Stripe Buy Buttons are hardcoded. Include this if you plan to implement dynamic Stripe checkout.
- **How to get**:
  1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
  2. Navigate to Developers > API keys
  3. Copy the Publishable key (starts with `pk_test_` or `pk_live_`)

#### `VITE_CONTACT_EMAIL`
- **Type**: String (Email)
- **Required**: No
- **Description**: Contact email displayed in the footer and contact page
- **Default**: `support@softhe.io`
- **Example**: `contact@yourdomain.com`

#### `VITE_ENVIRONMENT`
- **Type**: String (enum)
- **Required**: No
- **Description**: Current environment name
- **Options**: `development`, `staging`, `production`
- **Default**: `development`
- **Usage**: Can be used to enable/disable features per environment

---

## 🌍 Environment-Specific Configurations

### Development (.env.development)

```env
# Development Environment
VITE_ENVIRONMENT=development
VITE_APP_URL=http://localhost:5173
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
# Leave empty or use test keys for development
VITE_STRIPE_PUBLISHABLE_KEY=
```

**Features**:
- Hot Module Replacement (HMR)
- Relaxed CSP for development tools
- Console logging enabled
- Source maps enabled

---

### Staging (.env.staging)

```env
# Staging Environment
VITE_ENVIRONMENT=staging
VITE_APP_URL=https://staging.softhe.io
VITE_GA_MEASUREMENT_ID=G-STAGING_ID
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXX
VITE_CONTACT_EMAIL=staging@softhe.io
```

**Features**:
- Production-like build
- Test payment processing
- Analytics tracking
- Error monitoring

---

### Production (.env.production)

```env
# Production Environment
VITE_ENVIRONMENT=production
VITE_APP_URL=https://softhe.io
VITE_GA_MEASUREMENT_ID=G-PRODUCTION_ID
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXXXX
VITE_CONTACT_EMAIL=support@softhe.io
```

**Features**:
- Optimized build
- Strict CSP
- Error monitoring
- Real payment processing
- Analytics enabled

---

## 🔒 Security Best Practices

### ✅ Do's

1. **Never commit `.env` files to Git**
   - `.env` is in `.gitignore` by default
   - Only commit `.env.example` template

2. **Use different keys for different environments**
   - Development: Test keys
   - Production: Live keys

3. **Rotate keys regularly**
   - Change API keys periodically
   - Update in all environments

4. **Use environment secrets in CI/CD**
   - GitHub Secrets
   - Vercel Environment Variables
   - Netlify Environment Variables

5. **Validate required variables**
   - Check on app startup
   - Fail fast if missing critical config

### ❌ Don'ts

1. **Never expose secret keys in client-side code**
   - Only use `VITE_` prefix for public variables
   - Vite exposes these variables to the browser
   - Never put API secrets here

2. **Never hardcode sensitive data**
   - Use environment variables
   - Keep secrets out of source code

3. **Never share production keys**
   - Keep production credentials secure
   - Use separate keys for team members

---

## 🚀 Deployment Configuration

### Vercel

1. Go to Project Settings > Environment Variables
2. Add each variable:
   - Name: `VITE_GA_MEASUREMENT_ID`
   - Value: `G-XXXXXXXXXX`
   - Environment: Production, Preview, Development

3. Redeploy to apply changes

### Netlify

1. Go to Site Settings > Environment Variables
2. Click "Add a variable"
3. Add each variable and value
4. Redeploy to apply changes

### GitHub Pages

Add to GitHub Secrets:
1. Go to Repository Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Add each variable
4. Reference in GitHub Actions workflow:

```yaml
env:
  VITE_GA_MEASUREMENT_ID: ${{ secrets.VITE_GA_MEASUREMENT_ID }}
  VITE_APP_URL: ${{ secrets.VITE_APP_URL }}
```

---

## 🧪 Testing Environment Variables

### Check if variables are loaded:

```javascript
// In your React component
console.log('GA ID:', import.meta.env.VITE_GA_MEASUREMENT_ID);
console.log('App URL:', import.meta.env.VITE_APP_URL);
console.log('Environment:', import.meta.env.VITE_ENVIRONMENT);
```

### Validation Script

Create `src/utils/validateEnv.js`:

```javascript
export function validateEnv() {
  const warnings = [];
  const errors = [];

  // Check optional variables
  if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
    warnings.push('VITE_GA_MEASUREMENT_ID is not set. Analytics will be disabled.');
  }

  // Check production requirements
  if (import.meta.env.VITE_ENVIRONMENT === 'production') {
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      errors.push('VITE_GA_MEASUREMENT_ID is required in production');
    }
    if (import.meta.env.VITE_APP_URL?.includes('localhost')) {
      errors.push('VITE_APP_URL cannot be localhost in production');
    }
  }

  // Log results
  warnings.forEach(warning => console.warn('⚠️', warning));
  errors.forEach(error => console.error('❌', error));

  if (errors.length > 0) {
    throw new Error('Environment validation failed. Check console for details.');
  }

  return { warnings, errors };
}
```

Call in `main.jsx`:

```javascript
import { validateEnv } from './utils/validateEnv';

// Validate environment variables on startup
if (import.meta.env.PROD) {
  validateEnv();
}
```

---

## 📚 How Vite Handles Environment Variables

### Variable Prefix
- **`VITE_` prefix is required** for variables to be exposed to your app
- Variables without `VITE_` are only available during build, not in browser
- This prevents accidentally exposing secrets

### Loading Order
1. `.env` - Loaded in all environments
2. `.env.local` - Loaded in all environments, ignored by git
3. `.env.[mode]` - Loaded in specific mode (development/production)
4. `.env.[mode].local` - Loaded in specific mode, ignored by git

### Accessing Variables
```javascript
// ✅ Correct - with VITE_ prefix
import.meta.env.VITE_GA_MEASUREMENT_ID

// ❌ Wrong - no VITE_ prefix (won't be exposed)
import.meta.env.GA_MEASUREMENT_ID

// ✅ Built-in Vite variables (always available)
import.meta.env.MODE        // 'development' or 'production'
import.meta.env.PROD        // true in production
import.meta.env.DEV         // true in development
import.meta.env.BASE_URL    // base URL of the app
```

---

## 🔍 Troubleshooting

### Variables Not Loading

**Problem**: `import.meta.env.VITE_MY_VAR` is undefined

**Solutions**:
1. ✅ Ensure variable starts with `VITE_`
2. ✅ Restart dev server after changing `.env`
3. ✅ Check `.env` file is in `react-app/` directory
4. ✅ Verify no syntax errors in `.env` file
5. ✅ Check variable is actually defined in `.env`

### Wrong Environment Loaded

**Problem**: Production variables in development

**Solutions**:
1. ✅ Check which `.env.*` files exist
2. ✅ Use correct mode: `npm run dev` (development) vs `npm run build` (production)
3. ✅ Delete `.env.local` if testing
4. ✅ Clear Vite cache: `rm -rf node_modules/.vite`

### Deployment Variables Not Working

**Problem**: Works locally but not on Vercel/Netlify

**Solutions**:
1. ✅ Add variables to hosting platform's environment settings
2. ✅ Ensure variable names match exactly (case-sensitive)
3. ✅ Redeploy after adding variables
4. ✅ Check build logs for errors

---

## 📋 Checklist

### Development Setup
- [ ] Created `.env` file
- [ ] Added Google Analytics ID (optional for dev)
- [ ] Set `VITE_APP_URL=http://localhost:5173`
- [ ] Restarted dev server
- [ ] Verified variables load in browser console

### Production Deployment
- [ ] Added all variables to hosting platform
- [ ] Used production Google Analytics ID
- [ ] Set correct `VITE_APP_URL`
- [ ] Used live Stripe keys (if applicable)
- [ ] Tested analytics are tracking
- [ ] Verified no console errors

---

## 📞 Support

If you encounter issues with environment variables:

1. Check this documentation
2. Review Vite's [Environment Variables Guide](https://vitejs.dev/guide/env-and-mode.html)
3. Contact: support@softhe.io

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2025 | Initial environment setup guide |

---

## 📎 Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Google Analytics Setup](https://analytics.google.com/)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

---

**Last Updated**: January 2025  
**Maintainer**: Softhe.io Development Team