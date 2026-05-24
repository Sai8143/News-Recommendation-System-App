// screens/AnalyzeScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Animated, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyzeNews, getVerdictColor, getScoreColor, getVerdictEmoji } from '../utils/api';
import { useProfile, useHistory } from '../hooks/useStorage';

const DARK = {
  bg: '#0f172a', surface: '#1e293b', surface2: '#273449',
  border: '#334155', text: '#f1f5f9', muted: '#94a3b8',
  primary: '#6366f1', green: '#22c55e', red: '#ef4444', yellow: '#f59e0b'
};

export default function AnalyzeScreen() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'url'
  const [profile, saveProfile] = useProfile();
  const [history, saveHistory] = useHistory();

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim()) {
      Alert.alert('Empty Input', 'Please enter a news article or URL to analyze.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const isUrl = inputText.startsWith('http://') || inputText.startsWith('https://');
      const payload = isUrl
        ? { url: inputText.trim() }
        : inputMode === 'url'
          ? { url: inputText.trim() }
          : { text: inputText.trim() };

      const data = await analyzeNews(payload);
      if (data.error) {
        Alert.alert('Error', `Could not analyze: ${data.error}\n\nMake sure backend is running.`);
        return;
      }
      setResult(data);

      // Update stats and history
      const newScanned = (profile.scanned || 0) + 1;
      const newFake = (profile.fakeDetected || 0) + (data.verdictClass === 'fake' ? 1 : 0);
      saveProfile({ ...profile, scanned: newScanned, fakeDetected: newFake });

      const entry = {
        id: Date.now().toString(),
        text: inputText.trim().substring(0, 120),
        verdict: data.verdict,
        verdictClass: data.verdictClass,
        score: data.score,
        timestamp: new Date().toISOString(),
      };
      saveHistory([entry, ...history].slice(0, 50));
    } catch (e) {
      Alert.alert('Connection Error', 'Cannot reach backend. Make sure it is running at localhost:5000');
    } finally {
      setLoading(false);
    }
  }, [inputText, inputMode, profile, history]);

  const clearAll = () => { setInputText(''); setResult(null); };

  const ScoreCircle = ({ score }) => {
    const color = getScoreColor(score);
    return (
      <View style={[styles.scoreCircle, { borderColor: color }]}>
        <Text style={[styles.scoreNum, { color }]}>{score}</Text>
        <Text style={[styles.scoreLabel, { color: DARK.muted }]}>/ 100</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🛡️ TruthLens</Text>
          <Text style={styles.subtitle}>AI-Powered Fake News Detector</Text>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeRow}>
          {['text', 'url'].map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.modeBtn, inputMode === mode && styles.modeBtnActive]}
              onPress={() => setInputMode(mode)}
            >
              <Ionicons
                name={mode === 'text' ? 'document-text-outline' : 'link-outline'}
                size={16}
                color={inputMode === mode ? '#fff' : DARK.muted}
              />
              <Text style={[styles.modeTxt, inputMode === mode && styles.modeTxtActive]}>
                {mode === 'text' ? 'Paste Article Text' : 'Enter URL'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, inputMode === 'text' && { height: 140 }]}
            placeholder={
              inputMode === 'url'
                ? 'https://example.com/news-article'
                : 'Paste news article text here to check if it\'s real or fake...'
            }
            placeholderTextColor={DARK.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline={inputMode === 'text'}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType={inputMode === 'url' ? 'go' : 'default'}
            onSubmitEditing={inputMode === 'url' ? handleAnalyze : undefined}
          />
          {inputText.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
              <Ionicons name="close-circle" size={20} color={DARK.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Analyze Button */}
        <TouchableOpacity
          style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Ionicons name="scan-outline" size={20} color="#fff" />
                <Text style={styles.analyzeTxt}>Analyze Now</Text>
              </>
          }
        </TouchableOpacity>

        {/* Result Card */}
        {result && (
          <View style={styles.resultCard}>
            {/* Verdict Header */}
            <View style={[styles.verdictBanner, { backgroundColor: getVerdictColor(result.verdictClass) + '22' }]}>
              <Text style={styles.verdictEmoji}>{getVerdictEmoji(result.verdictClass)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.verdictText, { color: getVerdictColor(result.verdictClass) }]}>
                  {result.verdict}
                </Text>
                <Text style={styles.verdictSource}>{result.domain || 'Unknown source'}</Text>
              </View>
              <ScoreCircle score={result.score} />
            </View>

            {/* Summary */}
            <Text style={styles.summary}>{result.summary}</Text>

            {/* Signals */}
            {result.signals && result.signals.length > 0 && (
              <View style={styles.signalsWrap}>
                <Text style={styles.signalsTitle}>Trust Signals</Text>
                {result.signals.map((s, i) => (
                  <View key={i} style={styles.signalRow}>
                    <Ionicons
                      name={s.type === 'good' ? 'checkmark-circle' : s.type === 'bad' ? 'close-circle' : 'remove-circle'}
                      size={16}
                      color={s.type === 'good' ? DARK.green : s.type === 'bad' ? DARK.red : DARK.yellow}
                    />
                    <Text style={styles.signalLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Score Breakdown */}
            <View style={styles.scoreRow}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreItemLabel}>Heuristic</Text>
                <Text style={[styles.scoreItemVal, { color: getScoreColor(result.heuristicScore) }]}>
                  {result.heuristicScore}
                </Text>
              </View>
              {result.mlScore != null && (
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemLabel}>ML Model</Text>
                  <Text style={[styles.scoreItemVal, { color: getScoreColor(result.mlScore) }]}>
                    {result.mlScore}
                  </Text>
                </View>
              )}
              <View style={styles.scoreItem}>
                <Text style={styles.scoreItemLabel}>Final Score</Text>
                <Text style={[styles.scoreItemVal, { color: getScoreColor(result.score) }]}>
                  {result.score}
                </Text>
              </View>
            </View>

            <Text style={styles.analysisTime}>
              Analyzed {new Date(result.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Tips */}
        {!result && !loading && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>How to use</Text>
            {[
              '📋 Paste news article text to detect fake news',
              '🔗 Or enter a URL to analyze directly',
              '📊 Get a credibility score + trust signals',
              '📰 Browse your personalized feed in the Feed tab',
            ].map((tip, i) => (
              <Text key={i} style={styles.tip}>{tip}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK.bg },
  container: { flex: 1, backgroundColor: DARK.bg, padding: 16 },
  header: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  logo: { fontSize: 28, fontWeight: '800', color: DARK.text },
  subtitle: { fontSize: 13, color: DARK.muted, marginTop: 4 },

  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: DARK.surface, borderWidth: 1, borderColor: DARK.border,
  },
  modeBtnActive: { backgroundColor: DARK.primary, borderColor: DARK.primary },
  modeTxt: { fontSize: 13, color: DARK.muted, fontWeight: '600' },
  modeTxtActive: { color: '#fff' },

  inputWrap: { position: 'relative', marginBottom: 12 },
  input: {
    backgroundColor: DARK.surface, color: DARK.text, borderRadius: 12,
    borderWidth: 1, borderColor: DARK.border, padding: 14,
    fontSize: 14, height: 52, textAlignVertical: 'top',
  },
  clearBtn: { position: 'absolute', right: 12, top: 16 },

  analyzeBtn: {
    backgroundColor: DARK.primary, borderRadius: 12, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 16,
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  resultCard: {
    backgroundColor: DARK.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: DARK.border,
  },
  verdictBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  verdictEmoji: { fontSize: 28 },
  verdictText: { fontSize: 22, fontWeight: '800' },
  verdictSource: { fontSize: 12, color: DARK.muted, marginTop: 2 },
  scoreCircle: {
    width: 58, height: 58, borderRadius: 29, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 18, fontWeight: '800' },
  scoreLabel: { fontSize: 9, fontWeight: '600' },

  summary: { fontSize: 14, color: DARK.text, lineHeight: 20, marginBottom: 14 },

  signalsWrap: { marginBottom: 14 },
  signalsTitle: { fontSize: 12, fontWeight: '700', color: DARK.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  signalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  signalLabel: { fontSize: 13, color: DARK.text },

  scoreRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: DARK.surface2, borderRadius: 10, padding: 12, marginBottom: 10,
  },
  scoreItem: { alignItems: 'center' },
  scoreItemLabel: { fontSize: 11, color: DARK.muted, marginBottom: 2 },
  scoreItemVal: { fontSize: 20, fontWeight: '800' },

  analysisTime: { fontSize: 11, color: DARK.muted, textAlign: 'center' },

  tipsCard: {
    backgroundColor: DARK.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: DARK.border,
  },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: DARK.text, marginBottom: 10 },
  tip: { fontSize: 13, color: DARK.muted, marginBottom: 8, lineHeight: 18 },
});
