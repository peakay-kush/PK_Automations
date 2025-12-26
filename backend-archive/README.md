# Backend (Django) Scaffold

This folder contains a minimal Django + DRF scaffold intended to replace the current Next.js API routes.

Quickstart (dev):

1. Create a virtualenv (python -m venv venv) and activate it.
2. pip install -r requirements.txt
3. copy `.env.example` to `.env` and adjust settings
4. python manage.py makemigrations && python manage.py migrate
5. python manage.py createsuperuser (optional)
6. python manage.py runserver

Endpoints added (mirrors current Next.js API):
- POST /api/auth/register/  → register new user
- POST /api/auth/login/     → obtain tokens + user payload
- GET  /api/auth/profile/   → authenticated profile
- POST /api/auth/set-role/  → change role (super-only)

Notes:
- Auth uses SimpleJWT (access + refresh tokens). Consider storing refresh token in an httpOnly cookie for extra security.
- Next steps: implement Products/Tutorials endpoints and a data-import command to import `src/data/products.js`.

Importing data

1. Ensure you have installed requirements: `pip install -r requirements.txt` (includes `js2py`).
2. Run migrations: `python manage.py migrate`.
3. Run the import command (reads `src/data/products.js` by default):

   `python manage.py import_products`

   You can also point to a different source with `--source /path/to/products.js`.

Notes:
- The import command uses `js2py` to evaluate `products.js` and will create/update `Product`, `Tutorial`, and `Service` records.
- After import run `python manage.py createsuperuser` if you need an admin account.

User migration

- A management command has been added to import users from the existing SQL.js SQLite database (`data/users.db`):

  `python manage.py import_users_sqljs`

  This command will:
  - Read `id, name, email, password, createdAt, role` from the `users` table
  - Create or update corresponding Django `User` records (email is used as the unique identifier)
  - Store existing bcrypt password hashes in the `legacy_password` field and set an unusable Django password (users should be asked to reset their password)

  Recommended post-import steps:
  - Option A (recommended): Ask users to reset passwords via email
  - Option B: Implement a custom Django authentication backend that verifies bcrypt hashes using `legacy_password` during the transition, and re-hash to Django's password storage after successful login

- Permissions: product/tutorial management endpoints are admin-only for modifying resources.

Running tests

- To run backend tests:

  ```bash
  python manage.py test
  ```

- There is a test for legacy bcrypt authentication (`accounts.tests.LegacyAuthTests`) which verifies that legacy bcrypt hashes can be used to login and are migrated to Django's password hash on first successful login.
