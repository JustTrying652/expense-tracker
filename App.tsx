import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, SpaceGrotesk_700Bold, SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { seedCategoriesIfEmpty, getHasOnboarded, generateDueRecurringTransactions } from './src/db/storage';
import RootNavigator from './src/navigation';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { showAlert } from './src/utils/alert';

export default function App() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    SpaceGrotesk_500Medium,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    (async () => {
      await seedCategoriesIfEmpty();
      const onboarded = await getHasOnboarded();
      setShowOnboarding(!onboarded);
      setReady(true);

      if (onboarded) {
        const count = await generateDueRecurringTransactions();
        if (count > 0) {
          showAlert(
            'Recurring transactions added',
            `${count} recurring transaction${count > 1 ? 's were' : ' was'} generated automatically.`
          );
        }
      }
    })();
  }, []);

  if (!ready || !fontsLoaded) return null;

  if (showOnboarding) {
    return <OnboardingScreen onDone={() => setShowOnboarding(false)} />;
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}