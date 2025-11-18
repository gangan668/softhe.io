# Production Deployment Guide

## 📋 Overview

This guide covers deploying the Softhe.io React application to production with proper security headers, SSL/TLS configuration, and performance optimizations.

---

## 🚀 Pre-Deployment Checklist

### 1. Code Preparation

- [ ] All tests passing (`npm test`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Environment variables configured
- [ ] Google Analytics ID set
- [ ] Stripe payment links verified
- [ ] Contact email addresses updated
- [ ] Social media links verified
- [ ] Error boundary tested
- [ ] Rate limiting tested
- [ ] Cookie consent banner tested

### 2. Build Optimization

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Run production build
npm run build

# Test production build locally
npm run preview
```

### 3. Environment Variables

Create `.env.production`:

```bash
VITE_GA_MEASUREMENT_ID=G-YOUR-ACTUAL-ID
VITE_APP_NAME=Softhe.io
VITE_APP_URL=https://softhe.io
VITE_SUPPORT_EMAIL=support@softhe.io
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_TWITTER_URL=https://x.com/SoftheCS
VITE_DISCORD_URL=https://discord.com/users/softhecs
VITE_GITHUB_URL=https://github.com/Softhe
VITE_YOUTUBE_URL=https://www.youtube.com/@softhe
```

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

#### Why Vercel?
- Zero configuration
- Automatic SSL
- Edge network (CDN)
- Automatic deployments
- Environment variable management
- Preview deployments

#### Deployment Steps:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd react-app
   vercel
   ```

4. **Configure Project:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Add Environment Variables:**
   ```bash
   vercel env add VITE_GA_MEASUREMENT_ID
   ```
   Or via Vercel Dashboard: Settings → Environment Variables

6. **Custom Domain:**
   - Go to Settings → Domains
   - Add `softhe.io` and `www.softhe.io`
   - Follow DNS configuration instructions

7. **Security Headers (vercel.json):**
   ```json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "Content-Security-Policy",
             "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://buy.stripe.com https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https: blob:; connect-src 'self' https://buy.stripe.com https://api.stripe.com https://*.google-analytics.com https://www.google-analytics.com; frame-src 'self' https://buy.stripe.com https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com; frame-ancestors 'none'; upgrade-insecure-requests"
           },
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "X-XSS-Protection",
             "value": "1; mode=block"
           },
           {
             "key": "Referrer-Policy",
             "value": "strict-origin-when-cross-origin"
           },
           {
             "key": "Permissions-Policy",
             "value": "camera=(), microphone=(), geolocation=(), payment=(self \"https://buy.stripe.com\"), usb=(), magnetometer=(), accelerometer=(), gyroscope=()"
           }
         ]
       }
     ]
   }
   ```

---

### Option 2: Netlify

#### Deployment Steps:

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   cd react-app
   netlify deploy --prod
   ```

4. **Configuration (netlify.toml):**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   
   [[headers]]
     for = "/*"
     [headers.values]
       Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://buy.stripe.com https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https: blob:; connect-src 'self' https://buy.stripe.com https://api.stripe.com https://*.google-analytics.com; frame-src 'self' https://buy.stripe.com https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com; frame-ancestors 'none'; upgrade-insecure-requests"
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       X-XSS-Protection = "1; mode=block"
       Referrer-Policy = "strict-origin-when-cross-origin"
       Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=(self \"https://buy.stripe.com\")"
   ```

---

### Option 3: GitHub Pages

#### Configuration Steps:

1. **Update vite.config.js:**
   ```javascript
   export default defineConfig({
     base: '/', // or '/repo-name/' if not using custom domain
     // ... rest of config
   });
   ```

2. **Add Deploy Script (package.json):**
   ```json
   {
     "scripts": {
       "deploy": "vite build && touch dist/.nojekyll && gh-pages -d dist"
     }
   }
   ```

3. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

**Note:** GitHub Pages has limitations with security headers. Use Vercel or Netlify for better security.

---

### Option 4: Self-Hosted (Nginx)

#### Prerequisites:
- Ubuntu/Debian server
- Root or sudo access
- Domain name pointed to server IP

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Install Node.js (if building on server)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

#### 2. Build Application

```bash
# On your local machine
npm run build

# Transfer files to server
scp -r dist/* user@your-server:/var/www/softhe.io/
```

Or build on server:
```bash
# On server
cd /var/www/softhe.io
git clone https://github.com/yourusername/softhe.io.git .
cd react-app
npm install
npm run build
```

#### 3. Nginx Configuration

Create `/etc/nginx/sites-available/softhe.io`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name softhe.io www.softhe.io;
    return 301 https://softhe.io$request_uri;
}

