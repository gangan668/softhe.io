# 🚀 Deployment Instructions for Softhe.io React App

## Overview

This project is now configured to deploy the React application to GitHub Pages. The old static HTML files remain in the repository but are no longer used for deployment.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Git configured with push access to the repository
- GitHub Pages enabled in repository settings

---

## 🔧 Initial Setup

### 1. Install Dependencies

```bash
cd react-app
npm install
```

This will install all dependencies including the `gh-pages` package needed for deployment.

### 2. Configure GitHub Pages

Go to your GitHub repository settings:

1. Navigate to **Settings** → **Pages**
2. Under **Source**, select **"Deploy from a branch"**
3. Select branch: **`gh-pages`**
4. Select folder: **`/ (root)`**
5. Click **Save**

### 3. Set Environment Variables (Optional)

If using Google Analytics or other environment-specific configs:

**For GitHub Actions:**
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `VITE_GA_MEASUREMENT_ID` - Your Google Analytics ID
   - `VITE_APP_URL` - Your production URL (e.g., https://gangan668.github.io/softhe.io)

**For local development:**
1. Copy `.env.example` to `.env.local`
2. Fill in your local values

---

## 🚀 Deployment Methods

### Method 1: Automatic Deployment via GitHub Actions (Recommended)

Every push to the `main` branch automatically triggers deployment.

**What happens:**
1. Code is checked out
2. Dependencies are installed
3. Linter runs (must pass)
4. Tests run (must pass)
5. Build is created
6. Site is deployed to GitHub Pages

**To deploy:**
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

The deployment will start automatically. Check the **Actions** tab in GitHub to monitor progress.

### Method 2: Manual Deployment via npm script

Deploy directly from your local machine:

```bash
cd react-app
npm run deploy
```

This will:
1. Build the production bundle (`npm run build`)
2. Create `.nojekyll` file
3. Deploy to `gh-pages` branch

**Note:** This method bypasses linting and testing. Use GitHub Actions for production deployments.

---

## 🧪 Pre-Deployment Testing

Always test before deploying to production:

### 1. Run Tests
```bash
cd react-app
npm run test
```

### 2. Run Linter
```bash
npm run lint
```

### 3. Build Production Bundle
```bash
npm run build
```

### 4. Preview Production Build Locally
```bash
npm run preview
```

Then open http://localhost:4173 to test the production build locally.

---

## 📁 Project Structure

```
softhe.io/
├── react-app/              # React application (ACTIVE)
│   ├── dist/              # Build output (gitignored)
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   ├── package.json       # Dependencies & scripts
│   └── vite.config.js     # Vite configuration
├── .github/
│   └── workflows/
│       ├── deploy-react.yml        # Active deployment workflow
│       └── jekyll-gh-pages.yml.disabled  # Old Jekyll workflow (disabled)
├── index.html             # Old static site (archived)
├── services.html          # Old static site (archived)
└── ...                    # Other old static files (archived)
```

---

## ⚙️ Configuration Files

### `vite.config.js`
- **`base: '/softhe.io/'`** - Set to your repository name for GitHub Pages
- Change to `'/'` if using a custom domain

### `package.json`
- **`predeploy`**: Runs build before deployment
- **`deploy`**: Deploys to GitHub Pages using gh-pages

### `.github/workflows/deploy-react.yml`
- Handles automatic CI/CD deployment
- Runs on push to `main` branch
- Can be triggered manually from Actions tab

---

## 🔍 Troubleshooting

### Issue: Blank page after deployment

**Solution:** Check the `base` path in `vite.config.js`:
```javascript
// For username.github.io/repo-name
base: '/repo-name/'

// For custom domain
base: '/'
```

### Issue: 404 on page refresh

**Solution:** The 404.html file handles SPA routing. Ensure:
1. `public/404.html` exists
2. `.nojekyll` file is present in build output
3. `pathSegmentsToKeep` in 404.html is set to `1` (for project pages)

### Issue: Assets not loading

**Solution:** 
1. Check that all asset paths are relative (don't start with `/` unless using base path)
2. Ensure images are in `public/` folder
3. Verify `base` path matches your deployment URL

### Issue: GitHub Actions failing

**Solution:**
1. Check the Actions tab for error logs
2. Ensure all tests pass locally: `npm run test`
3. Ensure linter passes: `npm run lint`
4. Verify Node.js version matches workflow (v20)

### Issue: Environment variables not working

**Solution:**
1. Verify secrets are set in GitHub repository settings
2. Check that variables are prefixed with `VITE_` (Vite requirement)
3. Rebuild after changing environment variables

---

## 🔄 Updating the Site

### For code changes:
```bash
cd react-app
# Make your changes
npm run test          # Test changes
npm run lint          # Check for errors
git add .
git commit -m "Description of changes"
git push origin main  # Auto-deploys via GitHub Actions
```

### For content changes:
1. Edit the relevant component in `react-app/src/pages/` or `react-app/src/components/`
2. Test locally: `npm run dev`
3. Commit and push to trigger deployment

---

## 📊 Monitoring Deployment

### GitHub Actions Dashboard
1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. View build logs and deployment status

### Deployment Status
- ✅ Green checkmark = Successful deployment
- ❌ Red X = Failed (check logs)
- 🟡 Yellow circle = In progress

### Viewing Live Site
After successful deployment, your site will be available at:
- **Project Pages**: `https://username.github.io/softhe.io/`
- **Custom Domain**: Configure CNAME in repository settings

---

## 🔐 Security Notes

- ⚠️ GitHub Pages does NOT support custom security headers
- ⚠️ Content-Security-Policy headers in `vite.config.js` only work in dev/preview mode
- ⚠️ For production security headers, consider deploying to Vercel or Netlify instead
- ✅ `.env` files are gitignored (never commit sensitive data)
- ✅ Use GitHub Secrets for API keys and tokens

---

## 🎯 Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build locally

# Testing
npm run test            # Run tests
npm run test:ui         # Run tests with UI
npm run test:coverage   # Generate coverage report

# Quality Checks
npm run lint            # Run ESLint

# Deployment
npm run deploy          # Deploy to GitHub Pages (manual)
git push origin main    # Auto-deploy via GitHub Actions
```

---

## 📞 Need Help?

- **GitHub Actions Logs**: Check the Actions tab for detailed error messages
- **Vite Documentation**: https://vitejs.dev/
- **React Router**: https://reactrouter.com/
- **GitHub Pages**: https://docs.github.com/en/pages

---

## ✅ Deployment Checklist

Before your first deployment:

- [ ] Dependencies installed (`npm install`)
- [ ] GitHub Pages enabled in repository settings
- [ ] Environment secrets configured (if needed)
- [ ] Tests passing (`npm run test`)
- [ ] Linter passing (`npm run lint`)
- [ ] Production build successful (`npm run build`)
- [ ] `.nojekyll` file created in dist (automatic)
- [ ] GitHub Actions workflow enabled
- [ ] Old Jekyll workflow disabled (`.yml.disabled`)

---

## 🎉 You're Ready to Deploy!

Your React application is now configured for seamless GitHub Pages deployment. Every push to `main` will automatically build, test, and deploy your site.

**Happy deploying! 🚀**