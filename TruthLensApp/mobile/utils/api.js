// utils/api.js
// Change BASE_URL to your deployed backend URL when deploying to Render/Railway
// For local dev with Expo Go: use your machine's local IP, e.g. http://192.168.1.5:5000
export const BASE_URL = 'http://localhost:5000';

export async function analyzeNews({ url = '', title = '', text = '' }) {
  try {
    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, title, text }),
    });
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchNewsFeed(topics = ['technology'], gnewsKey = '', pageSize = 10) {
  try {
    const topicsStr = topics.join(',');
    const res = await fetch(
      `${BASE_URL}/api/news/feed?topics=${encodeURIComponent(topicsStr)}&apikey=${gnewsKey}&pageSize=${pageSize}`
    );
    return await res.json();
  } catch (e) {
    return { articles: [], error: e.message };
  }
}

export async function searchNews(query, gnewsKey = '') {
  try {
    const res = await fetch(
      `${BASE_URL}/api/news/search?q=${encodeURIComponent(query)}&apikey=${gnewsKey}`
    );
    return await res.json();
  } catch (e) {
    return { articles: [], error: e.message };
  }
}

export async function healthCheck() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    return await res.json();
  } catch (e) {
    return { status: 'offline', error: e.message };
  }
}

export function getVerdictColor(verdictClass) {
  switch (verdictClass) {
    case 'real': return '#22c55e';
    case 'fake': return '#ef4444';
    case 'mixed': return '#f59e0b';
    default: return '#94a3b8';
  }
}

export function getVerdictEmoji(verdictClass) {
  switch (verdictClass) {
    case 'real': return '✅';
    case 'fake': return '❌';
    case 'mixed': return '⚠️';
    default: return '🔍';
  }
}

export function getScoreColor(score) {
  if (score >= 65) return '#22c55e';
  if (score >= 35) return '#f59e0b';
  return '#ef4444';
}

export const TOPICS = [
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'health', label: 'Health', emoji: '🏥' },
  { id: 'politics', label: 'Politics', emoji: '🏛️' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'world', label: 'World', emoji: '🌍' },
];