# Main server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name softhe.io www.softhe.io;

    # SSL Configuration (Certbot will add these)
    ssl_certificate /etc/letsencrypt/live/softhe.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/softhe.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Root directory
    root /var/www/softhe.io/react-app/dist;
    index index.html;

    # Security Headers
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://buy.stripe.com https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https: blob:; connect-src 'self' https://buy.stripe.com https://api.stripe.com https://*.google-analytics.com; frame-src 'self' https://buy.stripe.com https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com; frame-ancestors 'none'; upgrade-insecure-requests" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(self \"https://buy.stripe.com\"), usb=(), magnetometer=(), accelerometer=(), gyroscope=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security - deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Rate limiting (basic)
    limit_req_zone $binary_remote_addr zone=contact_limit:10m rate=3r/m;
    
    location /api/ {
        limit_req zone=contact_limit burst=5;
        # Proxy to backend API if you have one
        # proxy_pass http://localhost:3000;
    }
}
```

#### 4. Enable Site and Get SSL

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/softhe.io /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Get SSL certificate
sudo certbot --nginx -d softhe.io -d www.softhe.io

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

#### 5. Set Up Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up cron job, but verify:
sudo systemctl status certbot.timer
```

---

## 🔒 Security Hardening

### 1. Firewall Configuration (UFW)

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Fail2Ban (Prevent Brute Force)

```bash
# Install
sudo apt install fail2ban -y

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local

# Add nginx filter
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/*error.log

# Start service
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 3. Additional Security Measures

```bash
# Disable directory listing (already in config)
# Hide Nginx version
sudo nano /etc/nginx/nginx.conf
# Add: server_tokens off;

# Set up automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📊 Monitoring & Analytics

### 1. Google Analytics Setup

1. Create GA4 property at https://analytics.google.com/
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add to `.env.production`
4. Verify tracking after deployment

### 2. Error Monitoring (Optional)

#### Sentry Setup:

```bash
npm install @sentry/react @sentry/vite-plugin
```

Update `main.jsx`:
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

### 3. Uptime Monitoring

Recommended services:
- **UptimeRobot** (free tier available)
- **Pingdom**
- **StatusCake**
- **Better Uptime**

