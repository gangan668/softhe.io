# Softhe.io - React Application

This is a React-based rewrite of the Softhe.io website, built with Vite and React Router.

## Features

- **Modern React Stack**: Built with React 19, React Router, and Vite
- **Fully Responsive**: Mobile-first design that works on all devices
- **Multi-page Navigation**: 
  - Home
  - Services
  - Store
  - Performance
  - Contact
- **Component-based Architecture**: Reusable components for scalability
- **Performance Optimized**: Fast loading and smooth animations

## Project Structure

```
react-app/
├── public/
│   └── images/          # Static images and assets
├── src/
│   ├── components/      # Reusable React components
│   │   ├── Navbar.jsx
│   │   ├── Navbar.css
│   │   ├── Footer.jsx
│   │   └── Footer.css
│   ├── pages/          # Page components
│   │   ├── Home.jsx & Home.css
│   │   ├── Services.jsx & Services.css
│   │   ├── Store.jsx & Store.css
│   │   ├── Performance.jsx & Performance.css
│   │   └── Contact.jsx & Contact.css
│   ├── App.jsx         # Main app component with routing
│   ├── App.css         # Global styles
│   ├── main.jsx        # Entry point
│   └── index.css       # Base styles
└── index.html          # HTML template

```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:

```bash
cd react-app
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Then edit `.env` and add your EmailJS credentials. See [ENV_VARIABLES.md](./ENV_VARIABLES.md) for detailed instructions.

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview

Preview the production build locally:

```bash
npm run preview
```

## Key Technologies

- **React 19**: Latest React features and hooks
- **React Router v7**: Client-side routing
- **Vite**: Fast build tool and dev server
- **EmailJS**: Email service for contact form
- **CSS**: Custom CSS with CSS variables for theming

## Environment Variables

The application requires environment variables for the contact form functionality. See [ENV_VARIABLES.md](./ENV_VARIABLES.md) for:

- Setting up EmailJS credentials
- Local development configuration
- Production deployment setup
- Security best practices
- Troubleshooting guide

## Features Implemented

### Navigation
- Fixed navbar with responsive hamburger menu
- Active link highlighting
- Smooth scrolling

### Pages

#### Home
- Hero section with call-to-action buttons
- Performance metrics display
- Feature cards
- CTA section

#### Services
- Detailed service listings
- Pricing information
- Process workflow visualization

#### Store
- Product grid layout
- Product badges
- Direct Stripe payment links

#### Performance
- Before/after screenshot comparisons
- FPS comparison charts
- Detailed performance metrics table

#### Contact
- Contact information display
- Interactive contact form with validation
- Rate limiting and bot protection
- EmailJS integration for email delivery
- Multiple contact methods

### Components
- **Navbar**: Responsive navigation with mobile menu
- **Footer**: Site-wide footer with social links and contact info

## Styling

The application uses CSS custom properties (CSS variables) for consistent theming:

- Primary color: #6366f1 (Indigo)
- Background: #0f0f23 (Dark blue)
- Surface: #1a1a2e (Dark gray)
- Text: #ffffff (White) and #a1a1aa (Gray)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Testing

Run the test suite:

```bash
npm run test
```

Run tests with UI:

```bash
npm run test:ui
```

Generate coverage report:

```bash
npm run test:coverage
```

## Deployment

This project is configured for GitHub Pages deployment. See [DEPLOYMENT.md](../docs/DEPLOYMENT.md) for detailed deployment instructions.

```bash
npm run deploy
```

**Important**: Ensure environment variables are set as GitHub repository secrets before deploying.

## Documentation

- [ENV_VARIABLES.md](./ENV_VARIABLES.md) - Environment variable configuration
- [QUICKSTART.md](../docs/QUICKSTART.md) - Quick start guide
- [DEPLOYMENT.md](../docs/DEPLOYMENT.md) - Deployment instructions
- [TEST_COVERAGE.md](../docs/TEST_COVERAGE.md) - Testing documentation

## Future Enhancements

- Add animations with Framer Motion
- Implement dark/light theme toggle
- Add blog/news section
- Integrate with backend API
- Add user authentication
- Implement shopping cart functionality
