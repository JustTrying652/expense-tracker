import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { setHasOnboarded } from '../db/storage';

const { width } = Dimensions.get('window');

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '💰',
    title: 'Track income & expenses',
    body: 'Log every transaction in seconds — amount, category, and an optional note.',
  },
  {
    emoji: '📊',
    title: 'See where it goes',
    body: 'Monthly reports break down spending by category, plus a 6-month trend chart.',
  },
  {
    emoji: '🎯',
    title: 'Set budgets, get alerts',
    body: "Cap your spending per category and get a heads-up as you approach the limit.",
  },
  {
    emoji: '📄',
    title: 'Export anytime',
    body: 'Turn any month into a clean PDF report — ready to save, print, or share.',
  },
];

interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  async function finish() {
    await setHasOnboarded();
    onDone();
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  }

  function goNext() {
    if (index === SLIDES.length - 1) {
      finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
  }

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={finish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
          <Text style={styles.nextBtnText}>{isLast ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  skipBtn: { alignSelf: 'flex-end', padding: 20 },
  skipText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 15, color: '#9ca3af', textAlign: 'center', lineHeight: 22 },
  footer: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#374151', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#16a34a', width: 20 },
  nextBtn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 8, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});