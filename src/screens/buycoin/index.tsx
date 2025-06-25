import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAY_PACKS = [
  { id: 'pack_300_plays', plays: 300 },
  { id: 'pack_250_plays', plays: 250 },
  { id: 'pack_180_plays', plays: 180 },
  { id: 'pack_160_plays', plays: 160 },
  { id: 'pack_80_plays', plays: 80 },
  { id: 'pack_50_plays', plays: 50 },
  { id: 'pack_35_plays', plays: 35 },
  { id: 'pack_20_plays', plays: 20 },
  { id: 'pack_5_plays', plays: 5 },
];

const BuyPlays = () => {
  const [plays, setPlays] = useState<number>(0);
  const [products, setProducts] = useState<RNIap.Product[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetch = async () => {
        const stored = await AsyncStorage.getItem('plays');
        setPlays(parseInt(stored || '0', 10));
      };
      fetch();
    }, [])
  );

  useEffect(() => {
    const init = async () => {
      const connected = await RNIap.initConnection();
      if (!connected) {
        Alert.alert('IAP not available');
        return;
      }

      try {
        const items = await RNIap.getProducts({ skus: PLAY_PACKS.map(p => p.id) });

        setProducts(items);
        console.log('IAP products:', items);
      } catch (error) {
        console.log('getProducts error:', error);
      }

      loadPlays();
    };

    init();
    return () => {
      RNIap.endConnection();
    };
  }, []);

  const loadPlays = async () => {
    const stored = await AsyncStorage.getItem('plays');
    setPlays(parseInt(stored || '0', 10));
  };

  const purchasePlayPack = async (sku: string, amount: number) => {
    try {
      const product = products.find(p => p.productId === sku);
      if (!product) {
        Alert.alert('Error', 'Product not available');
        return;
      }

      const result = await RNIap.requestPurchase({ sku: product.productId });

      if (
        result &&
        'transactionReceipt' in result &&
        result.transactionReceipt
      ) {
        const current = parseInt((await AsyncStorage.getItem('plays')) || '0');
        const newPlays = current + amount;
        await AsyncStorage.setItem('plays', newPlays.toString());
        setPlays(newPlays);
        Alert.alert('Success', `You have received ${amount} turns`);
      }
    } catch (err: any) {
      console.log('Purchase error:', err.code, err.message);
      if (err.code !== 'E_USER_CANCELLED') {
        Alert.alert('Warning', `Unsuccessful payment: ${err.message}`);
      }
    }
  };

  const renderItem = ({ item }: { item: (typeof PLAY_PACKS)[0] }) => {
    const product = products.find(p => p.productId === item.id);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => purchasePlayPack(item.id, item.plays)}
        disabled={!product}
      >
        <Text style={styles.playText}>+{item.plays} turns</Text>
        <Text style={styles.priceText}>
          {product ? product.localizedPrice : '...'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Remaining turns: {plays}</Text>
      <FlatList
        data={PLAY_PACKS}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={renderItem}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
        contentContainerStyle={{ padding: 20 }}
      />
    </View>
  );
};

export default BuyPlays;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    width: '30%',
    alignItems: 'center',
    elevation: 3,
  },
  playText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1b5e20',
  },
});
