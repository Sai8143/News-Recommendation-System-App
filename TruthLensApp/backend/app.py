"""
TruthLens Backend API
AI-powered Fake News Detector + Personalized News Recommender
Uses: GNews API (free), MediaStack (free), heuristic ML analysis
No Docker, No PostgreSQL – runs with: python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os, re, json, pickle, hashlib
from datetime import datetime
import requests

app = Flask(__name__)
CORS(app)

# ── Load ML model if present ──
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'fake_news_model.pkl')
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), 'vectorizer.pkl')
model = None
vectorizer = None

try:
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    with open(VECTORIZER_PATH, 'rb') as f:
        vectorizer = pickle.load(f)
    print("✓ ML models loaded")
except Exception as e:
    print(f"⚠ ML models not found, using heuristics only: {e}")

# ── In-memory user profiles (no DB needed) ──
user_profiles = {}

TRUSTED_DOMAINS = {
    'bbc.com','bbc.co.uk','reuters.com','apnews.com','npr.org',
    'theguardian.com','nytimes.com','washingtonpost.com','economist.com',
    'nature.com','science.org','scientificamerican.com','time.com',
    'theatlantic.com','politifact.com','snopes.com','factcheck.org',
    'bloomberg.com','ft.com','wsj.com','pbs.org','propublica.org',
    'thehindu.com','ndtv.com','indianexpress.com','livemint.com'
}

UNTRUSTED_DOMAINS = {
    'infowars.com','naturalnews.com','beforeitsnews.com',
    'worldnewsdailyreport.com','empirenews.net','nationalreport.net',
    'huzlers.com','anonews.co','newspunch.com'
}

CLICKBAIT_PATTERNS = [
    r'\bshocking\b', r'\bunbelievable\b', r'you won\'t believe',
    r'\bsecret\b.*\bexposed\b', r'\bbombshell\b', r'\burgent\b',
    r'\bbanned\b', r'\bcensored\b', r'they don\'t want you',
    r'hidden truth', r'wake up', r'\bdeep state\b'
]

def extract_domain(url):
    try:
        from urllib.parse import urlparse
        return urlparse(url).netloc.replace('www.', '')
    except:
        return ''

def heuristic_analysis(text, url='', title=''):
    score = 50
    signals = []
    content = (title + ' ' + text).lower()
    domain = extract_domain(url)

    if any(d in domain for d in TRUSTED_DOMAINS):
        score += 30
        signals.append({'type': 'good', 'label': 'Trusted source'})
    elif any(d in domain for d in UNTRUSTED_DOMAINS):
        score -= 40
        signals.append({'type': 'bad', 'label': 'Known misinformation site'})

    if url.startswith('https://'):
        score += 5
        signals.append({'type': 'good', 'label': 'Secure HTTPS'})

    clickbait_count = sum(1 for p in CLICKBAIT_PATTERNS if re.search(p, content, re.I))
    if clickbait_count >= 3:
        score -= 20
        signals.append({'type': 'bad', 'label': f'{clickbait_count} clickbait patterns detected'})
    elif clickbait_count == 0:
        score += 8
        signals.append({'type': 'good', 'label': 'No clickbait detected'})

    words = title.split()
    if words:
        caps_ratio = sum(1 for w in words if w.isupper() and len(w) > 2) / len(words)
        if caps_ratio > 0.4:
            score -= 15
            signals.append({'type': 'bad', 'label': 'Excessive capitalization'})

    if re.search(r'\bby\s+[A-Z][a-z]+|author:|reporter:', text, re.I):
        score += 8
        signals.append({'type': 'good', 'label': 'Author attributed'})
    else:
        signals.append({'type': 'neutral', 'label': 'No clear author'})

    if re.search(r'according to|study shows|research|data shows|scientists|experts say', content, re.I):
        score += 10
        signals.append({'type': 'good', 'label': 'Cites sources/research'})

    emotional = ['outrage', 'infuriating', 'disgusting', 'horrifying', 'they\'re lying']
    if any(w in content for w in emotional):
        score -= 12
        signals.append({'type': 'bad', 'label': 'Emotional manipulation language'})

    word_count = len(text.split())
    if word_count > 400:
        score += 8
        signals.append({'type': 'good', 'label': 'In-depth article'})
    elif word_count < 50:
        score -= 5
        signals.append({'type': 'neutral', 'label': 'Very short content'})

    return max(0, min(100, score)), signals

def ml_predict(text):
    if model is None or vectorizer is None:
        return None
    try:
        features = vectorizer.transform([text])
        proba = model.predict_proba(features)[0]
        return int(proba[1] * 100)
    except:
        return None

def generate_verdict(score):
    if score >= 65:
        return 'CREDIBLE', 'real'
    elif score >= 35:
        return 'MIXED', 'mixed'
    else:
        return 'LIKELY FAKE', 'fake'

# ═══════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': model is not None, 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    url = data.get('url', '')
    title = data.get('title', '')
    text = data.get('text', '')

    if not any([url, title, text]):
        return jsonify({'error': 'Provide url, title, or text'}), 400

    combined_text = f"{title} {text}".strip()
    domain = extract_domain(url)

    heuristic_score, signals = heuristic_analysis(combined_text, url, title)
    ml_score = ml_predict(combined_text)
    final_score = round(heuristic_score * 0.4 + ml_score * 0.6) if ml_score is not None else heuristic_score

    verdict, verdict_class = generate_verdict(final_score)

    if final_score >= 65:
        summary = f"This article appears credible. Positive trust signals detected from '{domain or 'the source'}'."
    elif final_score >= 35:
        summary = f"Mixed credibility signals from '{domain or 'this source'}'. Verify through multiple trusted sources."
    else:
        bad_signals = [s['label'] for s in signals if s['type'] == 'bad']
        summary = f"Red flags detected: {', '.join(bad_signals[:3])}. Exercise caution before sharing."

    return jsonify({
        'verdict': verdict,
        'verdictClass': verdict_class,
        'score': final_score,
        'heuristicScore': heuristic_score,
        'mlScore': ml_score,
        'signals': signals[:6],
        'summary': summary,
        'domain': domain,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/news/feed', methods=['GET'])
def news_feed():
    """Fetch personalized news using GNews free API"""
    topics = request.args.get('topics', 'technology').split(',')
    gnews_key = request.args.get('apikey', '')
    page_size = int(request.args.get('pageSize', '10'))

    articles = []

    if gnews_key:
        for topic in topics[:2]:
            try:
                resp = requests.get(
                    f"https://gnews.io/api/v4/top-headlines",
                    params={'topic': topic.strip(), 'lang': 'en', 'max': page_size, 'apikey': gnews_key},
                    timeout=8
                )
                data = resp.json()
                for article in data.get('articles', []):
                    url = article.get('url', '')
                    title = article.get('title', '')
                    domain = extract_domain(url)
                    score, signals = heuristic_analysis(title, url, title)
                    verdict, verdict_class = generate_verdict(score)
                    articles.append({
                        'id': hashlib.md5(url.encode()).hexdigest()[:8],
                        'title': title,
                        'source': article.get('source', {}).get('name', domain),
                        'url': url,
                        'publishedAt': article.get('publishedAt', ''),
                        'description': article.get('description', ''),
                        'image': article.get('image', ''),
                        'score': score,
                        'verdict': verdict,
                        'verdictClass': verdict_class,
                        'domain': domain,
                        'topic': topic.strip()
                    })
            except Exception as e:
                print(f"GNews error for topic {topic}: {e}")
    else:
        # Return sample data when no API key
        articles = [
            {
                'id': 'demo1',
                'title': 'Add your GNews API key in Settings to load real news',
                'source': 'TruthLens',
                'url': 'https://gnews.io',
                'publishedAt': datetime.utcnow().isoformat(),
                'description': 'Get a free API key at gnews.io to fetch real personalized news',
                'image': '',
                'score': 80,
                'verdict': 'CREDIBLE',
                'verdictClass': 'real',
                'domain': 'gnews.io',
                'topic': topics[0]
            }
        ]

    # Sort by score descending (credible first)
    articles.sort(key=lambda x: x['score'], reverse=True)
    return jsonify({'articles': articles, 'count': len(articles)})

@app.route('/api/news/search', methods=['GET'])
def search_news():
    """Search news by query using GNews"""
    q = request.args.get('q', '')
    gnews_key = request.args.get('apikey', '')

    if not q:
        return jsonify({'articles': [], 'count': 0})

    articles = []
    if gnews_key:
        try:
            resp = requests.get(
                f"https://gnews.io/api/v4/search",
                params={'q': q, 'lang': 'en', 'max': 10, 'apikey': gnews_key},
                timeout=8
            )
            data = resp.json()
            for article in data.get('articles', []):
                url = article.get('url', '')
                title = article.get('title', '')
                domain = extract_domain(url)
                score, signals = heuristic_analysis(title, url, title)
                verdict, verdict_class = generate_verdict(score)
                articles.append({
                    'id': hashlib.md5(url.encode()).hexdigest()[:8],
                    'title': title,
                    'source': article.get('source', {}).get('name', domain),
                    'url': url,
                    'publishedAt': article.get('publishedAt', ''),
                    'description': article.get('description', ''),
                    'image': article.get('image', ''),
                    'score': score,
                    'verdict': verdict,
                    'verdictClass': verdict_class,
                    'domain': domain
                })
        except Exception as e:
            return jsonify({'error': str(e), 'articles': []}), 200

    return jsonify({'articles': articles, 'count': len(articles)})

@app.route('/api/profile', methods=['GET', 'POST'])
def profile():
    """Get or update user profile (stored in memory)"""
    user_id = request.args.get('uid', 'default')
    if request.method == 'POST':
        data = request.get_json()
        user_profiles[user_id] = data
        return jsonify({'status': 'saved', 'profile': data})
    else:
        default_profile = {
            'name': 'News Reader',
            'interests': ['technology', 'science', 'health'],
            'scanned': 0,
            'fakeDetected': 0
        }
        return jsonify(user_profiles.get(user_id, default_profile))

@app.route('/api/batch', methods=['POST'])
def batch_analyze():
    data = request.get_json()
    articles = data.get('articles', [])
    results = []
    for article in articles[:20]:
        url = article.get('url', '')
        title = article.get('title', '')
        text = article.get('text', '')
        domain = extract_domain(url)
        score, signals = heuristic_analysis(f"{title} {text}", url, title)
        ml_score = ml_predict(f"{title} {text}")
        final_score = round(score * 0.4 + ml_score * 0.6) if ml_score else score
        verdict, verdict_class = generate_verdict(final_score)
        results.append({'title': title, 'url': url, 'domain': domain, 'score': final_score, 'verdict': verdict, 'verdictClass': verdict_class})
    return jsonify({'results': results})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 TruthLens Backend running on http://localhost:{port}")
    app.run(debug=True, host='0.0.0.0', port=port)
