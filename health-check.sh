#!/bin/bash

echo "🏥 EQUIP DAILY - HEALTH CHECK"
echo "========================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node and NPM
echo "1️⃣  Node & NPM Versions:"
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "   Node: $NODE_VERSION"
echo "   NPM:  $NPM_VERSION"
echo ""

# Check if .env exists
echo "2️⃣  Environment Variables:"
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo "   Required variables:"
    for var in VITE_FIREBASE_API_KEY VITE_FIREBASE_PROJECT_ID BIBLE_API_KEY VITE_SENTRY_DSN; do
        if grep -q "^${var}=" .env; then
            echo "   ✅ $var"
        else
            echo "   ⚠️  $var missing"
        fi
    done
else
    echo "❌ .env file not found! Copy .env.example to .env"
fi
echo ""

# Check dependencies
echo "3️⃣  Dependencies:"
if [ -d node_modules ]; then
    echo "✅ node_modules exists"
    echo "   Total packages: $(ls node_modules | wc -l)"
else
    echo "❌ node_modules missing - run: npm install"
fi
echo ""

# Check key files
echo "4️⃣  Configuration Files:"
FILES=("vercel.json" ".env.example" "DEPLOYMENT.md" "src/config/constants.js" "src/config/firebase.js" "vite.config.js" "vitest.config.js" "playwright.config.js" "eslint.config.js")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file missing"
    fi
done
echo ""

# Check source structure
echo "5️⃣  Source Structure:"
DIRS=("src/components" "src/features" "src/services" "src/hooks" "api")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir"
    else
        echo "❌ $dir missing"
    fi
done
echo ""

# ESLint check
echo "6️⃣  Code Quality - ESLint:"
if npm run lint 2>/dev/null | grep -q "error\|warning"; then
    ESLINT_ISSUES=$(npm run lint 2>&1 | grep -c "error\|warning" || true)
    echo "⚠️  Linting issues found: $ESLINT_ISSUES"
else
    echo "✅ No linting issues detected"
fi
echo ""

# Test suite check
echo "7️⃣  Unit Tests (Vitest):"
if npm run test:run -- --reporter=verbose 2>/dev/null | grep -q "PASS\|FAIL"; then
    TEST_RESULTS=$(npm run test:run 2>&1 | tail -3)
    echo "   Test output:"
    echo "$TEST_RESULTS" | sed 's/^/   /'
else
    echo "ℹ️  Run tests with: npm run test:run"
fi
echo ""

# E2E tests check
echo "8️⃣  E2E Tests (Playwright):"
if [ -f playwright.config.js ]; then
    echo "✅ playwright.config.js exists"
    TEST_COUNT=$(find e2e -name "*.spec.js" 2>/dev/null | wc -l)
    echo "   E2E test files: $TEST_COUNT"
else
    echo "❌ playwright.config.js missing"
fi
echo ""

# Build test
echo "9️⃣  Build Test:"
echo "   Running build..."
if npm run build > /tmp/build.log 2>&1; then
    echo "✅ Build successful"
    if [ -d dist ]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        FILE_COUNT=$(find dist -type f | wc -l)
        echo "   ✅ dist/ folder created"
        echo "   Size: $DIST_SIZE | Files: $FILE_COUNT"
    fi
else
    echo "❌ Build failed"
    echo "   Last 5 errors:"
    tail -5 /tmp/build.log | sed 's/^/   /'
fi
echo ""

# Firebase Configuration Check
echo "🔟 Firebase Configuration:"
if grep -q "VITE_FIREBASE_PROJECT_ID" .env 2>/dev/null; then
    PROJECT_ID=$(grep "^VITE_FIREBASE_PROJECT_ID" .env 2>/dev/null | cut -d'=' -f2)
    echo "✅ Firebase configured for: $PROJECT_ID"
else
    echo "⚠️  Firebase configuration incomplete"
fi
echo ""

# Bible API Configuration Check
echo "1️⃣1️⃣  Bible API Configuration:"
if grep -q "BIBLE_API_KEY" .env 2>/dev/null; then
    echo "✅ BIBLE_API_KEY configured (serverless proxy)"
    grep -r "/api/bible-" api/*.js >/dev/null 2>&1 && echo "✅ Serverless proxy endpoints found"
else
    echo "⚠️  BIBLE_API_KEY not configured"
fi
echo ""

# Sentry Monitoring Check
echo "1️⃣2️⃣  Sentry Monitoring:"
if grep -q "VITE_SENTRY_DSN" .env 2>/dev/null; then
    echo "✅ Sentry DSN configured"
    grep -r "@sentry/react" src/ --include="*.jsx" >/dev/null 2>&1 && echo "✅ Sentry integration found"
else
    echo "ℹ️  Sentry not configured (optional)"
fi
echo ""

# PWA Check
echo "1️⃣3️⃣  PWA/Service Worker:"
if grep -q "vite-plugin-pwa" package.json; then
    echo "✅ PWA plugin installed"
    [ -f public/manifest.json ] && echo "✅ Manifest file present" || echo "⚠️  Manifest file missing"
else
    echo "❌ PWA plugin not installed"
fi
echo ""

# Documentation Check
echo "1️⃣4️⃣  Documentation:"
DOCS=("CODE_LINE_BY_LINE.md" "DEPLOYMENT.md" "SERVERLESS_PROXY_GUIDE.md" "TESTING_GUIDE.md")
for doc in "${DOCS[@]}"; do
    [ -f "$doc" ] && echo "✅ $doc" || echo "❌ $doc missing"
done
echo ""

# Git Check
echo "1️⃣5️⃣  Git & Pre-commit Hooks:"
if [ -d .git ]; then
    echo "✅ Git repository"
    if [ -f .husky/pre-commit ]; then
        echo "✅ Husky pre-commit hooks"
        grep -q "lint-staged\|npm run" .husky/pre-commit && echo "✅ Lint-staged configured"
    else
        echo "⚠️  Husky pre-commit hook missing"
    fi
else
    echo "❌ Not a Git repository"
fi
echo ""

# Summary
echo "========================================"
echo "✅ Health check complete!"
echo ""
echo "📚 Documentation:"
echo "   • README.md - Project overview"
echo "   • DEPLOYMENT.md - Deployment guide"
echo "   • SERVERLESS_PROXY_GUIDE.md - API proxy info"
echo "   • TESTING_GUIDE.md - Testing procedures"
echo ""
echo "🚀 Quick commands:"
echo "   npm run dev          - Start development server"
echo "   npm run build        - Build for production"
echo "   npm run lint         - Check code quality"
echo "   npm run test:run     - Run unit tests"
echo "   npm run test:e2e     - Run E2E tests"
echo "   vercel dev           - Local Vercel emulation"
echo ""
