import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../theme';

interface Props {
  name: string;
  color: string;
}

export default function CategoryStamp({ name, color }: Props) {
  return (
    <View style={[styles.stamp, { borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{name.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    transform: [{ rotate: '-2deg' }],
  },
  text: {
    fontFamily: fonts.display,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});