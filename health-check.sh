#!/bin/bash

echo "🏥 EQUIP DAILY - HEALTH CHECK"
echo "================================"
echo ""

# Check Node and NPM
echo "1️⃣  Node & NPM Versions:"
node --version
npm --version
echo ""

# Check if .env exists
echo "2️⃣  Environment Variables:"
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo "Variables found:"
    grep -E "^VITE_" .env | sed 's/=.*/=***/'
else
    echo "⚠️  .env file not found! Copy .env.example to .env"
fi
echo ""

# Check dependencies
echo "3️⃣  Dependencies:"
if [ -d node_modules ]; then
    echo "✅ node_modules exists"
else
    echo "❌ node_modules missing - run: npm install"
fi
echo ""

# Check key files
echo "4️⃣  Configuration Files:"
[ -f vercel.json ] && echo "✅ vercel.json" || echo "❌ vercel.json missing"
[ -f .env.example ] && echo "✅ .env.example" || echo "❌ .env.example missing"
[ -f DEPLOYMENT.md ] && echo "✅ DEPLOYMENT.md" || echo "❌ DEPLOYMENT.md missing"
[ -f src/config/constants.js ] && echo "✅ constants.js" || echo "❌ constants.js missing"
echo ""

# Test build
echo "5️⃣  Build Test:"
echo "Running build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build successful"
    if [ -d dist ]; then
        echo "✅ dist/ folder created"
        echo "   Size: $(du -sh dist | cut -f1)"
    fi
else
    echo "❌ Build failed - check errors with: npm run build"
fi
echo ""

# Check API configuration
echo "6️⃣  API Configuration:"
echo "Checking Bible API key usage..."
grep -r "VITE_BIBLE_API_KEY" src/ --include="*.jsx" --include="*.js" | wc -l | xargs echo "   Found in files:"
grep -r "api.scripture.api.bible" src/ --include="*.jsx" --include="*.js" | wc -l | xargs echo "   API calls found:"
echo ""

echo "================================"
echo "Health check complete! ✅"
echo ""
echo "📚 Next Steps:"
echo "1. Ensure .env file has all required variables"
echo "2. Whitelist your domain at scripture.api.bible"
echo "3. Add environment variables to Vercel"
echo "4. Deploy with: vercel or via GitHub integration"
echo ""
