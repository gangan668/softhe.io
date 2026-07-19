# Setup Checklist for Softhe.io

This checklist will guide you through setting up the Softhe.io website for local development.

## Prerequisites

- [ ] **Node.js 18+** installed ([Download here](https://nodejs.org/))
- [ ] **npm** or **yarn** package manager
- [ ] **Git** installed
- [ ] Code editor (VS Code recommended)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/softhe.io.git
cd softhe.io
```

### 2. Navigate to React App

```bash
cd react-app
```

### 3. Install Dependencies

```bash
npm install
```

Expected time: 1-3 minutes depending on your internet connection.

### 4. Set Up Environment Variables

#### A. Get EmailJS Credentials

- [ ] Sign up at [EmailJS](https://www.emailjs.com/)
- [ ] Create an Email Service and note the **Service ID**
- [ ] Create an Email Template and note the **Template ID**
- [ ] Get your **Public Key** from Account settings
- [ ] Optionally get the **Private Key** for authenticated API requests

#### B. Configure Server Environment

Configure these as server-only variables in Vercel:

```env
EMAILJS_SERVICE_ID=your_service_id_here
EMAILJS_TEMPLATE_ID=your_template_id_here
EMAILJS_PUBLIC_KEY=your_public_key_here
EMAILJS_PRIVATE_KEY=your_optional_private_key
CONTACT_RATE_LIMIT_SECRET=use_a_long_random_value
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for the complete checkout and fulfillment configuration.

### 5. Start Development Server

```bash
npm run dev
```

- [ ] Server starts successfully
- [ ] No errors in terminal
- [ ] Browser opens to `http://localhost:5173`
- [ ] Website loads correctly

## Verify Installation

### Test Navigation

- [ ] Home page loads
- [ ] Navigate to Services page
- [ ] Navigate to Store page
- [ ] Navigate to Performance page
- [ ] Navigate to Contact page
- [ ] Navigate to FAQ page
- [ ] Mobile menu works (resize browser window)

### Test Contact Form

- [ ] Open Contact page
- [ ] Fill out the form
- [ ] Submit a test message
- [ ] No console errors
- [ ] Success message appears
- [ ] Email is received (check your inbox)

### Run Tests

```bash
npm run test
```

- [ ] All tests pass
- [ ] No errors in test output

### Run Linter

```bash
npm run lint
```

- [ ] No linting errors
- [ ] No warnings (or only acceptable warnings)

### Build for Production

```bash
npm run build
```

- [ ] Build completes successfully
- [ ] `dist/` folder is created
- [ ] No build errors

### Preview Production Build

```bash
npm run preview
```

- [ ] Preview server starts
- [ ] Site works correctly in production mode

## Common Issues

### Port Already in Use

If port 5173 is taken, Vite will automatically use the next available port. Check terminal output for the actual URL.

### Environment Variables Not Loading

1. Make sure `.env` file is in `react-app/` directory
2. Restart the dev server after creating/editing `.env`
3. Verify variable names start with `VITE_`

### Module Not Found Errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### EmailJS Errors

1. Verify credentials in `.env` are correct
2. Check EmailJS dashboard for API quota
3. Ensure EmailJS service is active
4. Check browser console for specific error messages

## Development Workflow

### Before Starting Work

```bash
git pull origin main
npm install  # In case dependencies changed
```

### During Development

1. [ ] Create a new branch for your feature
2. [ ] Make changes
3. [ ] Test locally with `npm run dev`
4. [ ] Run tests with `npm run test`
5. [ ] Check for linting errors with `npm run lint`
6. [ ] Build to verify production works with `npm run build`

### Before Committing

- [ ] All tests pass
- [ ] No linting errors
- [ ] Build succeeds
- [ ] Changes tested in browser
- [ ] No console errors or warnings
- [ ] Mobile responsive (test with browser dev tools)

## Deployment Setup

Production requires a Node serverless host; GitHub Pages cannot run the API functions. Import the repository into Vercel, configure the server and client variables, then register the Stripe webhook described in [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run test suite |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | Check code for errors |

## Additional Resources

- [README.md](./react-app/README.md) - Project overview
- [ENV_VARIABLES.md](./react-app/ENV_VARIABLES.md) - Environment configuration
- [QUICKSTART.md](./docs/QUICKSTART.md) - Quick start guide
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Deployment guide
- [TEST_COVERAGE.md](./docs/TEST_COVERAGE.md) - Testing documentation

## Getting Help

If you encounter issues:

1. Check the [Common Issues](#common-issues) section above
2. Search existing GitHub issues
3. Review the documentation in the `docs/` folder
4. Contact support at support@softhe.io

## Setup Complete! 🎉

Once all checkboxes are marked, you're ready to start developing!

**Next Steps:**
- Familiarize yourself with the codebase structure
- Review the component architecture in `src/components/`
- Check out open issues on GitHub
- Start contributing!
