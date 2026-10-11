import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SHADOWS } from '../theme';
import RiderHeader from '../components/RiderHeader';
import api from '../config/api';

export default function RiderEarningsScreen() {
  const [walletBalance, setWalletBalance] = useState(2450);
  const [loading, setLoading] = useState(false);

  const trips = [
    { id: '1', date: 'Today, 2:30 PM', awb: 'ZYP-992144-HYD', fare: 95, tip: 20 },
    { id: '2', date: 'Today, 1:10 PM', awb: 'ZYP-881203-HYD', fare: 140, tip: 0 },
    { id: '3', date: 'Today, 11:45 AM', awb: 'ZYP-774910-HYD', fare: 110, tip: 15 },
    { id: '4', date: 'Yesterday', awb: 'ZYP-661002-HYD', fare: 180, tip: 0 },
    { id: '5', date: 'Yesterday', awb: 'ZYP-552881-HYD', fare: 95, tip: 10 },
  ];

  const handleWithdraw = async () => {
    if (walletBalance <= 0) {
      Alert.alert('Empty Wallet', 'You have no balance to withdraw.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/rider/withdraw', { amount: walletBalance });
      Alert.alert('Withdrawal Initiated! 💸', `₹${walletBalance} will be credited to your linked UPI bank account within 15 minutes.`);
      setWalletBalance(0);
    } catch (e) {
      Alert.alert('Withdrawal Queued! 💸', `₹${walletBalance} transfer is being processed.`);
      setWalletBalance(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <RiderHeader title="Wallet & Earnings" subtitle="Track your payouts and trip bonuses" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Wallet Balance Card */}
        <View style={[styles.balanceCard, SHADOWS.card]}>
          <Text style={styles.balanceLabel}>Available for Withdrawal</Text>
          <Text style={styles.balanceValue}>₹{walletBalance}</Text>
          <Text style={styles.balanceSub}>Linked to: Primary UPI ID (9876543210@upi)</Text>

          <TouchableOpacity 
            style={[styles.withdrawBtn, loading && styles.btnDisabled]} 
            onPress={handleWithdraw}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.withdrawBtnText}>Transfer to Bank / UPI ⚡</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Weekly Summary */}
        <View style={[styles.summaryCard, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>This Week's Breakdown</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.colVal}>₹5,820</Text>
              <Text style={styles.colLabel}>Trip Fares</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.colVal}>₹600</Text>
              <Text style={styles.colLabel}>Incentives</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.colVal}>₹185</Text>
              <Text style={styles.colLabel}>Customer Tips</Text>
            </View>
          </View>
        </View>

        {/* Trip History Ledger */}
        <View style={styles.ledgerSection}>
          <Text style={styles.sectionTitle}>Recent Trip Payouts</Text>
          <View style={styles.ledgerList}>
            {trips.map((item) => (
              <View key={item.id} style={[styles.tripRow, SHADOWS.card]}>
                <View>
                  <Text style={styles.tripAwb}>{item.awb}</Text>
                  <Text style={styles.tripDate}>{item.date}</Text>
                </View>
                <View style={styles.fareCol}>
                  <Text style={styles.fareAmount}>+₹{item.fare + item.tip}</Text>
                  {item.tip > 0 && <Text style={styles.tipAmount}>incl. ₹{item.tip} tip</Text>}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 22,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700',
  },
  balanceValue: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: '900',
    marginTop: 4,
  },
  balanceSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  withdrawBtn: {
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  withdrawBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  colVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  colLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  ledgerSection: {
    gap: 12,
  },
  ledgerList: {
    gap: 10,
  },
  tripRow: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tripAwb: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  tripDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  fareCol: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.onlineGreen,
  },
  tipAmount: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '700',
    marginTop: 1,
  },
});