Set up:
- Monitor https://softhe.io every 5 minutes
- Email alerts on downtime
- Status page for users

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: react-app/package-lock.json
      
      - name: Install dependencies
        run: |
          cd react-app
          npm ci
      
      - name: Run tests
        run: |
          cd react-app
          npm test
      
      - name: Run linter
        run: |
          cd react-app
          npm run lint
      
      - name: Build
        run: |
          cd react-app
          npm run build
        env:
          VITE_GA_MEASUREMENT_ID: ${{ secrets.VITE_GA_MEASUREMENT_ID }}
          VITE_APP_URL: ${{ secrets.VITE_APP_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./react-app
          vercel-args: '--prod'
```

---

## 🧪 Post-Deployment Testing

### 1. Manual Testing Checklist

- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Services page displays properly
- [ ] Store page shows products
- [ ] Performance page images load
- [ ] Contact form submits
- [ ] Rate limiting works (try 4 submissions)
- [ ] Cookie consent banner appears
- [ ] Analytics tracking works
- [ ] Error boundary catches errors
- [ ] Mobile responsiveness
- [ ] All Stripe payment links work
- [ ] Social media links work

### 2. Automated Tests

```bash
# Security headers check
curl -I https://softhe.io

# SSL check
openssl s_client -connect softhe.io:443 -servername softhe.io

# Performance test
npx lighthouse https://softhe.io --view
```

### 3. Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

### 4. Security Scan

Use these tools:
- https://securityheaders.com/
- https://observatory.mozilla.org/
- https://www.ssllabs.com/ssltest/

---

## 🔧 Troubleshooting

### Common Issues:

#### 1. White Screen After Deployment
**Cause:** Base path issue or missing files
**Solution:**
```bash
# Check vite.config.js base path
# Ensure all files built correctly
# Check browser console for errors
```

#### 2. CSP Violations
**Cause:** External resources blocked by CSP
**Solution:**
```bash
# Check browser console
# Add allowed domains to CSP header
# Test with CSP Evaluator
```

#### 3. Analytics Not Working
**Cause:** Missing consent or wrong ID
**Solution:**
```bash
# Verify GA_MEASUREMENT_ID in .env
# Check cookie consent accepted
# Use Google Tag Assistant Chrome extension
```

#### 4. 404 on Routes
**Cause:** Server not configured for SPA routing
**Solution:**
```bash
# Add rewrite rules (see Nginx config)
# For Vercel/Netlify, ensure redirects configured
```

#### 5. Slow Performance
**Cause:** Large bundle size or missing compression
**Solution:**
```bash
# Enable gzip in server config
# Check bundle size: npm run build
# Optimize images
# Use CDN for assets
```

---

## 📈 Performance Optimization

### 1. Image Optimization

```bash
# Install sharp for image processing
npm install sharp

# Optimize images before deployment
npx @squoosh/cli --webp auto public/images/*.png
```

### 2. Code Splitting

Already configured in `vite.config.js`, but verify:
```bash
# Check chunk sizes after build
npm run build
ls -lh dist/assets/
```

### 3. CDN Configuration

For static assets, consider:
- Cloudflare (free tier with caching)
- AWS CloudFront
- Vercel Edge Network (automatic)

### 4. Caching Strategy

```nginx
# Nginx cache configuration (already in config)
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 🎯 Maintenance

### Regular Tasks:

**Weekly:**
- [ ] Check uptime monitoring reports
- [ ] Review analytics data
- [ ] Check error logs
- [ ] Monitor SSL certificate expiry

**Monthly:**
- [ ] Update dependencies (`npm audit`)
- [ ] Review security headers scan
- [ ] Check performance metrics
- [ ] Test payment links
- [ ] Review and respond to contact form submissions

**Quarterly:**
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Content updates
- [ ] SEO review
- [ ] Backup verification

### Update Procedure:

```bash
# 1. Pull latest changes
git pull origin main

# 2. Update dependencies
npm update

# 3. Run tests
npm test

# 4. Build and deploy
npm run build
# Deploy using your chosen method

# 5. Verify deployment
# Run post-deployment checklist
```

---

## 📞 Support & Resources

### Getting Help:

- **Email:** support@softhe.io
- **Discord:** @softhecs
- **GitHub Issues:** [Create an issue](https://github.com/Softhe/softhe.io/issues)

### Useful Resources:

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)

---

## ✅ Final Checklist

Before going live:

- [ ] All environment variables set
- [ ] SSL certificate installed and valid
- [ ] Security headers configured
- [ ] Analytics tracking verified
- [ ] Error monitoring set up
- [ ] Uptime monitoring configured
- [ ] Backup strategy in place
- [ ] Domain DNS configured
- [ ] Email addresses working
- [ ] Payment links tested
- [ ] Contact form tested
- [ ] Mobile responsiveness verified
- [ ] All tests passing
- [ ] Performance benchmarked
- [ ] Security scan passed
- [ ] Documentation updated

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Version:** 1.0.0  
**Environment:** Production

**Last Updated:** January 2025