import {
  useFonts,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import { ActivityIndicator, View, Text } from 'react-native';
import { Provider } from 'react-redux';
import Purchases from 'react-native-purchases';
import MainScreen from './src/screens/main';
import { store } from './src/store';

export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });

  if (!fontsLoaded)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <Provider store={store}>
      <MainScreen />
    </Provider>
  );
}
