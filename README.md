# PK AUTOMATIONS - Modern Business Website

A complete, production-ready website for PK Automations built with Next.js, React, and Tailwind CSS.

## Features

✅ **Fully Responsive Design** - Mobile-first approach, works perfectly on all devices
✅ **Tech-Modern UI** - Clean, minimal, professional design
✅ **E-Commerce Shop** - Product catalog with search, filtering, and sorting
✅ **Shopping Cart** - LocalStorage-based cart system
✅ **Service Pages** - Detailed service offerings with call-to-action
✅ **Student Hub** - Specialized section for student projects and learning
✅ **Tutorials** - Blog-style tutorial pages
✅ **About & Contact** - Company information and contact forms
✅ **Dark Mode Toggle** - Built-in dark mode support
✅ **WhatsApp Integration** - Floating WhatsApp button for quick contact
✅ **SEO Friendly** - Structured metadata and semantic HTML
✅ **Animations** - Smooth transitions and subtle animations

## Project Structure

```
pk-automations-website/
├── public/                 # Static files
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── layout.js      # Root layout
│   │   ├── globals.css    # Global styles
│   │   ├── page.js        # Homepage
│   │   ├── shop/          # Shop page
│   │   ├── services/      # Services page
│   │   ├── tutorials/     # Tutorials page
│   │   ├── student-hub/   # Student hub page
│   │   ├── about/         # About page
│   │   ├── contact/       # Contact page
│   │   ├── cart/          # Shopping cart
│   │   ├── product/[id]/  # Product detail
│   │   └── tutorial/[id]/ # Tutorial detail
│   ├── components/        # Reusable components
│   │   ├── Header.jsx     # Navigation header
│   │   ├── Footer.jsx     # Footer
│   │   ├── ProductCard.jsx# Product card component
│   │   └── TestimonialCard.jsx # Testimonial card
│   └── data/
│       └── products.js    # Product, tutorial, and service data
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── jsconfig.json
```

## Color Scheme

- **Primary (Brand Blue)**: #0B63FF
- **Accent (Brand Green)**: #00E03F
- **Light Grey**: #F1F1F1
- **White**: #FFFFFF
- **Dark**: #1a1a1a

## Typography

- **Headings**: Montserrat (Bold, 700)
- **Body**: Open Sans (Regular, 400)

## Installation & Setup

### 1. Install Dependencies

```bash
cd pk-automations-website
npm install
```

### 2. Run Development Server (Frontend)

Start the frontend development server:

```bash
cd pk-automations-website
npm install
npm run dev
```

The website will be available at `http://localhost:3000` and API routes are served by the Next.js app under `/api/` (e.g. `http://localhost:3000/api/products`).

> Note: The Django backend and Postgres services have been archived to `backend-archive/`. This repository now runs as a Next.js-only project by default; restore or reintroduce a separate backend only if needed.

### Docker (optional)

Bring up the frontend (and optional Nginx proxy) with Docker Compose:

```bash
# Using modern Docker CLI plugin
docker compose up --build -d
```

By default the Compose setup exposes the frontend on port 3000. The (optional) Nginx proxy routes requests so both the frontend and its API routes are reachable at `http://localhost/`:

- All requests under `/api/` are forwarded to the Next.js frontend (e.g. `/api/products/`)
- All other requests are forwarded to the Next.js frontend

If you use the proxy, ensure your `.env.local` sets `NEXT_PUBLIC_API_URL=` (empty) so the frontend will call relative API paths (e.g. `/api/products/`).

**Security note:** Do not commit `.env.local` to source control; use `.env.example` as a template and add real secrets to your deployment's environment settings. If secrets were committed, see `SECURITY_ROTATION.md` for steps to rotate keys and purge git history.

Start the proxy-enabled stack with:

```bash
# Using modern Docker CLI plugin
docker compose up --build -d

# Visit http://localhost:8080 to access the single-host URL when using the proxy
```

> Note: Postgres/Django services were removed from the Compose setup; the stack now focuses on the Next.js app and (optional) proxy. If you need a separate backend, restore it from `backend-archive/` or add a new service.

## Pages Overview

### Homepage (`/`)
- Hero section with tagline "Innovate. Automate. Elevate."
- Services preview (5 services)
- Featured products grid (6 products)
- Student Hub preview
- Testimonials carousel
- Call-to-action section

### Shop (`/shop`)
- Full product catalog (20 products)
- Search functionality
- Category filtering
- Sort options (by price, name, newest)
- Responsive product grid
- LocalStorage cart system

### Services (`/services`)
- All 5 services with detailed descriptions
- Feature lists for each service
- Request quote buttons
- Why Choose Us section

### Tutorials (`/tutorials`)
- 6 tutorial articles
- Search and category filtering
- Blog-style card layout
- Individual tutorial pages

### Student Hub (`/student-hub`)
- Project consultation booking
- DIY tutorials section
- Student project kits
- Simulation tools support
- Student success stories
- Special pricing and offerings

### About Us (`/about`)
- Company history and mission
- Mission, Vision, Values sections
- Team profiles
- Why Choose Us statistics

### Contact (`/contact`)
- Contact form (name, email, phone, subject, message)
- Contact information (phone, email, location)
- WhatsApp integration
- Embedded map
- Quick FAQ answers

### Product Detail (`/product/[id]`)
- Product image gallery
- Detailed specifications
- Price and availability
- Add to cart functionality
- Quantity selector
- Related products section

### Shopping Cart (`/cart`)
- View all cart items
- Remove items
- Clear cart
- Order summary with tax calculation
- Proceed to checkout button
- Continue shopping link

## Data Management

All product, tutorial, and service data is managed in `src/data/products.js`. You can easily update:

- Product information
- Pricing
- Categories
- Tutorials
- Services
- Testimonials

### Adding New Products

```javascript
{
  id: 21,
  name: "Product Name",
  price: 5000,
  category: "Category Name",
  image: "image-url",
  description: "Product description",
  specifications: "Technical specs",
  related: [1, 2, 3] // Related product IDs
}
```

## Cart System

The cart uses browser LocalStorage for persistence:
- Products are saved to `localStorage` with key `'cart'`
- Cart updates trigger a custom `cartUpdated` event
- Cart count updates in header automatically

## Customization

### Update Business Information

Edit `src/components/Footer.jsx` and `src/app/contact/page.js` to update:
- Business name
- Contact details
- Social media links
- WhatsApp number
- Location

### Change Colors

Update `tailwind.config.js` to modify the color scheme:

```javascript
colors: {
  primary: '#0B63FF',   // Brand Blue
  accent: '#00E03F',    // Brand Green
  light: '#F1F1F1',     // Light Grey
}
```

### Add More Products

1. Add product objects to `src/data/products.js`
2. Update product IDs and relationships
3. Images can be hosted on any image CDN or locally in `public/`

## SEO Optimization

- Meta tags in `layout.js`
- Semantic HTML structure
- Image alt text on all images
- Proper heading hierarchy (h1, h2, h3)
- Mobile-friendly design

## Performance

- Next.js automatic code splitting
- Image optimization ready
- Responsive images
- Minimal CSS with Tailwind
- LocalStorage caching for cart

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- [ ] Backend API integration
- [ ] Payment gateway (M-Pesa, Stripe)
- [ ] User authentication
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Blog CMS integration
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Analytics integration
- [ ] Multi-language support

## Support & Contact

For updates or issues related to the website:
- Email: info@pkautomations.com
- Phone: +254 712 345 678
- WhatsApp: https://wa.me/254712345678

## License

All rights reserved © 2025 PK Automations

---

**Built with ❤️ using Next.js, React, and Tailwind CSS**
