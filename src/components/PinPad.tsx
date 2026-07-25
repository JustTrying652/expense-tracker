import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

interface Props {
  value: string;
  onChange: (v: string) => void;
  length?: number;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export default function PinPad({ value, onChange, length = 4 }: Props) {
  function handlePress(key: string) {
    if (key === '') return;
    if (key === '⌫') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length < length) onChange(value + key);
  }

  return (
    <View>
      <View style={styles.dotsRow}>
        {Array.from({ length }).map((_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotFilled]} />
        ))}
      </View>
      <View style={styles.keypad}>
        {KEYS.map((k, i) => (
          <TouchableOpacity key={i} style={styles.key} disabled={k === ''} onPress={() => handlePress(k)}>
            <Text style={styles.keyText}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32, gap: 16 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: colors.ash },
  dotFilled: { backgroundColor: colors.kangaGold, borderColor: colors.kangaGold },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 250, alignSelf: 'center' },
  key: { width: 70, height: 70, margin: 6, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontFamily: fonts.display, fontSize: 26, color: colors.white },
});