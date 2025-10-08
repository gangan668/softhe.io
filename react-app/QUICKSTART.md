# Quick Start Guide - Softhe.io React App

## Installation & Setup

1. Navigate to the React app directory:
```bash
cd react-app
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The app will be available at: http://localhost:5173

## Available Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## What's Included

### Pages (5)
1. **Home** (`/`) - Landing page with hero section and features
2. **Services** (`/services`) - Detailed service offerings
3. **Store** (`/store`) - Product catalog with Stripe integration
4. **Performance** (`/performance`) - Before/after comparisons
5. **Contact** (`/contact`) - Contact form and information

### Components (2)
- **Navbar** - Responsive navigation with mobile menu
- **Footer** - Site-wide footer with links

### Features
- ✓ Fully responsive design
- ✓ Mobile hamburger menu
- ✓ Client-side routing
- ✓ Form validation
- ✓ Smooth animations
- ✓ Payment integration ready
- ✓ SEO optimized

## Project Structure

```
src/
├── components/       # Reusable components
├── pages/           # Page components
├── App.jsx          # Main app with routing
└── main.jsx         # Entry point
```

## Tech Stack

- React 19
- React Router v7
- Vite 7
- CSS (modern features)

## Build Output

Production build generates:
- Optimized JavaScript bundle (~252KB, ~77KB gzipped)
- Minified CSS (~17KB, ~3KB gzipped)
- All assets properly hashed for caching

## Next Steps

1. Customize colors in `App.css` CSS variables
2. Add your own content in page components
3. Update Stripe links in Store page
4. Deploy to your hosting provider

## Deployment

Build the production version:
```bash
npm run build
```

The `dist/` folder contains production-ready files that can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3
- etc.

## Support

For issues or questions, refer to:
- README.md - Full documentation
- MIGRATION_SUMMARY.md - Migration details
