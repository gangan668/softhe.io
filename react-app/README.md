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

```bash
cd react-app
npm install
```

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
- **CSS**: Custom CSS with CSS variables for theming

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
- Interactive contact form
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

## Future Enhancements

- Add animations with Framer Motion
- Implement dark/light theme toggle
- Add blog/news section
- Integrate with backend API
- Add user authentication
- Implement shopping cart functionality
