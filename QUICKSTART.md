# Quick Start Guide - PK Automations Website

Get up and running in minutes! 🚀

## ⚡ 5-Minute Setup

### Step 1: Install Frontend Dependencies (1 min)
```bash
cd pk-automations-website
npm install
```

### Step 2: Backend
There is no separate Django backend in the default runtime — it was archived to `backend-archive/`.

If you are restoring or running your own backend, restore `backend-archive/` to `backend/` and start it as usual, and set `NEXT_PUBLIC_API_URL` in `.env.local` to your backend URL. Otherwise leave `NEXT_PUBLIC_API_URL` empty so the frontend calls relative API paths (e.g. `/api/products`).

### Step 3: Start Frontend Development Server (30 sec)
```bash
npm run dev
```

### Step 4: Open in Browser (30 sec)
Visit: http://localhost:3000

**Done!** The website is now running locally. 🎉

---

## 📖 Pages to Explore

### Homepage
- **URL**: http://localhost:3000/
- **Features**: Hero section, services preview, featured products, testimonials
- **CTA**: Shop and explore services buttons

### Shop
- **URL**: http://localhost:3000/shop
- **Features**: Product catalog, search, filtering, sorting
- **Try**: Search for "Arduino", filter by category, sort by price

### Services
- **URL**: http://localhost:3000/services
- **Features**: 5 detailed services with features and pricing
- **Try**: Click "Request Quote" to contact

### Student Hub
- **URL**: http://localhost:3000/student-hub
- **Features**: Special student offerings, tutorials, project kits
- **Try**: Browse student kits and book consultation

### About
- **URL**: http://localhost:3000/about
- **Features**: Company story, mission/vision, team, statistics
- **Try**: Learn about PK Automations

### Contact
- **URL**: http://localhost:3000/contact
- **Features**: Contact form, location, phone, email, WhatsApp
- **Try**: Fill out form and submit

### Shopping Cart
- **URL**: http://localhost:3000/cart
- **Features**: View cart, remove items, order summary
- **Try**: Add products from shop, then view cart

---

## 🛒 Test the Shopping Cart

1. Go to Shop: http://localhost:3000/shop
2. Click "Add to Cart" on any product
3. Cart count appears in header (top right)
4. Click cart icon to view items
5. Items persist even after closing browser!

**How it works**: Cart uses browser's LocalStorage

---

## 🎨 Customize for Your Business

### Change Business Name
Edit file: `src/components/Footer.jsx`
Find: "PK Automations"
Replace with your business name

### Change Colors
Edit file: `tailwind.config.js`
```javascript
colors: {
  primary: '#0B63FF',    // Change this
  accent: '#00E03F',     // And this
  light: '#F1F1F1',      // And this
}
```

### Update Contact Info
Edit file: `src/app/contact/page.js`
Find: Phone, Email, WhatsApp numbers
Update with your business details

### Add Your Products
Edit file: `src/data/products.js`
Add new product objects following the same format
Products appear automatically in the shop

### Change Company Info
Edit file: `src/components/Footer.jsx`
Update business description, address, social links

---

## 🚀 Deploy to Production

### Option A: Free Deployment on Vercel (Easiest)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

2. Go to https://vercel.com
3. Click "New Project"
4. Select your GitHub repository
5. Click "Deploy"
6. Done! Your site is live ✨

### Option B: Netlify (Also Free)

1. Same GitHub setup as above
2. Go to https://netlify.com
3. Click "New site from Git"
4. Select repository
5. Auto-deploy on every push

### Option C: Custom Domain

After deploying:
1. Buy domain (GoDaddy, Namecheap, etc.)
2. Point domain to your deployment
3. Vercel/Netlify handles SSL automatically

See `DEPLOYMENT.md` for more details

---

## 📱 Test Responsive Design

### Desktop
- Open browser normally
- Full navigation bar, multi-column layouts

### Tablet
- Press F12 (Developer Tools)
- Click responsive design mode
- Set to 768px width
- See tablet layout

### Mobile
- In responsive mode, set to 375px width
- See hamburger menu
- Test touch interactions

---

## 🔍 What's Included

