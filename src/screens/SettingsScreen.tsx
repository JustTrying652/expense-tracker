import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { hasPinSet, clearPin, verifyPin } from '../utils/pin';
import { showAlert } from '../utils/alert';
import { colors, fonts, spacing } from '../theme';
import PinPad from '../components/PinPad';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeInput, setRemoveInput] = useState('');
  const [removeError, setRemoveError] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => setPinEnabled(await hasPinSet()))();
    }, [])
  );

  function goToSetup(mode: 'create' | 'change') {
    (navigation as any).navigate('PinSetup', { mode });
  }

  async function handleRemoveAttempt(value: string) {
    setRemoveInput(value);
    setRemoveError('');
    if (value.length !== 4) return;

    const ok = await verifyPin(value);
    if (!ok) {
      setRemoveError('Incorrect PIN');
      setRemoveInput('');
      return;
    }
    await clearPin();
    setPinEnabled(false);
    setRemoving(false);
    setRemoveInput('');
    showAlert('App lock removed', 'Your PIN has been cleared.');
  }

  if (removing) {
    return (
      <View style={styles.lockContainer}>
        <Text style={styles.lockTitle}>ENTER PIN TO REMOVE LOCK</Text>
        {!!removeError && <Text style={styles.error}>{removeError}</Text>}
        <PinPad value={removeInput} onChange={handleRemoveAttempt} />
        <TouchableOpacity onPress={() => { setRemoving(false); setRemoveInput(''); }}>
          <Text style={styles.cancelText}>CANCEL</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>PREFERENCES</Text>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>App Lock</Text>
            <Text style={styles.rowHint}>{pinEnabled ? 'Require a PIN to open the app' : 'Not enabled'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, pinEnabled && styles.toggleActive]}
            onPress={() => (pinEnabled ? setRemoving(true) : goToSetup('create'))}
          >
            <View style={[styles.toggleKnob, pinEnabled && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>

        {pinEnabled && (
          <TouchableOpacity style={styles.linkRow} onPress={() => goToSetup('change')}>
            <Text style={styles.linkText}>Change PIN</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.note}>
          Your PIN is stored only on this device and isn't recoverable if forgotten — removing the app lock in
          that case requires reinstalling the app, which clears all local data.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { backgroundColor: colors.ink, paddingVertical: 20, paddingHorizontal: spacing.md },
  headerLabel: { fontFamily: fonts.mono, color: '#9CA3AF', fontSize: 11, letterSpacing: 2 },
  headerTitle: { fontFamily: fonts.display, color: colors.white, fontSize: 22, marginTop: 4 },
  body: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 10, padding: 14, borderWidth: 1.5, borderColor: '#D9D3C4' },
  rowTitle: { fontFamily: fonts.displayMedium, fontSize: 14, color: colors.ink },
  rowHint: { fontFamily: fonts.mono, fontSize: 11, color: colors.ash, marginTop: 3 },
  toggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: '#D9D3C4', padding: 3, justifyContent: 'center' },
  toggleActive: { backgroundColor: colors.stampGreen },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
  toggleKnobActive: { transform: [{ translateX: 20 }] },
  linkRow: { marginTop: 12, padding: 14, backgroundColor: colors.white, borderRadius: 10, borderWidth: 1.5, borderColor: '#D9D3C4', borderStyle: 'dashed' },
  linkText: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.ink },
  note: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, marginTop: 20, lineHeight: 15 },
  lockContainer: { flex: 1, backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center', padding: 24 },
  lockTitle: { fontFamily: fonts.display, color: colors.white, fontSize: 14, letterSpacing: 1, marginBottom: 12, textAlign: 'center' },
  error: { fontFamily: fonts.mono, color: colors.receiptRed, fontSize: 12, marginBottom: 20 },
  cancelText: { fontFamily: fonts.mono, color: colors.ash, fontSize: 11, marginTop: 20, letterSpacing: 1 },
});