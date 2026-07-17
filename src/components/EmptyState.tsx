import { View, Text, StyleSheet } from 'react-native';

interface Props {
  emoji: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ emoji, title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emoji: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '600', color: '#374151', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 6 },
});