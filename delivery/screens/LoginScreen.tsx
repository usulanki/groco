import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { setAuthToken, setRefreshToken, setStoredAgent } from '../utils/auth';
import { api } from '../utils/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.post<{
        agent: { id: number; first_name: string; last_name: string; email: string | null; mobile: string; store_id: number | null; outlet_id: number | null };
        accessToken: string;
        refreshToken: string;
      }>('/api/delivery/auth/login', { login: email.trim(), password: password.trim() });

      await Promise.all([
        setAuthToken(result.accessToken),
        setRefreshToken(result.refreshToken),
        setStoredAgent(result.agent),
      ]);
      navigation.replace('Home');
    } catch {
      Alert.alert('Login failed', 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Yellow header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>groco</Text>
          <Text style={styles.brandSub}>DELIVERY PARTNER</Text>
        </View>

        {/* White form card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowPass(v => !v)}>
                <Text style={styles.eyeText}>{showPass ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
          </View>

          {/* Forgot password */}
          <Pressable
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          {/* Login button */}
          <Pressable
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1a1a1a" />
            ) : (
              <Text style={styles.loginBtnText}>Log in</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Test login button */}
          <Pressable
            style={[styles.testBtn, loading && styles.loginBtnDisabled]}
            onPress={async () => {
              setLoading(true);
              try {
                const result = await api.post<{
                  agent: { id: number; first_name: string; last_name: string; email: string | null; mobile: string; store_id: number | null; outlet_id: number | null };
                  accessToken: string;
                  refreshToken: string;
                }>('/api/delivery/auth/login', { login: 'tom@marshall.com', password: 'Password@123' });
                await Promise.all([
                  setAuthToken(result.accessToken),
                  setRefreshToken(result.refreshToken),
                  setStoredAgent(result.agent),
                ]);
                navigation.replace('Home');
              } catch {
                Alert.alert('Test login failed', 'Could not log in with test account.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <View style={styles.testBtnLogo}>
              <Text style={styles.testBtnLogoText}>G</Text>
            </View>
            <Text style={styles.testBtnText}>Test Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#ffcc01' },
  scroll: { flexGrow: 1 },

  // ── Header ──────────────────────────────────────────────────
  header: {
    backgroundColor: '#ffcc01',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  brandName: {
    fontSize: 52,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -1.5,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.45)',
    letterSpacing: 4,
    marginTop: 2,
  },

  // ── Card ────────────────────────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 32,
  },

  // ── Fields ──────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 68,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    height: 52,
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },

  // ── Forgot ──────────────────────────────────────────────────
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 28,
    marginTop: 4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },

  // ── Login button ────────────────────────────────────────────
  loginBtn: {
    height: 54,
    backgroundColor: '#ffcc01',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // ── Divider ─────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ebebeb',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#bbb',
    fontWeight: '500',
  },

  // ── Test login ──────────────────────────────────────────────
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 14,
    backgroundColor: '#fff',
    gap: 12,
  },
  testBtnLogo: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#ffcc01',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnLogoText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  testBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
