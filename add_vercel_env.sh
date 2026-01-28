#!/bin/bash
set -e

# Add all environment variables to Vercel for all environments

add_env() {
  local name=$1
  local value=$2
  
  for env in production preview development; do
    echo "Adding $name to $env..."
    echo "$value" | vercel env add "$name" "$env" 2>&1 | grep -E "✅|Already exists" || true
  done
}

# Firebase Variables
add_env "VITE_FIREBASE_API_KEY" "AIzaSyDzP0xxYVMyu-GPHX2EPSsk9BF17OxDttc"
add_env "VITE_FIREBASE_AUTH_DOMAIN" "equip-daily.firebaseapp.com"
add_env "VITE_FIREBASE_PROJECT_ID" "equip-daily"
add_env "VITE_FIREBASE_STORAGE_BUCKET" "equip-daily.firebasestorage.app"
add_env "VITE_FIREBASE_MESSAGING_SENDER_ID" "449502753790"
add_env "VITE_FIREBASE_APP_ID" "1:449502753790:web:b7aae5c4ba0300d08a06af"

# Bible API Key
add_env "VITE_BIBLE_API_KEY" "62vlBtnuEnjYym5Wj9OH2"

echo ""
echo "✅ All environment variables added to Vercel!"
echo ""
echo "📋 Next steps:"
echo "1. Whitelist your Vercel domain at https://scripture.api.bible"
echo "2. Add your Vercel domain to Firebase Authentication"
echo "3. Deploy with: vercel --prod"
