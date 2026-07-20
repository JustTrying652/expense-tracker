import { useState } from 'react';
import { Platform, TouchableOpacity, Text, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, fonts } from '../theme';

interface Props {
  value: Date;
  onChange: (d: Date) => void;
  minimumDate?: Date;
}

export default function DateField({ value, onChange, minimumDate }: Props) {
  const [show, setShow] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        value={value.toISOString().split('T')[0]}
        min={minimumDate ? minimumDate.toISOString().split('T')[0] : undefined}
        onChange={(e: any) => {
          if (e.target.value) {
            const [y, m, d] = e.target.value.split('-').map(Number);
            onChange(new Date(y, m - 1, d));
          }
        }}
        style={webInputStyle}
      />
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setShow(true)}>
        <Text style={styles.inputText}>{value.toDateString()}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          onChange={(event, selected) => {
            setShow(false);
            if (selected) onChange(selected);
          }}
        />
      )}
    </>
  );
}

const webInputStyle = {
  borderWidth: 1.5,
  borderColor: '#D9D3C4',
  borderRadius: 8,
  padding: 12,
  fontFamily: fonts.mono,
  fontSize: 14,
  color: colors.ink,
  backgroundColor: colors.white,
  width: '100%',
  boxSizing: 'border-box' as const,
};

const styles = StyleSheet.create({
  input: { borderWidth: 1.5, borderColor: '#D9D3C4', borderRadius: 8, padding: 12, backgroundColor: colors.white },
  inputText: { fontFamily: fonts.mono, fontSize: 14, color: colors.ink },
});