# Security: Rotate & purge exposed secrets

On 2025-12-26 we removed sensitive secrets from `.env.local` in the repository. Follow these steps to finish rotating keys and to purge sensitive data from git history.

---

## 1) Immediate actions (must do now)

1. **Rotate every credential that may have been exposed** (Cloudinary API key/secret, Mpesa consumer key/secret/shortcode/passkey, EMAIL app password, JWT secrets):
   - Cloudinary: generate new API key/secret and revoke the old one.
   - Gmail / App password: revoke the existing app password and generate a new one OR switch to a transactional provider (SendGrid, Mailgun, Postmark) and revoke old credentials.
   - Mpesa: request new production credentials from Safaricom and revoke sandbox keys if appropriate.
   - JWT_SECRET: replace with a new strong secret and update any deployed environment variables.

2. **Update deployed environment variables** in your hosting platform / Docker secrets / CI (do not store secrets in plain git).

3. **Notify any team members** who may have the old keys so they stop using them.

---

## 2) Remove the sensitive file from the repo and commit the sanitized file

- We have already replaced the repository copy of `.env.local` with a sanitized version (placeholder values). Commit and push that change.

- Remove any local copies that are checked into other branches.

- Ensure `.gitignore` contains `.env.local` (it already does in this repo).

---

## 3) Purge secrets from git history (recommended)

> IMPORTANT: Purging rewrites git history and requires force-pushing. Coordinate with your team and create backups before proceeding.

Two common approaches:

A) Using BFG Repo Cleaner (easier):

1. Mirror-clone the repo:

```bash
git clone --mirror git@github.com:your-org/your-repo.git repo.git
```

2. Delete the `.env.local` file from history:

```bash
bfg --delete-files .env.local repo.git
```

(Or use `--replace-text` to replace specific secret strings.)

3. Run maintenance and push:

```bash
cd repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

B) Using git-filter-repo (more powerful):

1. Install git-filter-repo and run (example to remove `.env.local`):

```bash
git clone --bare git@github.com:your-org/your-repo.git repo.git
cd repo.git
git filter-repo --invert-paths --paths .env.local
git push --force
```

2. After rewriting history, inform all contributors to re-clone the repository (old clones will have the secret objects).

---

## 4) Post-purge steps

- After purging history, rotate all secrets again (because they may still be valid elsewhere).
- Update CI/CD secrets and server environment variables (do not commit these to git).
- Verify your app uses the secrets from environment variables or secret stores (e.g., Docker secrets, HashiCorp Vault, GitHub Secrets).
- If you used a cloud provider (Vercel, Netlify), ensure env vars are set in their dashboard and not in code.

---

## 5) Hardening & prevention (recommended)

- Add a `SECURITY.md` to your repo with security contacts and incident response instructions.
- Add pre-commit or CI checks to block committing `.env`/`.env.local` (e.g., detect patterns with `git-secrets` or `pre-commit` hooks).
- Move to a transactional email provider (SendGrid/Postmark) with dedicated keys and monitoring.
- Backup `data/users.db` and implement rotation/backup schedule.
- Consider using a proper DB (Postgres) for production.

---

If you want, I can:
- Run the BFG or git-filter-repo commands for you (I can prepare the exact commands and a step-by-step script), or
- Add a pre-commit hook and a GitHub Action that denies commits containing secret-like patterns.

Tell me which follow-up you want and I’ll proceed. (Recommended next step: rotate credentials now, then run BFG to purge history.)
