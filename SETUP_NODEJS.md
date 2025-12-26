# SETUP INSTRUCTIONS FOR PK AUTOMATIONS WEBSITE

## ⚠️ Important: Node.js Not Found

Node.js is required to run this website locally. Here's what you need to do:

### STEP 1: Install Node.js

1. Go to https://nodejs.org/
2. Download the **LTS (Long Term Support)** version
3. Run the installer
4. Click "Next" through all steps (use default settings)
5. Make sure to check "Add to PATH" during installation
6. Restart your computer after installation

### STEP 2: Verify Installation

After restarting, open PowerShell and type:
```powershell
node --version
npm --version
```

You should see version numbers. If you get errors, Node.js wasn't added to PATH correctly.

### STEP 3: Navigate to Project

```powershell
cd c:\Users\Peter\Desktop\Webdev2025\pk-automations-website
```

### STEP 4: Install Dependencies

```powershell
npm install
```

This will download and install all required packages (takes 2-3 minutes).

### STEP 5: Start Development Server

```powershell
npm run dev
```

Wait for the message:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### STEP 6: Open in Browser

Open your browser and go to:
```
http://localhost:3000
```

You should see the website! 🎉

---

## 🎯 What You'll See

- **Homepage**: Full hero section, services, featured products, testimonials
- **Shop**: 20 products with search, filter, sort
- **Services**: All 5 services with details
- **Tutorials**: 6 tutorials with categories
- **Student Hub**: Special student section
- **About**: Company story
- **Contact**: Contact form
- **Cart**: Shopping cart system
- **Dark Mode**: Toggle button in top right

---

## 🛠️ Quick Reference

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `Ctrl + C` | Stop development server |

---

## ❓ Troubleshooting

### "npm is not recognized"
- Node.js not installed or not in PATH
- Solution: Restart computer after installing Node.js

### "Module not found"
- Dependencies not installed
- Solution: Run `npm install`

### "Port 3000 already in use"
- Another app is using that port
- Solution: Stop that app or run `npm run dev -- -p 3001`

### "Changes not showing"
- Browser cache
- Solution: Hard refresh (Ctrl + Shift + R)

---

## 📚 Files Created

All these files are already created and ready:

**Pages (10):**
- Homepage (/)
- Shop (/shop)
- Services (/services)
- Tutorials (/tutorials)
- Student Hub (/student-hub)
- About (/about)
- Contact (/contact)
- Cart (/cart)
- Product Detail (/product/[id])
- Tutorial Detail (/tutorial/[id])

**Components (4):**
- Header.jsx
- Footer.jsx
- ProductCard.jsx
- TestimonialCard.jsx

**Data:**
- 20 products
- 6 tutorials
- 5 services
- 4 testimonials

---

## ✅ Next Steps

1. Install Node.js from https://nodejs.org/
2. Restart your computer
3. Run: `npm install`
4. Run: `npm run dev`
5. Open: http://localhost:3000
6. Explore the website!

You'll be able to:
- Browse products
- Add to cart
- Search & filter
- Toggle dark mode
- Fill contact form
- See everything in action

---

Need help? Check START_HERE.md in the project folder!
