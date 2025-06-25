import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Game from '../screens/game';
import Settings from '../screens/settings';
import BuyPlays from '../screens/buycoin';
import { usePlayManager } from '../hooks/usePlayManager';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  const { plays, loading } = usePlayManager();

  if (loading) return null;

  console.log('plays',plays)
  return (
    <Tab.Navigator
      initialRouteName={plays > 0 ? 'Game' : 'Buy Coins'} // ➤ Điều hướng mặc định
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'game-controller';

          if (route.name === 'Game') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Buy Coins') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      {plays > 0 && <Tab.Screen name="Game" component={Game} />}
      <Tab.Screen name="BuyCoins" component={BuyPlays} 
  options={{ tabBarLabel: 'Buy Coins' }}/>
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
}
