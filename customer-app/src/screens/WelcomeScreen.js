import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { COLORS } from '../theme';

export default function WelcomeScreen({ onNavigate }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⚡ HYPERFAST LOGISTICS</Text>
          </View>
          <Text style={styles.title}>ZyperGo</Text>
          <Text style={styles.subtitle}>
            On-demand intracity & intercity parcel delivery right at your fingertips.
          </Text>
        </View>

        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📍</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Live GPS Tracking</Text>
              <Text style={styles.featureDesc}>Real-time updates from pickup to doorstep.</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⏱️</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Express Dispatch</Text>
              <Text style={styles.featureDesc}>Rider arrives in minutes for quick local pickup.</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Secure OTP Delivery</Text>
              <Text style={styles.featureDesc}>Verified handoffs with tamper-proof tracking.</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => onNavigate('login')}
          >
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => onNavigate('signup')}
          >
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  badge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    maxWidth: '85%',
  },
  featuresCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  featureDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actions: {
    gap: 12,
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
