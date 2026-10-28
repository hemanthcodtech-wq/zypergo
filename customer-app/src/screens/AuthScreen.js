import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, register, loading } = useAuth();

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in email and password');
      return;
    }
    if (!isLogin && !name) {
      setError('Please enter your full name');
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, phone, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  const fillDemo = () => {
    setEmail('customer@zypergo.com');
    setPassword('customer123');
    setName('Rajesh Sharma');
    setPhone('+91 98765 43210');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Brand Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="cube" size={38} color={colors.white} />
            </View>
            <Text style={styles.brandTitle}>ZyperGo</Text>
            <Text style={styles.brandSubtitle}>Fast, Reliable Parcel Logistics</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.tabActive]}
                onPress={() => { setIsLogin(true); setError(''); }}
              >
                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.tabActive]}
                onPress={() => { setIsLogin(false); setError(''); }}
              >
                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Register</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rahul Verma"
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoButton} onPress={fillDemo}>
              <Ionicons name="flash-outline" size={16} color={colors.primary} />
              <Text style={styles.demoButtonText}>Quick Demo Credentials</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scroll: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1
  },
  header: {
    alignItems: 'center',
    marginBottom: 32
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.black,
    letterSpacing: -0.5
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '500',
    flex: 1
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700'
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
    gap: 6
  },
  demoButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600'
  }
});
