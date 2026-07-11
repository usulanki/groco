import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      // TODO: replace with real API call
      // await api.post('/delivery/auth/forgot-password', { email });
      await new Promise(r => setTimeout(r, 1200));
      setSent(true);
    } catch {
      Alert.alert('Error', 'Could not send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      {/* Back button */}
      <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backText}>Back to login</Text>
      </Pressable>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Text style={styles.iconEmoji}>🔑</Text>
        </View>

        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter the email linked to your account and we'll send a reset link.
        </Text>

        {sent ? (
          <View style={styles.sentBox}>
            <Text style={styles.sentIcon}>✅</Text>
            <Text style={styles.sentTitle}>Reset link sent</Text>
            <Text style={styles.sentMsg}>
              Check your inbox at {email} and follow the instructions.
            </Text>
            <Pressable style={styles.backToLoginBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backToLoginText}>Back to login</Text>
            </Pressable>
          </View>
        ) : (
          <>
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

            <Pressable
              style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1a1a1a" />
              ) : (
                <Text style={styles.sendBtnText}>Send reset link</Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 8,
    gap: 6,
  },
  backArrow: {
    fontSize: 20,
    color: '#1a1a1a',
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff9e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
    marginBottom: 36,
  },
  fieldGroup: {
    marginBottom: 24,
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
  sendBtn: {
    height: 54,
    backgroundColor: '#ffcc01',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // ── Sent state ──────────────────────────────────────────────
  sentBox: {
    alignItems: 'center',
    paddingTop: 12,
  },
  sentIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  sentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  sentMsg: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },
  backToLoginBtn: {
    height: 54,
    width: '100%',
    backgroundColor: '#ffcc01',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToLoginText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
});
