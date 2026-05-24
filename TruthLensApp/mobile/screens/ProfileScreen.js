// screens/ProfileScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Switch, Alert, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile, useHistory } from '../hooks/useStorage';
import { TOPICS, healthCheck } from '../utils/api';

const DARK = {
  bg: '#0f172a', surface: '#1e293b', surface2: '#273449',
  border: '#334155', text: '#f1f5f9', muted: '#94a3b8',
  primary: '#6366f1', green: '#22c55e', red: '#ef4444', yellow: '#f59e0b'
};

export default function ProfileScreen() {
  const [profile, saveProfile] = useProfile();
  const [history] = useHistory();
  const [backendStatus, setBackendStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  const toggleInterest = (id) => {
    const curr = profile.interests || [];
    const updated = curr.includes(id)
      ? (curr.length > 1 ? curr.filter(i => i !== id) : curr)
      : [...curr, id];
    saveProfile({ ...profile, interests: updated });
  };

  const checkBackend = async () => {
    setChecking(true);
    const res = await healthCheck();
    setBackendStatus(res.status === 'ok' ? 'online' : 'offline');
    setChecking(false);
  };

  const fakePercent = profile.scanned > 0
    ? Math.round((profile.fakeDetected / profile.scanned) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Avatar & Stats */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🛡️</Text>
          </View>
          <TextInput
            style={styles.nameInput}
            value={profile.name}
            onChangeText={n => saveProfile({ ...profile, name: n })}
            placeholder="Your name"
            placeholderTextColor={DARK.muted}
          />
          <Text style={styles.subtitle}>TruthLens User</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: DARK.primary }]}>{profile.scanned || 0}</Text>
            <Text style={styles.statLabel}>Articles Scanned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: DARK.red }]}>{profile.fakeDetected || 0}</Text>
            <Text style={styles.statLabel}>Fake Detected</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: DARK.yellow }]}>{fakePercent}%</Text>
            <Text style={styles.statLabel}>Fake Rate</Text>
          </View>
        </View>

        {/* API Key Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔑 API Keys (Free)</Text>
          <Text style={styles.sectionSub}>Required to fetch real news in Feed & Search</Text>

          <View style={styles.apiRow}>
            <Text style={styles.apiLabel}>GNews API Key</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://gnews.io')}>
              <Text style={styles.getKey}>Get free key →</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.apiInput}
            value={profile.gnewsKey || ''}
            onChangeText={v => saveProfile({ ...profile, gnewsKey: v })}
            placeholder="Paste your GNews API key here"
            placeholderTextColor={DARK.muted}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={false}
          />
          <Text style={styles.apiHint}>Free plan: 100 requests/day · No credit card required</Text>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Your Interests</Text>
          <Text style={styles.sectionSub}>Personalize your news feed</Text>
          <View style={styles.topicsGrid}>
            {TOPICS.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.topicChip,
                  (profile.interests || []).includes(t.id) && styles.topicChipActive,
                ]}
                onPress={() => toggleInterest(t.id)}
              >
                <Text style={styles.topicChipTxt}>{t.emoji} {t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Backend Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🖥️ Backend Status</Text>
          <Text style={styles.sectionSub}>Make sure the Python backend is running</Text>
          <View style={styles.statusRow}>
            <View style={[
              styles.statusDot,
              backendStatus === 'online' ? { backgroundColor: DARK.green } :
              backendStatus === 'offline' ? { backgroundColor: DARK.red } :
              { backgroundColor: DARK.muted }
            ]} />
            <Text style={styles.statusTxt}>
              {backendStatus === 'online' ? '✅ Backend is online'
               : backendStatus === 'offline' ? '❌ Backend is offline'
               : '⬜ Not checked yet'}
            </Text>
            <TouchableOpacity
              style={styles.checkBtn}
              onPress={checkBackend}
              disabled={checking}
            >
              <Text style={styles.checkBtnTxt}>{checking ? 'Checking…' : 'Check'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.backendHint}>Run: cd backend && python app.py</Text>
        </View>

        {/* History Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Analysis History</Text>
          <Text style={styles.sectionSub}>{history.length} total analyses stored</Text>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About TruthLens</Text>
          <Text style={styles.aboutTxt}>
            TruthLens is an AI-powered fake news detector and personalized news recommendation system.{'\n\n'}
            It uses heuristic analysis, ML models (if available), and free APIs to help you identify misinformation and stay informed with credible news.
          </Text>
          <Text style={styles.aboutVersion}>Version 1.0.0 · Built with React Native + Expo</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK.bg },
  container: { flex: 1, backgroundColor: DARK.bg },

  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: DARK.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: DARK.primary, marginBottom: 12,
  },
  avatarEmoji: { fontSize: 36 },
  nameInput: {
    fontSize: 20, fontWeight: '700', color: DARK.text,
    textAlign: 'center', borderBottomWidth: 1, borderBottomColor: DARK.border,
    paddingVertical: 4, minWidth: 160,
  },
  subtitle: { fontSize: 13, color: DARK.muted, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  statCard: {
    flex: 1, backgroundColor: DARK.surface, borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: DARK.border,
  },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: DARK.muted, marginTop: 3, textAlign: 'center' },

  section: {
    margin: 16, marginBottom: 0, backgroundColor: DARK.surface,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: DARK.border,
    marginTop: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: DARK.text, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: DARK.muted, marginBottom: 14 },

  apiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  apiLabel: { fontSize: 13, color: DARK.text, fontWeight: '600' },
  getKey: { fontSize: 12, color: DARK.primary, fontWeight: '700' },
  apiInput: {
    backgroundColor: DARK.surface2, color: DARK.text, borderRadius: 10,
    borderWidth: 1, borderColor: DARK.border, padding: 12, fontSize: 13,
    marginBottom: 6,
  },
  apiHint: { fontSize: 11, color: DARK.muted },

  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: DARK.surface2, borderWidth: 1, borderColor: DARK.border,
  },
  topicChipActive: { backgroundColor: DARK.primary, borderColor: DARK.primary },
  topicChipTxt: { fontSize: 13, color: DARK.text, fontWeight: '600' },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusTxt: { flex: 1, fontSize: 13, color: DARK.text },
  checkBtn: { backgroundColor: DARK.primary + '33', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  checkBtnTxt: { color: DARK.primary, fontSize: 13, fontWeight: '700' },
  backendHint: { fontSize: 11, color: DARK.muted, marginTop: 8, fontFamily: 'monospace' },

  aboutTxt: { fontSize: 13, color: DARK.muted, lineHeight: 20, marginBottom: 10 },
  aboutVersion: { fontSize: 11, color: DARK.primary },
});
