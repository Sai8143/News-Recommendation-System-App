// screens/HistoryScreen.js
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVerdictColor, getScoreColor, getVerdictEmoji } from '../utils/api';
import { useHistory } from '../hooks/useStorage';

const DARK = {
  bg: '#0f172a', surface: '#1e293b', surface2: '#273449',
  border: '#334155', text: '#f1f5f9', muted: '#94a3b8',
  primary: '#6366f1', green: '#22c55e', red: '#ef4444', yellow: '#f59e0b'
};

export default function HistoryScreen() {
  const [history, saveHistory] = useHistory();
  const [filter, setFilter] = useState('all');

  const filtered = history.filter(h => filter === 'all' || h.verdictClass === filter);

  const clearHistory = () => {
    Alert.alert('Clear History', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => saveHistory([]) },
    ]);
  };

  const stats = {
    total: history.length,
    credible: history.filter(h => h.verdictClass === 'real').length,
    fake: history.filter(h => h.verdictClass === 'fake').length,
    mixed: history.filter(h => h.verdictClass === 'mixed').length,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Stats Row */}
      {history.length > 0 && (
        <View style={styles.statsRow}>
          {[
            { label: 'Total', val: stats.total, color: DARK.primary },
            { label: 'Credible', val: stats.credible, color: DARK.green },
            { label: 'Mixed', val: stats.mixed, color: DARK.yellow },
            { label: 'Fake', val: stats.fake, color: DARK.red },
          ].map(s => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Filter + Clear */}
      <View style={styles.filterRow}>
        <View style={styles.filterBtns}>
          {['all', 'real', 'mixed', 'fake'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTxt, filter === f && styles.filterTxtActive]}>
                {f === 'all' ? 'All' : f === 'real' ? '✅' : f === 'mixed' ? '⚠️' : '❌'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={18} color={DARK.red} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.badge, { backgroundColor: getVerdictColor(item.verdictClass) + '22' }]}>
                <Text style={[styles.badgeTxt, { color: getVerdictColor(item.verdictClass) }]}>
                  {getVerdictEmoji(item.verdictClass)} {item.verdict}
                </Text>
              </View>
              <Text style={[styles.score, { color: getScoreColor(item.score) }]}>{item.score}/100</Text>
            </View>
            <Text style={styles.text} numberOfLines={3}>{item.text}</Text>
            <Text style={styles.time}>{new Date(item.timestamp).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTxt}>No history yet</Text>
            <Text style={styles.emptySub}>Analyzed articles will appear here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK.bg },
  statsRow: {
    flexDirection: 'row', backgroundColor: DARK.surface,
    borderBottomWidth: 1, borderBottomColor: DARK.border, padding: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: DARK.muted, marginTop: 2 },

  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: DARK.surface, borderBottomWidth: 1, borderBottomColor: DARK.border,
  },
  filterBtns: { flexDirection: 'row', gap: 6, flex: 1 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8,
    backgroundColor: DARK.surface2, borderWidth: 1, borderColor: DARK.border,
  },
  filterBtnActive: { backgroundColor: DARK.primary + '33', borderColor: DARK.primary },
  filterTxt: { fontSize: 13, color: DARK.muted, fontWeight: '600' },
  filterTxtActive: { color: DARK.primary },
  clearBtn: { padding: 6 },

  card: {
    backgroundColor: DARK.surface, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: DARK.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  score: { fontSize: 13, fontWeight: '800' },
  text: { fontSize: 13, color: DARK.text, lineHeight: 18, marginBottom: 8 },
  time: { fontSize: 11, color: DARK.muted },

  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTxt: { fontSize: 16, color: DARK.text, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 13, color: DARK.muted, textAlign: 'center' },
});
