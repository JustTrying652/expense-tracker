import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { seedCategoriesIfEmpty } from './src/db/storage';
import RootNavigator from './src/navigation';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedCategoriesIfEmpty().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}