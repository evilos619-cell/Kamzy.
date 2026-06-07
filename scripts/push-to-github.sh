#!/usr/bin/env bash
# Auto-push to GitHub — uses GITHUB_PAT from Replit Secrets
set -e

if [ -z "$GITHUB_PAT" ]; then
  echo "❌ GITHUB_PAT secret is not set. Add it in Replit Secrets."
  exit 1
fi

REPO="https://$GITHUB_PAT@github.com/evilos619-cell/sammystore.git"

# Clear any stale git lock files (safe — only removes .lock files)
find .git -name "*.lock" -delete 2>/dev/null || true

# Configure identity for this session
git config user.email "sammystore@replit.dev"
git config user.name "Sammy Store Bot"
git config pull.rebase false

# Set authenticated remote (PAT embedded in URL)
git remote set-url origin "$REPO"

# Stop tracking attached_assets/ (already in .gitignore — remove from index if still tracked)
git rm -r --cached attached_assets/ 2>/dev/null || true

# Stage everything
git add -A

# Commit only if there are staged changes
if git diff --cached --quiet; then
  echo "✅ Nothing new to commit — already up to date."
else
  git commit -m "chore: auto-sync from Replit [$(date '+%Y-%m-%d %H:%M')]"
  echo "📦 Changes committed."
fi

# Pull remote changes first to avoid rejected pushes
git pull origin main --allow-unrelated-histories --no-edit 2>/dev/null || true

# Push to main
git push origin HEAD:main
echo "🚀 Successfully pushed to github.com/evilos619-cell/sammystore (main)"