✅ **8 Complete Pages**
- Homepage
- Shop with products
- Services
- Tutorials
- Student Hub
- About
- Contact
- Shopping Cart

✅ **Features**
- 20 products ready to sell
- Search & filter system
- Shopping cart (LocalStorage)
- Contact form
- Dark mode toggle
- Mobile menu
- WhatsApp integration
- Testimonials
- Team section

✅ **Professional Design**
- Modern UI with Tailwind CSS
- Smooth animations
- Fully responsive
- Fast performance
- SEO optimized

---

## 💡 Common Tasks

### Add a New Product
1. Open `src/data/products.js`
2. Add product object to `products` array
3. Refresh shop page - it appears automatically!

### Change Product Price
1. Open `src/data/products.js`
2. Find product by ID
3. Update `price` field
4. Save and refresh

### Update Service Description
1. Open `src/data/products.js`
2. Find service in `services` array
3. Edit `description` or `features`
4. Changes appear on Services page

### Modify Testimonial
1. Open `src/data/products.js`
2. Find testimonial in `testimonials` array
3. Edit text, name, or role
4. Changes appear on Homepage

---

## 🐛 Quick Troubleshooting

### "Port 3000 is already in use"
```bash
# Kill the process
# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Try again
npm run dev
```

### "Module not found" error
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Cart not working?
- Check browser's LocalStorage is enabled
- Open DevTools (F12) → Application → LocalStorage
- Look for 'cart' key
- Clear cache and reload

### Dark mode not showing?
- Make sure CSS is loaded
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

## 📚 Learn More

### Understanding the Code

**Folder Structure**
```
src/app/         - Pages (each page is a route)
src/components/  - Reusable components
src/data/        - Product and content data
```

**Key Files**
- `src/app/page.js` - Homepage
- `src/app/shop/page.js` - Shop page
- `src/data/products.js` - All products/services/tutorials
- `tailwind.config.js` - Colors and design settings

### Next.js Basics
- Routes = folders in `src/app/`
- `[id]` = dynamic route (product/:id)
- Components = reusable pieces of UI
- CSS = Tailwind utility classes

### Tailwind CSS
- `bg-primary` = background color (deep blue)
- `text-accent` = text color (orange)
- `p-4` = padding 1rem
- `grid grid-cols-3` = 3-column grid
- Responsive: `md:` = tablet, `lg:` = desktop

---

## 📞 Need Help?

### Resources
1. **README.md** - Full documentation
2. **DEPLOYMENT.md** - How to deploy
3. **PROJECT_SUMMARY.md** - Complete project overview
4. **Next.js Docs** - https://nextjs.org/docs

### Common Questions

**Q: How do I add more pages?**
A: Create a new folder in `src/app/` with a `page.js` file

**Q: Can I use my own images?**
A: Yes! Replace image URLs in `products.js` with your own

**Q: How do I set up payments?**
A: See DEPLOYMENT.md for payment gateway integration

**Q: Can I change the colors?**
A: Yes! Edit `tailwind.config.js` colors section

**Q: What about emails from contact form?**
A: You'll need a backend service (see DEPLOYMENT.md)

---

## ✨ Pro Tips

1. **Use LocalStorage**: Cart data persists automatically
2. **Mobile First**: Test on mobile before desktop
3. **Keep Images Small**: Use optimized images (JPG, WebP)
4. **SEO Ready**: All pages have meta tags
5. **Dark Mode**: Users can toggle with button in header

---

## 🎯 Next Steps

1. ✅ Run locally and explore
2. 📝 Customize with your business info
3. 📦 Add your own products
4. 🎨 Adjust colors to match your brand
5. 🚀 Deploy to production
6. 📊 Monitor analytics
7. 🔄 Keep updating content

---

## 🎉 You're All Set!

Your PK Automations website is ready to go! 

**Current Status**: ✅ Development Mode
**Ready to Deploy**: ✅ Yes
**Next Command**: `npm run dev`

Happy coding! 🚀

---

**Quick Reference**

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run lint` | Check code quality |

---

For detailed information, see **README.md**, **DEPLOYMENT.md**, or **PROJECT_SUMMARY.md**
