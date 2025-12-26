# PK Automations - AI Agent Instructions

## Project Overview
Next.js 14 e-commerce platform for PK Automations featuring electronics/IoT products, training courses, and specialized student hub with authentication.

## Repository status (important)
- The older Django/Postgres backend has been removed from the main runtime and archived to `backend-archive/`. The codebase now runs as a Next.js-only project by default.
- Docker Compose no longer contains `db`/`backend` services; the `frontend` (Next.js) and optional `proxy` (Nginx) are the active services. Update `docker-compose.yml` and `nginx/nginx.conf` accordingly if you modify the runtime.
- If you need to restore the previous backend, move `backend-archive/` back to `backend/` and reintroduce the DB service in `docker-compose.yml`.

## Architecture & Stack

### Core Technologies
- **Framework**: Next.js 14 (App Router, no Pages Router)
- **UI**: React 18 + Tailwind CSS
- **Database**: SQL.js (file-backed SQLite at `data/users.db`)
- **Auth**: JWT (token key: `pkat_token`) + bcryptjs hashing
- **Icons**: Lucide-react
- **Styling**: Custom colors via Tailwind (see `tailwind.config.js`)

### Key Directory Structure
```
src/app/         → Next.js routes & API endpoints
src/components/  → Reusable React components (ProductCard, Header, Footer)
src/data/        → products.js (central data file for all content)
src/utils/       → auth.js (JWT helpers), db.js (SQL.js wrapper)
src/assets/      → Static images/media
```

## Critical Patterns & Conventions

### 1. Client vs Server Components
- **Client components** (e.g., Homepage, Header, Student Hub): Use `'use client'` directive, leverage hooks (useState, useEffect)
- **Server components** (API routes): In `src/app/api/` directory, handle DB operations
- **Layout.js**: Server component; imports global styles and fonts

### 2. Authentication Flow
- **Token Storage**: `localStorage.getItem('pkat_token')` (use `@/utils/auth.js` helpers)
- **Protected Routes**: Student Hub checks `getToken()` and redirects to `/login?redirect=/student-hub`
- **API Auth**: Include `Authorization: Bearer <token>` header in requests
- **Endpoints**: `/api/auth/register`, `/api/auth/login`, `/api/auth/profile`
- **JWT Secret**: Read from `process.env.JWT_SECRET || NEXT_PUBLIC_JWT_SECRET || 'dev-secret'`

### 3. Cart System
- **Implementation**: JSON array in `localStorage.getItem('cart')`
- **Event Pattern**: Dispatch custom event `window.dispatchEvent(new Event('cartUpdated'))` after cart changes
- **Header Component**: Listens for cart updates and re-renders cart count
- **ProductCard**: Simple add-to-cart with `alert()` confirmation

### 4. Data Management
- **Single Source**: All products, tutorials, services in `src/data/products.js`
- **Product Structure**: `{ id, name, price, category, image, description, specifications, related }`
- **Categories**: DIY Kits, Electronics Components, IoT Solutions, Electrical, Biomedical, Training, Equipment
- **Filtering**: Client-side filtering (e.g., Student Hub filters by category)
- **No API data fetching** for products (hard-coded data file)

### 5. API & Database
- **API Pattern**: Route handlers in `src/app/api/*` using Next.js 14 syntax (e.g. `src/app/api/auth/*`). Treat Next.js API routes as the project's backend — there is no separate Django HTTP backend in the current setup.
- **DB Init**: `src/utils/db.js` (SQL.js) auto-creates `users` table on first call
- **DB Persistence**: `saveDB()` writes to a file (see `data/users.db`); call it after mutations to persist changes
- **Queries**: Use `db.run()` for mutations, `db.exec()` for SELECT (parameterized queries)

