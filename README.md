# Equip Daily

**For the equipping of the saints.**

A daily devotional web app with integrated Bible study features, built with React + Vite + Firebase.

**🎯 Vision**: Multi-platform devotional and Bible study experience — currently available as a web app, with iOS and Android apps planned for the future.

## ✍️ Author

Jonathan Vargas — Sebastian, Florida

Author of the devotionals and the application.

## 🚀 Features

### Core Features
- 📖 Daily devotional readings (365 days)
- 📚 Integrated Bible study with multiple translations
- 🔍 Bible search functionality
- ✏️ Personal notes and highlights
- 🎨 6-color highlighting system
- 🔐 User authentication with Firebase
- 📱 Progressive Web App (PWA) support
- 🌙 Dark mode support

### Bible Study Features
- **📖 Reading Mode** - Passive reading with note pills, perfect for meditation
- **📝 Study Mode** - Active annotation with verse selection and inline note editor
- **🎨 Color Palette** - Instant multi-verse highlighting (yellow, blue, green, pink, orange, purple)
- **📋 Copy/Paste** - Clipboard integration for flexible note composition
- **👆 Long Press** - Quick note entry on selected verses (Study Mode)
- **✅ Verse Selection** - Multi-select verses with checkmarks
- **📍 Chapter Tracking** - Mark chapters as read with progress visualization
- **🔊 Audio Playback** - Listen to chapters with fallback version support
- **👈👉 Swipe Navigation** - Change chapters with left/right swipes (auto-scrolls to top)
- **💡 Contextual Tips** - Smart header guidance for Bible and Devotional tabs
- **🔗 Note Sharing** - Share verses with personal notes (future: collaborative viewing)

### Community Features
- 👥 Community reflections per chapter
- 🍎 Fruit of the Spirit reactions (9 fruits)
- 📅 Reading Plans (calendar integration)

## 📱 Platform Roadmap

| Platform | Status | Notes |
|----------|--------|-------|
| Web App  | ✅ Live | Full-featured at equip-daily.vercel.app |
| iOS App  | 🗓️ Planned | React Native or native Swift |
| Android App | 🗓️ Planned | React Native or native Kotlin |

All platforms will share the same backend API (Vercel serverless functions + Firebase).

## 🛠️ Tech Stack

- **Frontend**: React 18 with Vite
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Bible API**: API.Bible
- **Styling**: CSS with custom themes
- **PWA**: vite-plugin-pwa
- **Backend**: Vercel Serverless Functions

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/jaytrust150/equip-daily.git

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add your API keys to .env
```

## 🔧 Configuration

Create a `.env` file with the following variables:

```env
# Firebase Configuration (Client-side)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Bible API Configuration (Server-side)
BIBLE_API_KEY=your_bible_api_key
```

**Note:** `BIBLE_API_KEY` (without VITE_ prefix) is used by serverless functions and stays secure on the server.

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📤 Deployment

**Primary Method:** Deploy to Vercel with serverless functions

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jaytrust150/equip-daily)

**After deployment:**
1. Add environment variables in Vercel Dashboard (7 variables)
2. Include `BIBLE_API_KEY` for serverless functions
3. Deploy automatically on git push

### Local Development with Serverless Functions

```bash
# Install Vercel CLI
npm i -g vercel

# Run with serverless function simulation
vercel dev
```

## 📖 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete Vercel deployment guide
- **[SERVERLESS_PROXY_GUIDE.md](SERVERLESS_PROXY_GUIDE.md)** - How the API proxy works
- **[HEALTH_CHECK.md](HEALTH_CHECK.md)** - System health check results

## 📚 Bible API Setup

**✅ Secure Serverless Proxy Implementation**

This app uses a **serverless proxy pattern** to keep your API key secure:

```
Frontend → /api/bible-* → API.Bible (key stays on server)
```

### Quick Setup:

1. Get an API key from [scripture.api.bible](https://scripture.api.bible)
2. Add to Vercel: Environment Variable `BIBLE_API_KEY` (without VITE_ prefix)
3. ✅ Done! No domain whitelisting needed

**📖 Full Guide:** See [SERVERLESS_PROXY_GUIDE.md](SERVERLESS_PROXY_GUIDE.md)

### Why This Approach?

- 🔒 **Secure**: API key never exposed in browser
- 🛡️ **No GitHub alerts**: Key stays server-side
- 🌐 **No CORS issues**: Calls your own domain
- ✅ **Professional**: Industry-standard architecture

## 🔐 Security Notes

- `.env` is in `.gitignore` - never commit your API keys
- **NEW:** Bible API key is server-side only (secure serverless proxy)
- No GitHub security alerts - key never exposed in client code
- Firebase security rules should be configured in Firebase Console
- API.Bible calls are proxied through `/api/bible-*` endpoints

## 📖 Project Structure

```
equip-daily/
├── api/                  # 🔒 Serverless functions (Vercel)
│   ├── bible-chapter.js  # Proxies chapter requests
│   └── bible-search.js   # Proxies search requests
├── public/               # Static assets and devotional text files
├── src/
│   ├── components/       # React components
│   ├── config/           # Configuration files
│   ├── data/             # Static data (Bible translations, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Main page components
│   ├── services/         # API and Firebase services
│   └── bibleData.ts      # Bible book mappings
├── .env.example          # Example environment variables
├── DEPLOYMENT.md         # Detailed deployment guide
├── SERVERLESS_PROXY_GUIDE.md  # API proxy documentation
└── vercel.json           # Vercel configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**jaytrust150**

## 🙏 Acknowledgments

- Bible text provided by [API.Bible](https://scripture.api.bible)
- Built with React and Vite
- Powered by Firebase
