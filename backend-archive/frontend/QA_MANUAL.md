Manual QA Checklist — Frontend (Django)

1) Start the dev server
   - cd backend
   - python manage.py runserver

2) Open the site
   - Visit: http://127.0.0.1:8000/
   - Confirm the homepage styling matches expectations and the compiled Tailwind CSS is loaded (check <link rel=stylesheet href="/static/frontend/css/globals.css").

3) Cart behavior
   - From the homepage or /shop/, click an "Add to cart" button.
   - Expect an alert "Added to cart!" and the cart count in the header to update.
   - Visit /cart/ — the item(s) should be listed with a thumbnail, name, price, and a "Remove" button.
   - Test "Remove" and "Clear cart" functionality.

4) Dark mode
   - Click the 🌓 button (id="dark-toggle").
   - Verify the page toggles the "dark" class on the document element and the preference persists on reload (localStorage key: 'theme').

5) Auth flows
   - Attempt to visit /student-hub/ while logged out — you should be redirected to /login/?redirect=/student-hub.
   - Register a new account (or use existing user) and ensure login redirects back to the hub.
   - On logout, ensure localStorage key 'pkat_token' is cleared (open DevTools → Application → Local Storage).

6) Tailwind rebuild (if you change styles)
   - npm install
   - node node_modules/tailwindcss/lib/cli.js -i ./src/app/globals.css -o ./backend/frontend/static/frontend/css/globals.css --minify

7) Notes & Troubleshooting
   - If static files don't load in tests, the repository includes a lightweight dev middleware that serves static files during tests and when DEBUG=True.
   - For a single-host production setup, use the provided Docker/Nginx config in the repo (requires Docker to run).

8) Optional: Run automated end-to-end tests with Playwright (recommended)
   - Install Playwright and browsers locally: `npm i -D @playwright/test` then `npx playwright install`.
   - Run the tests with: `npx playwright test e2e/playwright/cart.spec.js --project=chromium`.
   - The test will: add/remove an item from the cart (verifies alert and header count), verify dark mode persistence, and register+logout to confirm legacy `pkat_token` is cleared on logout.
   - If you prefer Puppeteer or Selenium, I can add equivalent scripts.