### 6. UI/Design Conventions
- **Colors**: Primary (#0B63FF), Accent (#00E03F), Light (#F1F1F1)
- **Component Pattern**: Wrapper div → Header → Content sections → Footer
- **Tailwind Setup**: Custom colors extended in `tailwind.config.js`; use `text-primary`, `bg-accent`, etc.
- **Responsive**: Default mobile-first; `md:` and `lg:` breakpoints for tablet/desktop
- **Icons**: Import from lucide-react (e.g., `ArrowRight`, `ShoppingCart`, `Code`)

### 7. Development Workflows
- **Install deps**: `npm install`
- **Start Dev**: `npm run dev` → `http://localhost:3000`
  - Windows PowerShell may block `npm` commands by execution policy; use either:
    - `cmd /c "npm run dev"` or
    - `powershell -NoProfile -ExecutionPolicy Bypass -Command "npm run dev"`
  - Note: If port 3000 is in use, Next will auto-select an alternate port (e.g., 3001). Check console output for the actual local URL.
- **Build**: `npm run build` (Next.js optimization)
- **Production**: `npm start` (requires build first)
- **Linting**: `npm run lint` (Next.js ESLint)
- **Docker (optional)**: `docker compose up --build -d` will start the **frontend** and optional **proxy** (no Postgres/Django services by default)
- **Environment**: Leave `NEXT_PUBLIC_API_URL` blank to make the app call relative API paths (e.g. `/api/products/`)
- **Image Domains**: Via.placeholder.com and unsplash.com configured in `next.config.js`

## Troubleshooting

- If an API call returns 500 or fails, check the Next.js server console for logged errors (we use `console.error('[api/...')` in routes). The server logs will show stack traces and helpful messages.
- For auth/register failures:
  1. Start the dev server and confirm the exact URL printed in the console (port may be 3000 or 3001).
  2. From a shell that can reach the server (prefer `cmd` or use a Node script), POST to `/api/auth/register` with JSON `{ "name": "Test", "email": "test@example.com", "password": "secret" }`.
  3. Check server console for logs like `[api/auth/register] ERROR` to inspect errors.
  4. Confirm `data/users.db` is updated by opening it with a SQLite viewer or via `src/utils/db.js` utilities.
- If `fetch` or `curl` reports `ECONNREFUSED`, ensure the dev server is running and listening on the port shown in the console and that no firewall is blocking connections.
- If PowerShell `curl`/`Invoke-RestMethod` behaves oddly, use `curl` from `cmd` or a Node script (see `scripts/post_register_test.js`) or Postman/HTTPie.

## Common Tasks & Examples

### Add New Product
Edit `src/data/products.js`:
```javascript
{
  id: 99,
  name: "New Product",
  price: 5000,
  category: "DIY Kits",  // Must match existing category
  image: "https://via.placeholder.com/300x300?text=Product",
  description: "Description here",
  specifications: "Specs here",
  related: [1, 2, 3]  // IDs of related products
}
```

### Create Protected Page
```javascript
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/utils/auth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ProtectedPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login?redirect=/protected-page');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) return <div>Loading...</div>;
  // Page content here
}
```

### Create API Endpoint
```javascript
// src/app/api/endpoint/route.js
import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/utils/db';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    // Verify token if needed
    const db = await getDB();
    // Query/mutate db
    saveDB();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

## Integration Points & Cross-Component Data Flow

1. **Header ↔ Cart**: Header listens to `cartUpdated` event; ProductCard dispatches it
2. **Header ↔ Auth**: Header fetches user profile from `/api/auth/profile`; checks `pkat_token`
3. **Dark Mode**: Toggle in Header; adds/removes `dark` class on `document.documentElement`
4. **Product Pages**: Use `useRouter().push()` for navigation; product ID from `[id]` dynamic route
5. **Student Hub**: Filters products by category; requires auth check before render

## Restoring archived Django backend (if needed)
- The original Django backend is preserved at `backend-archive/`.
- To restore it as a separate service:
  1. Move `backend-archive/` back to `backend/`.
  2. Reintroduce the `db` and `backend` service blocks in `docker-compose.yml` (see project history) and update `nginx/nginx.conf` to proxy `/api/` to `http://backend:8000/api/`.
  3. Install backend requirements and run migrations:
     - `cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt`
     - `python manage.py makemigrations && python manage.py migrate`
     - `python manage.py import_products && python manage.py import_users_sqljs`
  4. Start the stack with `docker compose up --build -d` or run services individually for debugging.

## Important Notes

- **No TypeScript**: Project uses .js/.jsx (plain JavaScript)
- **No Testing Framework**: Minimal test tooling visible
- **No Middleware**: Simple auth (client-side token checks)
- **No Real Database**: SQL.js (suitable for dev/demo; not production-scale)
- **Price Locale**: Prices in KSh (Kenyan Shilling); formatted with `.toLocaleString()`
- **Images**: All placeholder URLs; configure real image CDN in `next.config.js`
- **Accessibility**: Limited ARIA labels; opportunity for improvement

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/layout.js` | Root layout, metadata, fonts |
| `src/app/page.js` | Homepage with hero, services, products |
| `src/data/products.js` | All product/tutorial/service data |
| `src/components/Header.jsx` | Navigation, auth UI, cart, dark mode |
| `src/utils/auth.js` | JWT token helpers |
| `src/utils/db.js` | SQL.js initialization and persistence |
| `tailwind.config.js` | Custom colors, fonts, animations |
