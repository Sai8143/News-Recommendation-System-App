"""
TruthLens – ML Model Training Script
Uses Passive-Aggressive Classifier (fast, accurate for text classification)
Dataset: fake_or_real_news.csv (from Kaggle)
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import PassiveAggressiveClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.pipeline import Pipeline
import re

# ── Config ──
DATA_PATH = 'fake_or_real_news.csv'
MODEL_OUTPUT = 'fake_news_model.pkl'
VECTORIZER_OUTPUT = 'vectorizer.pkl'

def clean_text(text):
    """Clean and normalize text"""
    if not isinstance(text, str):
        return ''
    text = text.lower()
    text = re.sub(r'http\S+|www\S+', '', text)          # Remove URLs
    text = re.sub(r'<[^>]+>', '', text)                  # Remove HTML tags
    text = re.sub(r'[^\w\s\']', ' ', text)               # Keep only word chars
    text = re.sub(r'\s+', ' ', text).strip()             # Normalize whitespace
    return text

def load_dataset(path):
    """Load dataset with automatic column detection"""
    print(f"Loading dataset from: {path}")
    df = pd.read_csv(path)
    print(f"Columns found: {df.columns.tolist()}")
    print(f"Shape: {df.shape}")

    # Auto-detect text and label columns
    text_col = None
    label_col = None

    for col in df.columns:
        col_lower = col.lower()
        if col_lower in ['text', 'content', 'body', 'article']:
            text_col = col
        elif col_lower == 'title' and text_col is None:
            text_col = col
        if col_lower in ['label', 'class', 'fake', 'real', 'target', 'type']:
            label_col = col

    if text_col is None or label_col is None:
        raise ValueError(f"Could not detect text/label columns. Found: {df.columns.tolist()}")

    print(f"Using text column: '{text_col}', label column: '{label_col}'")
    print(f"\nLabel distribution:\n{df[label_col].value_counts()}")
    return df, text_col, label_col

def prepare_labels(series):
    """Normalize labels to binary (0=fake, 1=real)"""
    labels = series.copy()
    label_map = {}
    unique = labels.dropna().unique()

    for val in unique:
        val_str = str(val).upper().strip()
        if val_str in ['REAL', 'TRUE', '1', 'LEGITIMATE', 'RELIABLE']:
            label_map[val] = 1
        else:
            label_map[val] = 0

    return labels.map(label_map)

def train_model(df, text_col, label_col):
    """Train the fake news detection model"""
    # Combine title + text if both exist
    if 'title' in df.columns and text_col != 'title':
        df['combined_text'] = df['title'].fillna('') + ' ' + df[text_col].fillna('')
    else:
        df['combined_text'] = df[text_col].fillna('')

    # Clean text
    print("\nCleaning text data...")
    df['cleaned'] = df['combined_text'].apply(clean_text)
    df = df.dropna(subset=[label_col])

    # Prepare labels
    labels = prepare_labels(df[label_col])
    df = df[labels.notna()]
    labels = labels[labels.notna()]

    print(f"Final dataset size: {len(df)} samples")
    print(f"Label distribution:\n{labels.value_counts()}")

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        df['cleaned'], labels, test_size=0.2, random_state=42, stratify=labels
    )

    print(f"\nTraining set: {len(X_train)}, Test set: {len(X_test)}")

    # TF-IDF Vectorizer
    print("\nFitting TF-IDF Vectorizer...")
    vectorizer = TfidfVectorizer(
        max_features=50000,
        ngram_range=(1, 2),       # Unigrams + bigrams
        min_df=2,
        max_df=0.95,
        sublinear_tf=True,        # Better for news text
        stop_words='english'
    )

    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    # Passive Aggressive Classifier (excellent for text, fast, online learning)
    print("Training Passive Aggressive Classifier...")
    pac = PassiveAggressiveClassifier(
        C=0.5,
        max_iter=1000,
        random_state=42,
        n_jobs=-1
    )
    pac.fit(X_train_tfidf, y_train)

    # Evaluate
    y_pred = pac.predict(X_test_tfidf)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"\n{'='*50}")
    print(f"Model Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['FAKE', 'REAL']))
    print(f"Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print(f"{'='*50}")

    return pac, vectorizer, accuracy

def save_models(model, vectorizer, model_path, vectorizer_path):
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    with open(vectorizer_path, 'wb') as f:
        pickle.dump(vectorizer, f)
    print(f"\n✓ Model saved: {model_path}")
    print(f"✓ Vectorizer saved: {vectorizer_path}")
    print(f"  Model size: {os.path.getsize(model_path) / 1024:.1f} KB")
    print(f"  Vectorizer size: {os.path.getsize(vectorizer_path) / 1024:.1f} KB")

def test_model(model, vectorizer):
    """Quick sanity test"""
    test_cases = [
        ("Scientists Discover New Cancer Treatment in Clinical Trial", 1),
        ("SHOCKING: Government HIDING Aliens in Area 51, BANNED Information", 0),
        ("Federal Reserve Raises Interest Rates by 0.25 Points", 1),
        ("You Won't BELIEVE What They're Putting in YOUR Water Supply", 0),
        ("Study: Mediterranean Diet Reduces Heart Disease Risk by 30%", 1),
    ]

    print("\n── Quick Sanity Test ──")
    for text, expected in test_cases:
        cleaned = clean_text(text)
        features = vectorizer.transform([cleaned])
        proba = model.predict_proba(features)[0]
        pred = 1 if proba[1] > 0.5 else 0
        status = "✓" if pred == expected else "✗"
        print(f"{status} [{proba[1]*100:.0f}% real] {text[:60]}...")

if __name__ == '__main__':
    if not os.path.exists(DATA_PATH):
        print(f"ERROR: Dataset not found at '{DATA_PATH}'")
        print("Download from: https://www.kaggle.com/datasets/jruvika/fake-news-detection")
        print("Expected columns: 'text' (or 'title') + 'label' (REAL/FAKE or 0/1)")
        exit(1)

    # Load data
    df, text_col, label_col = load_dataset(DATA_PATH)

    # Train
    model, vectorizer, accuracy = train_model(df, text_col, label_col)

    # Test
    test_model(model, vectorizer)

    # Save
    save_models(model, vectorizer, MODEL_OUTPUT, VECTORIZER_OUTPUT)

    print(f"\n🎉 Training complete! Accuracy: {accuracy*100:.1f}%")
    print("Copy fake_news_model.pkl and vectorizer.pkl to backend/ folder")
