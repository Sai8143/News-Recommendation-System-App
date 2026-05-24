# 🛡️ TruthLens – AI Fake News Detector + Personalized News App

A full-stack mobile app built with **React Native (Expo Go)** + **Python Flask** backend.

## 📁 Project Structure

```
TruthLensApp/
├── backend/           ← Python Flask API
│   ├── app.py
│   ├── requirements.txt
│   ├── fake_news_model.pkl  ← (copy from original project if available)
│   └── vectorizer.pkl       ← (copy from original project if available)
│
└── mobile/            ← React Native Expo App
    ├── App.js
    ├── app.json
    ├── package.json
    ├── screens/
    │   ├── AnalyzeScreen.js   ← Fake news detector
    │   ├── FeedScreen.js      ← Personalized news feed
    │   ├── SearchScreen.js    ← Search news
    │   ├── HistoryScreen.js   ← Analysis history
    │   └── ProfileScreen.js  ← Settings + API keys
    ├── hooks/
    │   └── useStorage.js      ← AsyncStorage hooks
    └── utils/
        └── api.js             ← API calls + utilities
```

## 🚀 Quick Start (2 Steps)

### Step 1: Start the Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs at: **http://localhost:5000**

> **For Expo Go on your phone:** Replace `localhost` in `mobile/utils/api.js` with your
> machine's local IP address (e.g., `http://192.168.1.10:5000`)
> Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### Step 2: Start the Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone.

## 🔑 Free API Key Setup

To load real news in Feed and Search tabs, you need a **free** GNews API key:

1. Go to **https://gnews.io** → Sign up free
2. Copy your API key
3. Open the app → **Profile tab** → paste your API key
4. ✅ Done! Your feed now loads real news.

**GNews Free Plan:** 100 requests/day, no credit card required.

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 Analyze | Paste text or URL to detect fake news |
| 📰 Personalized Feed | News based on your selected interests |
| 🔎 Search | Search any news topic |
| 📋 History | All your past analyses |
| 👤 Profile | Interests, API key, stats |

## 🧠 How It Works

### Fake News Detection
1. **Heuristic Analysis** – domain reputation, clickbait patterns, HTTPS, author attribution, citation signals, emotional language
2. **ML Model** (optional) – Passive-Aggressive Classifier trained on fake/real news dataset (copy `.pkl` files from original extension project)
3. **Combined Score** – 60% ML + 40% heuristic (or 100% heuristic if no model)

### Personalized Recommendations
- Topics selected in Profile filter the GNews API feed
- Articles sorted by credibility score (credible articles shown first)
- Filter by verdict: All / Credible / Mixed / Fake

## 📱 Screens

- **Analyze** – Input text or URL → get verdict, score, trust signals
- **Feed** – Personalized news by topic with credibility badges
- **Search** – Real-time news search with misinformation flags
- **History** – All past scans with stats
- **Profile** – Name, interests, GNews API key, backend status check

## 🔧 Copy ML Models (Optional but recommended)

Copy your trained models from the original extension project:

```bash
cp FakeNewsDetectionExtension/backend/fake_news_model.pkl TruthLensApp/backend/
cp FakeNewsDetectionExtension/backend/vectorizer.pkl TruthLensApp/backend/
```

This enables the ML model for better accuracy.

## 🌐 Deploy Backend Free (Optional)

Deploy to **Render.com** (free tier):
1. Push backend/ folder to GitHub
2. Create new Web Service on render.com
3. Build command: `pip install -r requirements.txt`
4. Start command: `python app.py`
5. Update `BASE_URL` in `mobile/utils/api.js` to your Render URL

## 📦 Tech Stack

| Layer | Tech |
|---|---|
| Mobile | React Native + Expo Go |
| Navigation | React Navigation (Bottom Tabs) |
| Storage | AsyncStorage (no database needed) |
| Backend | Python Flask + Flask-CORS |
| News API | GNews (free) |
| ML | scikit-learn (Passive-Aggressive Classifier + TF-IDF) |
| Analysis | Heuristic rule engine |
