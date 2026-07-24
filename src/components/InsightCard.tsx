import { View, Text, StyleSheet } from 'react-native';
import { Insight } from '../utils/insights';
import { colors, fonts } from '../theme';

export default function InsightCard({ insight }: { insight: Insight }) {
  const borderColor =
    insight.type === 'warning' ? colors.receiptRed : insight.type === 'positive' ? colors.stampGreen : colors.ash;

  return (
    <View style={[styles.card, { borderColor }]}>
      <Text style={styles.emoji}>{insight.emoji}</Text>
      <Text style={styles.text}>{insight.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 8,
  },
  emoji: { fontSize: 18, marginRight: 10 },
  text: { flex: 1, fontFamily: fonts.mono, fontSize: 12, color: colors.ink, lineHeight: 17 },
});