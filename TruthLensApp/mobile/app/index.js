import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      
      {/* App Title */}
      <Text style={styles.title}>FakeGuard</Text>
      <Text style={styles.subtitle}>AI Fake News Detection</Text>

      {/* Navigation Cards */}
      <View style={styles.grid}>

        <NavCard title="Feed" onPress={() => router.push('/feed')} />
        <NavCard title="Analyze" onPress={() => router.push('/analyze')} />
        <NavCard title="History" onPress={() => router.push('/history')} />
        <NavCard title="Profile" onPress={() => router.push('/profile')} />
        <NavCard title="Search" onPress={() => router.push('/search')} />

      </View>

    </View>
  );
}

/* 🔹 Reusable Card Component */
function NavCard({ title, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.cardText}>{title}</Text>
    </TouchableOpacity>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 30,
  },

  grid: {
    width: '100%',
    gap: 15,
  },

  card: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  cardText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
  },
});