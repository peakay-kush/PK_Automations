# Deployment Guide for PK Automations Website

This guide will help you deploy the PK Automations website to production.

## Prerequisites

- Node.js 16+ and npm/yarn
- Git for version control
- A hosting service (recommended: Vercel, Netlify, AWS, or DigitalOcean)

Note: The Django/Postgres backend was removed and archived to `backend-archive/`. This document focuses on deploying the Next.js frontend. If you need to reintroduce a separate backend, restore it from `backend-archive/`.

## Quick Start (Local Testing)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

**Windows / PowerShell note**: If PowerShell blocks `npm` scripts (execution policy), use one of the following:

- Quick (CMD wrapper):
```powershell
cmd /c "npm run dev"
```

- One-off bypass (no policy change):
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "npm run dev"
```

- Persistent (per-user, no admin required):
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
npm run dev
```

**Add your business logo**: place your logo file in the `public/` folder as `pk-automations-logo.png` (or `.webp`). The header prefers the PNG and will automatically fall back to `pk-automations-logo.svg` if the PNG isn't present.

### 3. Build for Production
```bash
npm run build
npm start
```

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the creator of Next.js and provides the best experience.

#### Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings > Environment Variables
   - Add your environment variables from `.env.example`
   - Redeploy

   **Security note:** Do **not** commit `.env.local` to git. If secrets were previously committed, follow the steps in `SECURITY_ROTATION.md` to rotate and purge exposed secrets.

4. **Custom Domain**
   - Go to Settings > Domains
   - Add your domain
   - Follow DNS configuration instructions

### Option 2: Netlify

#### Steps:

1. **Build and Deploy**
   - Go to https://netlify.com
   - Click "New site from Git"
   - Connect your GitHub repository
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Click "Deploy"

2. **Environment Variables**
   - Go to Site settings > Build & deploy > Environment
   - Add your environment variables

### Option 3: AWS Amplify

#### Steps:

1. **Connect Repository**
   - Go to AWS Amplify
   - Select "New app" > "Host web app"
   - Connect GitHub
   - Select repository and branch

2. **Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Deploy**
   - Click "Save and deploy"

### Option 4: DigitalOcean App Platform

#### Steps:

1. **Push to GitHub**
   - Create a GitHub repository
   - Push your code

2. **Connect DigitalOcean**
   - Go to DigitalOcean App Platform
   - Click "Create App"
   - Connect GitHub repository
   - Configure build settings
   - Set environment variables
   - Deploy

### Option 5: Self-Hosted (VPS)

#### Using a Linux VPS:

1. **SSH into Server**
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   ```

4. **Clone Repository**
   ```bash
   git clone your-repo-url
   cd pk-automations-website
   npm install
   npm run build
   ```

5. **Start with PM2**
   ```bash
   pm2 start npm --name "pk-automations" -- start
   pm2 save
   pm2 startup
   ```

6. **Setup Nginx Reverse Proxy**
   ```nginx
   server {
     listen 80;
     server_name yourdomain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

7. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## Post-Deployment Checklist

- [ ] Test all pages and functionality
- [ ] Verify responsive design on mobile devices
- [ ] Check performance with PageSpeed Insights
- [ ] Test form submissions
- [ ] Verify cart functionality
- [ ] Check WhatsApp integration
- [ ] Test dark mode toggle
- [ ] Verify all links work correctly
- [ ] Check SEO meta tags
- [ ] Setup Google Analytics
- [ ] Setup email notifications
- [ ] Monitor error logs

## Optimization Tips

### 1. Enable Image Optimization
```javascript
// In next.config.js
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    devices: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
};
```

### 2. Add Analytics
```javascript
// In layout.js
<script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}></script>
```

### 3. Setup Caching Headers
```javascript
// In next.config.js
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, must-revalidate',
        },
      ],
    },
  ];
}
```

### 4. Enable Compression
Automatically enabled in Next.js for production.

### 5. Minify CSS and JS
Automatically handled by Next.js and Tailwind.

## Monitoring & Maintenance

### Setup Error Tracking
- **Sentry**: https://sentry.io
- **Rollbar**: https://rollbar.com
- **LogRocket**: https://logrocket.com

### Regular Tasks
- Monitor server logs weekly
- Update dependencies monthly
- Backup database (if applicable)
- Review analytics monthly
- Update product information as needed

## Troubleshooting

### Issue: Build fails
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version`

### Issue: Pages not loading
- Check build logs for errors
- Verify environment variables are set
- Clear browser cache
- Test with incognito mode

### Issue: Slow performance
- Check image sizes and optimization
- Use Next.js analytics to identify slow pages
- Enable caching headers
- Implement CDN for static assets

## Database Setup (If Using Backend)

If you add a backend with a database:

1. **PostgreSQL** (Recommended)
   ```bash
   npm install pg sequelize
   ```

2. **MongoDB**
   ```bash
   npm install mongodb mongoose
   ```

3. **Firebase**
   ```bash
   npm install firebase
   ```

## API Integration

To connect to a backend API:

1. Create an `.env.local` file
2. Add API endpoint: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
3. Use in components:
   ```javascript
   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
   ```

## SSL/HTTPS Certificate

All modern hosting services provide free SSL certificates:
- Vercel: Automatic
- Netlify: Automatic
- Let's Encrypt: Free for self-hosted

## Custom Domain Setup

1. Purchase domain (GoDaddy, Namecheap, etc.)
2. Point domain to your hosting
3. Configure DNS records
4. Enable SSL certificate

## Questions or Issues?

- Check Next.js documentation: https://nextjs.org/docs
- Review deployment guides: https://nextjs.org/docs/deployment
- Contact support: info@pkautomations.com

---

**Happy Deploying! 🚀**
