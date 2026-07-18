import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { seedCategoriesIfEmpty, getHasOnboarded } from './src/db/storage';
import RootNavigator from './src/navigation';
import OnboardingScreen from './src/screens/OnboardingScreen';

export default function App() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      await seedCategoriesIfEmpty();
      const onboarded = await getHasOnboarded();
      setShowOnboarding(!onboarded);
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  if (showOnboarding) {
    return <OnboardingScreen onDone={() => setShowOnboarding(false)} />;
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}