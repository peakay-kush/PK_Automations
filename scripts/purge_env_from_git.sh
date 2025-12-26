#!/usr/bin/env bash
# Helper script: show recommended commands to remove .env.local from history and force-push
# WARNING: These commands rewrite git history and are destructive. BACKUP your repo before running.

set -euo pipefail

echo "This helper prints the recommended commands to remove .env.local from the repository history." 

echo "Step 1: Remove file from current branch and commit"
echo "  git rm --cached .env.local || true"
echo "  git commit -m 'Remove .env.local from repo (sanitized)'"

echo ""

echo "Step 2: Use BFG to delete the file from history (recommended)"
echo "  # Install BFG (https://rtyley.github.io/bfg-repo-cleaner/) and run:"
echo "  git clone --mirror git@github.com:your-org/your-repo.git repo.git"
echo "  bfg --delete-files .env.local repo.git"
echo "  cd repo.git"
echo "  git reflog expire --expire=now --all && git gc --prune=now --aggressive"
echo "  git push --force"

echo ""

echo "Step 3 (alternate): Use git-filter-repo to remove specific paths"
echo "  git clone --bare git@github.com:your-org/your-repo.git repo.git"
echo "  cd repo.git"
echo "  git filter-repo --invert-paths --paths .env.local"
echo "  git push --force"

echo ""

echo "After you rewrite history, inform contributors to re-clone the repository and rotate any secrets." 

echo "For full rotation instructions, see SECURITY_ROTATION.md" 
