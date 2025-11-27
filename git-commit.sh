#!/bin/bash

# Git commit script for Softhe.io improvements
# This script commits all changes with a detailed commit message

echo "🔍 Checking git status..."
git status

echo ""
echo "📝 Adding all changes..."
git add .

echo ""
echo "💾 Committing changes..."
git commit -m "refactor: improve security, accessibility, and code quality

- Move EmailJS credentials to environment variables (.env)
- Refactor Navbar to use NavLink for cleaner active state handling
- Add ARIA labels to social links and loading states for accessibility
- Reorganize documentation into docs/ directory (18 files moved)
- Create comprehensive setup and environment variable documentation
- Update GitHub Actions workflow with environment variables
- Add .env.example template and ENV_VARIABLES.md guide
- Create SETUP_CHECKLIST.md for developer onboarding
- Update README.md with environment setup instructions

Security Improvements:
- Extracted hardcoded EmailJS API keys to environment variables
- Updated Contact.jsx to use import.meta.env
- Added secrets to GitHub Actions deployment workflow

Code Quality:
- Replaced useLocation hook with NavLink in Navbar component
- Removed 5+ lines of boilerplate code
- More maintainable and idiomatic React Router usage

Documentation:
- Created ENV_VARIABLES.md with complete setup guide
- Created SETUP_CHECKLIST.md for new developers
- Created IMPROVEMENTS_2025.md with full changelog
- Updated README.md with new sections

All tests remain compatible and should pass without changes."

echo ""
echo "🚀 Pushing to main..."
git push origin main

echo ""
echo "✅ Done! Changes committed and pushed to main."
