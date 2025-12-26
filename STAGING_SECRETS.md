# Staging E2E secrets & setup

To enable the E2E workflow (`.github/workflows/e2e-staging.yml`), add the following **Repository secrets** (Settings → Secrets → Actions):

Required secrets:
- E2E_BASE_URL — e.g. https://staging.example.com
- STAGING_SMTP_HOST — SMTP host (or leave blank if using API provider)
- STAGING_SMTP_PORT — SMTP port
- STAGING_SMTP_USER — SMTP username / email
- STAGING_SMTP_PASS — SMTP password or app password
- MPESA_CONSUMER_KEY
- MPESA_CONSUMER_SECRET
- MPESA_SHORTCODE
- MPESA_PASSKEY
- MPESA_CALLBACK_URL — public callback URL for staging, e.g. https://staging.example.com/api/mpesa/callback

Optional (if you use Cloudinary uploads during tests):
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

How to trigger:
1. Add the secrets to your GitHub repository (Settings → Secrets & variables → Actions → New repository secret).
2. Open Actions → "E2E (staging)" and click "Run workflow" (or push to the `staging` branch / open a PR to `main`).

Notes:
- The workflow runs Playwright tests located at `e2e/playwright/` using the `E2E_BASE_URL` secret.
- Artifacts (HTML report, screenshots) will be uploaded to the workflow run for inspection on failure.
