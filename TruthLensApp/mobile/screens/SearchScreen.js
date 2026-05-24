// screens/SearchScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchNews, getVerdictColor, getScoreColor, getVerdictEmoji } from '../utils/api';
import { useProfile } from '../hooks/useStorage';

const DARK = {
  bg: '#0f172a', surface: '#1e293b', surface2: '#273449',
  border: '#334155', text: '#f1f5f9', muted: '#94a3b8',
  primary: '#6366f1', green: '#22c55e', red: '#ef4444', yellow: '#f59e0b'
};

const SUGGESTED = ['climate change', 'AI news', 'election results', 'vaccine safety', 'stock market'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [profile] = useProfile();

  const doSearch = useCallback(async (q) => {
    const term = q || query;
    if (!term.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchNews(term.trim(), profile.gnewsKey || '');
      setResults(data.articles || []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, profile.gnewsKey]);

  const ArticleCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => Linking.openURL(item.url)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.verdictBadge, { backgroundColor: getVerdictColor(item.verdictClass) + '22' }]}>
          <Text style={[styles.verdictBadgeTxt, { color: getVerdictColor(item.verdictClass) }]}>
            {getVerdictEmoji(item.verdictClass)} {item.verdict}
          </Text>
        </View>
        <Text style={[styles.scoreVal, { color: getScoreColor(item.score) }]}>{item.score}/100</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={3}>{item.title}</Text>
      {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
      <View style={styles.cardFoot}>
        <Ionicons name="globe-outline" size={12} color={DARK.muted} />
        <Text style={styles.cardSrc}>{item.source}</Text>
        <Ionicons name="open-outline" size={12} color={DARK.muted} style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={DARK.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search news topics..."
          placeholderTextColor={DARK.muted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => doSearch()}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <Ionicons name="close-circle" size={18} color={DARK.muted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.searchBtn} onPress={() => doSearch()} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.searchBtnTxt}>Go</Text>}
        </TouchableOpacity>
      </View>

      {/* Suggested */}
      {!searched && (
        <View style={styles.suggestedWrap}>
          <Text style={styles.suggestedTitle}>Trending Searches</Text>
          <View style={styles.suggestedChips}>
            {SUGGESTED.map(s => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => { setQuery(s); doSearch(s); }}>
                <Text style={styles.chipTxt}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!profile.gnewsKey && searched && (
        <View style={styles.apiWarning}>
          <Ionicons name="key-outline" size={14} color={DARK.yellow} />
          <Text style={styles.apiWarningTxt}>Add GNews API key in Profile to get real search results</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={item => item.id || item.url}
        renderItem={({ item }) => <ArticleCard item={item} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          searched && !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTxt}>{profile.gnewsKey ? 'No results found' : 'API key required'}</Text>
              <Text style={styles.emptySub}>
                {profile.gnewsKey ? 'Try a different search term' : 'Go to Profile → Settings to add your free GNews API key'}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK.bg },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, backgroundColor: DARK.surface,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: DARK.border,
  },
  searchIcon: { marginRight: 2 },
  searchInput: { flex: 1, color: DARK.text, fontSize: 15 },
  searchBtn: {
    backgroundColor: DARK.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
  },
  searchBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  suggestedWrap: { paddingHorizontal: 12, marginBottom: 12 },
  suggestedTitle: { fontSize: 12, fontWeight: '700', color: DARK.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  suggestedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: DARK.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: DARK.border },
  chipTxt: { color: DARK.text, fontSize: 13 },

  apiWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 12, backgroundColor: DARK.yellow + '11', borderRadius: 8,
    padding: 10, borderWidth: 1, borderColor: DARK.yellow + '44', marginBottom: 8,
  },
  apiWarningTxt: { fontSize: 12, color: DARK.yellow, flex: 1 },

  card: {
    backgroundColor: DARK.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: DARK.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  verdictBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  verdictBadgeTxt: { fontSize: 11, fontWeight: '700' },
  scoreVal: { fontSize: 13, fontWeight: '800' },
  cardTitle: { fontSize: 15, color: DARK.text, fontWeight: '700', lineHeight: 21, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: DARK.muted, lineHeight: 18, marginBottom: 8 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardSrc: { fontSize: 11, color: DARK.muted },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTxt: { fontSize: 16, color: DARK.text, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 13, color: DARK.muted, textAlign: 'center' },
});
