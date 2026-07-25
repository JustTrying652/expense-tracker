import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import PinPad from '../components/PinPad';
import { savePin, verifyPin } from '../utils/pin';
import { showAlert } from '../utils/alert';
import { colors, fonts } from '../theme';
import { HomeStackParamList } from '../navigation';

type PinSetupRouteProp = RouteProp<HomeStackParamList, 'PinSetup'>;
type Step = 'verifyOld' | 'enterNew' | 'confirmNew';

export default function PinSetupScreen() {
  const route = useRoute<PinSetupRouteProp>();
  const navigation = useNavigation();
  const mode = route.params?.mode ?? 'create';

  const [step, setStep] = useState<Step>(mode === 'change' ? 'verifyOld' : 'enterNew');
  const [input, setInput] = useState('');
  const [firstEntry, setFirstEntry] = useState('');
  const [error, setError] = useState('');

  async function handleChange(value: string) {
    setInput(value);
    setError('');
    if (value.length !== 4) return;

    if (step === 'verifyOld') {
      const ok = await verifyPin(value);
      if (!ok) {
        setError('Incorrect PIN. Try again.');
        setInput('');
        return;
      }
      setStep('enterNew');
      setInput('');
      return;
    }

    if (step === 'enterNew') {
      setFirstEntry(value);
      setStep('confirmNew');
      setInput('');
      return;
    }

    if (step === 'confirmNew') {
      if (value !== firstEntry) {
        setError("PINs didn't match. Start over.");
        setInput('');
        setFirstEntry('');
        setStep('enterNew');
        return;
      }
      await savePin(value);
      showAlert('PIN set', mode === 'change' ? 'Your PIN has been updated.' : 'App lock is now enabled.');
      navigation.goBack();
    }
  }

  const titles: Record<Step, string> = {
    verifyOld: 'ENTER CURRENT PIN',
    enterNew: 'CHOOSE A NEW PIN',
    confirmNew: 'CONFIRM YOUR PIN',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{titles[step]}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <PinPad value={input} onChange={handleChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontFamily: fonts.display, color: colors.white, fontSize: 16, letterSpacing: 1.5, marginBottom: 12 },
  error: { fontFamily: fonts.mono, color: colors.receiptRed, fontSize: 12, marginBottom: 20 },
});