import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { getRefreshToken, setAuthToken, setRefreshToken, clearAuth } from '../utils/auth';
import { api } from '../utils/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const checkAuth = async () => {
      const [refreshToken] = await Promise.all([
        getRefreshToken(),
        new Promise(resolve => setTimeout(resolve, 1800)),
      ]);

      if (!refreshToken) {
        navigation.replace('Login');
        return;
      }

      try {
        const result = await api.post<{ accessToken: string; refreshToken: string }>(
          '/api/delivery/auth/refresh',
          { refresh_token: refreshToken }
        );
        await Promise.all([
          setAuthToken(result.accessToken),
          setRefreshToken(result.refreshToken),
        ]);
        navigation.replace('Home');
      } catch {
        await clearAuth();
        navigation.replace('Login');
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.topDecor} />
      <Text style={styles.brandName}>groco</Text>
      <Text style={styles.tagline}>Delivery Partner</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffcc01',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topDecor: {
    position: 'absolute',
    top: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  brandName: {
    fontSize: 64,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.45)',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 8,
  },
});
