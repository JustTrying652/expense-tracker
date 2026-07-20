import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import ReportsScreen from '../screens/ReportsScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import RecurringScreen from '../screens/RecurringScreen';
import GoalsScreen from '../screens/GoalsScreen';

export type HomeStackParamList = {
  HomeList: undefined;
  EditTransaction: { transactionId: number };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<HomeStackParamList>();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeList" component={HomeScreen} options={{ title: 'Transactions' }} />
      <Stack.Screen name="EditTransaction" component={AddTransactionScreen} options={{ title: 'Edit Transaction' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Transactions' }} />
      <Tab.Screen name="Add" component={AddTransactionScreen} options={{ title: 'Add' }} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} options={{ title: 'Budgets' }} />
      <Tab.Screen name="Recurring" component={RecurringScreen} options={{ title: 'Recurring' }} />
      <Tab.Screen name="Goals" component={GoalsScreen} options={{ title: 'Goals' }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
    </Tab.Navigator>
  );
}