import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_HASH_KEY = 'pinHash';

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export async function hasPinSet(): Promise<boolean> {
  const hash = await AsyncStorage.getItem(PIN_HASH_KEY);
  return hash !== null;
}

export async function savePin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  await AsyncStorage.setItem(PIN_HASH_KEY, hash);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await AsyncStorage.getItem(PIN_HASH_KEY);
  if (!stored) return false;
  const hash = await hashPin(pin);
  return hash === stored;
}

export async function clearPin(): Promise<void> {
  await AsyncStorage.removeItem(PIN_HASH_KEY);
}