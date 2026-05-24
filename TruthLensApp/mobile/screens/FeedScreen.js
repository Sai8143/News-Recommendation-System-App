// screens/FeedScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Linking, Image, RefreshControl, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchNewsFeed, getVerdictColor, getScoreColor, getVerdictEmoji, TOPICS } from '../utils/api';
import { useProfile } from '../hooks/useStorage';

const DARK = {
  bg: '#0f172a', surface: '#1e293b', surface2: '#273449',
  border: '#334155', text: '#f1f5f9', muted: '#94a3b8',
  primary: '#6366f1', green: '#22c55e', red: '#ef4444', yellow: '#f59e0b'
};

export default function FeedScreen() {
  const [profile] = useProfile();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTopics, setActiveTopics] = useState(['technology', 'science']);
  const [filter, setFilter] = useState('all'); // all | credible | mixed | fake

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchNewsFeed(activeTopics, profile.gnewsKey || '', 10);
      setArticles(data.articles || []);
    } catch (e) {
      console.log('Feed error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTopics, profile.gnewsKey]);

  useEffect(() => { loadFeed(); }, [activeTopics]);

  const toggleTopic = (id) => {
    setActiveTopics(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(t => t !== id) : prev) : [...prev, id]
    );
  };

  const filtered = articles.filter(a => {
    if (filter === 'all') return true;
    return a.verdictClass === filter;
  });

  const ArticleCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => Linking.openURL(item.url)}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardMeta}>
          <View style={[styles.verdictBadge, { backgroundColor: getVerdictColor(item.verdictClass) + '22' }]}>
            <Text style={[styles.verdictBadgeTxt, { color: getVerdictColor(item.verdictClass) }]}>
              {getVerdictEmoji(item.verdictClass)} {item.verdict}
            </Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.score) + '22' }]}>
            <Text style={[styles.scoreBadgeTxt, { color: getScoreColor(item.score) }]}>{item.score}</Text>
          </View>
        </View>
        <View style={styles.topicChip}>
          <Text style={styles.topicChipTxt}>{item.topic}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={3}>{item.title}</Text>
      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <View style={styles.cardBottom}>
        <Ionicons name="globe-outline" size={12} color={DARK.muted} />
        <Text style={styles.cardSource}>{item.source}</Text>
        <Text style={styles.cardDot}>·</Text>
        <Text style={styles.cardTime}>{formatTime(item.publishedAt)}</Text>
        <Ionicons name="open-outline" size={12} color={DARK.muted} style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Topic Filter Chips */}
      <View style={styles.topRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicsScroll}>
          {TOPICS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.topicBtn, activeTopics.includes(t.id) && styles.topicBtnActive]}
              onPress={() => toggleTopic(t.id)}
            >
              <Text style={styles.topicBtnTxt}>{t.emoji} {t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Verdict Filter */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'All' },
          { key: 'real', label: '✅ Credible' },
          { key: 'mixed', label: '⚠️ Mixed' },
          { key: 'fake', label: '❌ Fake' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterTxt, filter === f.key && styles.filterTxtActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!profile.gnewsKey && (
        <View style={styles.apiWarning}>
          <Ionicons name="key-outline" size={14} color={DARK.yellow} />
          <Text style={styles.apiWarningTxt}>Add GNews API key in Profile → Settings to load real news</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={DARK.primary} size="large" />
          <Text style={styles.loadingTxt}>Loading personalized feed…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id || item.url}
          renderItem={({ item }) => <ArticleCard item={item} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFeed(true)}
              tintColor={DARK.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📰</Text>
              <Text style={styles.emptyTxt}>No articles found</Text>
              <Text style={styles.emptySub}>Pull to refresh or check your API key in Profile</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.round((now - d) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return d.toLocaleDateString();
  } catch { return ''; }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK.bg },
  topRow: { backgroundColor: DARK.surface, borderBottomWidth: 1, borderBottomColor: DARK.border },
  topicsScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  topicBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: DARK.surface2, borderWidth: 1, borderColor: DARK.border,
  },
  topicBtnActive: { backgroundColor: DARK.primary, borderColor: DARK.primary },
  topicBtnTxt: { fontSize: 12, color: DARK.text, fontWeight: '600' },

  filterRow: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: DARK.surface,
  },
  filterBtn: {
    flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center',
    backgroundColor: DARK.surface2, borderWidth: 1, borderColor: DARK.border,
  },
  filterBtnActive: { backgroundColor: DARK.primary + '33', borderColor: DARK.primary },
  filterTxt: { fontSize: 11, color: DARK.muted, fontWeight: '600' },
  filterTxtActive: { color: DARK.primary },

  apiWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    margin: 10, backgroundColor: DARK.yellow + '11', borderRadius: 8,
    padding: 10, borderWidth: 1, borderColor: DARK.yellow + '44',
  },
  apiWarningTxt: { fontSize: 12, color: DARK.yellow, flex: 1 },

  card: {
    backgroundColor: DARK.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: DARK.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardMeta: { flexDirection: 'row', gap: 6 },
  verdictBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  verdictBadgeTxt: { fontSize: 11, fontWeight: '700' },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  scoreBadgeTxt: { fontSize: 11, fontWeight: '800' },
  topicChip: { backgroundColor: DARK.primary + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  topicChipTxt: { fontSize: 10, color: DARK.primary, fontWeight: '700', textTransform: 'uppercase' },

  cardTitle: { fontSize: 15, color: DARK.text, fontWeight: '700', lineHeight: 21, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: DARK.muted, lineHeight: 18, marginBottom: 8 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardSource: { fontSize: 11, color: DARK.muted },
  cardDot: { fontSize: 11, color: DARK.muted },
  cardTime: { fontSize: 11, color: DARK.muted },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingTxt: { marginTop: 12, color: DARK.muted, fontSize: 14 },

  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTxt: { fontSize: 16, color: DARK.text, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 13, color: DARK.muted, textAlign: 'center' },
});
