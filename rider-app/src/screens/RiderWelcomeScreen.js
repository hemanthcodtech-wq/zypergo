import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS } from '../theme';

export default function RiderWelcomeScreen({ onNavigate }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🛵 ZYPERGO FLEET PARTNER</Text>
          </View>
          <Text style={styles.title}>Earn on Every Delivery</Text>
          <Text style={styles.subtitle}>
            Join our city delivery network. Flexible hours, instant payouts, and maximum per-drop incentives.
          </Text>
        </View>

        <View style={styles.benefitsCard}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💵</Text>
            <View style={styles.benefitTextCol}>
              <Text style={styles.benefitTitle}>Up to ₹35,000 / month</Text>
              <Text style={styles.benefitDesc}>Competitive base fares + surge bonuses per trip.</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⏱️</Text>
            <View style={styles.benefitTextCol}>
              <Text style={styles.benefitTitle}>Work on Your Schedule</Text>
              <Text style={styles.benefitDesc}>Switch online whenever you want to ride.</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📲</Text>
            <View style={styles.benefitTextCol}>
              <Text style={styles.benefitTitle}>Daily Wallet Withdrawals</Text>
              <Text style={styles.benefitDesc}>Direct UPI transfers straight to your bank account.</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => onNavigate('login')}
          >
            <Text style={styles.primaryBtnText}>Rider Login</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => onNavigate('signup')}
          >
            <Text style={styles.secondaryBtnText}>Apply as New Rider</Text>
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
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
    maxWidth: '90%',
  },
  benefitsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  benefitIcon: {
    fontSize: 26,
    marginRight: 14,
  },
  benefitTextCol: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  benefitDesc: {
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
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
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
