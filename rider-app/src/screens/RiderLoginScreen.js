import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { COLORS } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function RiderLoginScreen({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required', 'Please enter your registered rider email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid rider credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('welcome')}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Rider Partner Sign In 🛵</Text>
            <Text style={styles.subtitle}>Log in with your credentials to start your shift.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rider Email ID / Mobile</Text>
              <TextInput
                style={styles.input}
                placeholder="rider@zypergo.com"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Start Driving Now</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to ZyperGo? </Text>
              <TouchableOpacity onPress={() => onNavigate('signup')}>
                <Text style={styles.linkText}>Register as Rider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
  },
  backBtn: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 6,
    lineHeight: 20,
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  linkText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});
