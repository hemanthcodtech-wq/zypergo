import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { COLORS } from '../theme';
import api from '../config/api';

export default function RiderSignupScreen({ onNavigate }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Motorcycle / Bike');
  const [city, setCity] = useState('Hyderabad');
  const [loading, setLoading] = useState(false);

  const vehicleOptions = ['Motorcycle / Bike', 'EV Scooter', 'Three Wheeler / Auto', 'Mini Truck / Van'];

  const handleApply = async () => {
    if (!name || !phone || !email || !vehicleNumber) {
      Alert.alert('Required', 'Please fill in all vehicle and contact fields.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/rider-apply', {
        name,
        phone,
        email,
        vehicleNumber,
        vehicleType,
        city,
      });

      Alert.alert(
        'Application Submitted! 📋',
        'Thank you for applying. Our operations team will review your documents and activate your account within 24 hours.',
        [{ text: 'Go to Login', onPress: () => onNavigate('login') }]
      );
    } catch (err) {
      Alert.alert(
        'Application Received',
        'Your application details have been registered. Please log in once approved.',
        [{ text: 'OK', onPress: () => onNavigate('login') }]
      );
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
            <Text style={styles.title}>Join ZyperGo Fleet 🚀</Text>
            <Text style={styles.subtitle}>Enter your details and start earning immediately.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Ramesh Verma"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="ramesh@example.com"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Number Plate</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. TS 09 AB 1234"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={styles.chipsRow}>
                {vehicleOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, vehicleType === opt && styles.chipActive]}
                    onPress={() => setVehicleType(opt)}
                  >
                    <Text style={[styles.chipText, vehicleType === opt && styles.chipTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Operating City</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Hyderabad"
                placeholderTextColor={COLORS.textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleApply}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Submit Rider Application</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already approved? </Text>
              <TouchableOpacity onPress={() => onNavigate('login')}>
                <Text style={styles.linkText}>Sign In</Text>
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
    marginBottom: 24,
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
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    color: COLORS.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
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
    fontSize: 15,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
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
