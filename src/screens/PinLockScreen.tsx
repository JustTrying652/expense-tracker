import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import PinPad from '../components/PinPad';
import { verifyPin } from '../utils/pin';
import { colors, fonts } from '../theme';

interface Props {
  onUnlock: () => void;
}

export default function PinLockScreen({ onUnlock }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return; // biometrics have no web equivalent here
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        setBiometricAvailable(true);
        tryBiometric();
      }
    })();
  }, []);

  async function tryBiometric() {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Expense Tracker' });
    if (result.success) onUnlock();
  }

  async function handleChange(value: string) {
    setInput(value);
    setError('');
    if (value.length !== 4) return;

    const ok = await verifyPin(value);
    if (ok) onUnlock();
    else {
      setError('Incorrect PIN');
      setInput('');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔒</Text>
      <Text style={styles.title}>ENTER PIN</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <PinPad value={input} onChange={handleChange} />
      {biometricAvailable && (
        <TouchableOpacity onPress={tryBiometric} style={styles.bioBtn}>
          <Text style={styles.bioBtnText}>USE BIOMETRICS</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emoji: { fontSize: 40, marginBottom: 12 },
  title: { fontFamily: fonts.display, color: colors.white, fontSize: 16, letterSpacing: 1.5, marginBottom: 12 },
  error: { fontFamily: fonts.mono, color: colors.receiptRed, fontSize: 12, marginBottom: 20 },
  bioBtn: { marginTop: 24, padding: 10 },
  bioBtnText: { fontFamily: fonts.displayMedium, color: colors.kangaGold, fontSize: 12, letterSpacing: 1 },
});