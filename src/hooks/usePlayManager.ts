import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import dayjs from 'dayjs';

export function usePlayManager() {
  const [plays, setPlays] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const today = dayjs().format('YYYY-MM-DD');
      const lastBonus = await AsyncStorage.getItem('lastBonusDate');
      const hasInstalled = await SecureStore.getItemAsync('firstInstallDone');

      if (!hasInstalled) {
        // ✅ Lần cài đầu tiên
        await SecureStore.setItemAsync('firstInstallDone', 'true');
        await AsyncStorage.setItem('plays', '20');
        await AsyncStorage.setItem('lastBonusDate', today);
        setPlays(20);
      } else {
        const stored = parseInt(await AsyncStorage.getItem('plays') || '0', 10);

        // ✅ Nếu hôm nay khác ngày được bonus cuối cùng + số lượt = 0 thì mới cộng thêm
        if (stored === 0 && lastBonus !== today) {
          const newPlays = 10;
          await AsyncStorage.setItem('plays', newPlays.toString());
          await AsyncStorage.setItem('lastBonusDate', today);
          setPlays(newPlays);
        } else {
          setPlays(stored);
        }
      }

      setLoading(false);
    };

    init();
  }, []);

  return { plays, setPlays, loading };
}
