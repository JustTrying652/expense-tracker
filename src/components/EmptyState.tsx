import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';
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
  title: { fontFamily: fonts.displayMedium, fontSize: 15, color: colors.ink, textAlign: 'center' },
  subtitle: { fontFamily: fonts.mono, fontSize: 12, color: colors.ash, textAlign: 'center', marginTop: 6 },

});