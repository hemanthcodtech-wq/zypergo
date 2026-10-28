import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { COLORS, SHADOWS } from '../theme';
import { useAuth } from '../context/AuthContext';
import DutyToggle from '../components/DutyToggle';
import api from '../config/api';

export default function RiderDashboardScreen({ onNavigateTab }) {
  const { user, isOnDuty } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayEarnings: 840,
    tripsCompleted: 6,
    onlineHours: '4.5 hrs',
    rating: '4.9 ⭐',
    nearbyJobsCount: 2,
  });

  useEffect(() => {
    fetchStats();
  }, [isOnDuty]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/rider/jobs');
      const jobs = res?.data || res?.jobs || [];
      setStats(prev => ({ ...prev, nearbyJobsCount: jobs.length || 3 }));
    } catch (e) {
      // Keep state
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Top Rider Welcome Bar */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.riderName}>{user?.name || 'Rider Captain'} 🛵</Text>
          <Text style={styles.riderVehicle}>{user?.vehicleNumber || 'TS 09 AB 1234'} • {stats.rating}</Text>
        </View>
        <TouchableOpacity style={styles.profileAvatar} onPress={() => onNavigateTab('profile')}>
          <Text style={styles.avatarLetter}>{(user?.name || 'R')[0].toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Big Online/Offline Switch */}
      <View style={styles.section}>
        <DutyToggle />
      </View>

      {/* Online Status Banner */}
      {isOnDuty ? (
        <TouchableOpacity 
          style={[styles.jobAlertCard, SHADOWS.glow]}
          onPress={() => onNavigateTab('jobs')}
        >
          <View style={styles.jobAlertHeader}>
            <View style={styles.pulseDot} />
            <Text style={styles.jobAlertTitle}>NEW ORDERS AVAILABLE</Text>
          </View>
          <Text style={styles.jobAlertSub}>
            {stats.nearbyJobsCount} delivery request(s) waiting nearby. Tap to view and accept.
          </Text>
          <View style={styles.jobAlertBtn}>
            <Text style={styles.jobAlertBtnText}>View Available Trips ({stats.nearbyJobsCount}) →</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.offlineNotice}>
          <Text style={styles.offlineIcon}>💤</Text>
          <Text style={styles.offlineTitle}>You are currently Offline</Text>
          <Text style={styles.offlineSub}>Toggle the switch above to start receiving delivery orders nearby.</Text>
        </View>
      )}

      {/* Today's Earnings Snapshot */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Earnings</Text>
          <TouchableOpacity onPress={() => onNavigateTab('earnings')}>
            <Text style={styles.linkText}>View Wallet →</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.statsCard, SHADOWS.card]}>
          <View style={styles.earningHero}>
            <Text style={styles.earningValue}>₹{stats.todayEarnings}</Text>
            <Text style={styles.earningSub}>Net earnings today</Text>
          </View>

          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.tripsCompleted}</Text>
              <Text style={styles.statLabel}>Trips Done</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats.onlineHours}</Text>
              <Text style={styles.statLabel}>Shift Time</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>₹140</Text>
              <Text style={styles.statLabel}>Avg / Drop</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Daily Incentive Progress */}
      <View style={[styles.incentiveCard, SHADOWS.card]}>
        <View style={styles.incentiveHeader}>
          <Text style={styles.incentiveBadge}>🎯 DAILY BONUS</Text>
          <Text style={styles.incentiveReward}>Earn +₹200</Text>
        </View>
        <Text style={styles.incentiveTitle}>Complete 8 trips today</Text>
        <Text style={styles.incentiveSub}>{stats.tripsCompleted} of 8 trips completed (2 remaining)</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(stats.tripsCompleted / 8) * 100}%` }]} />
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.quickGrid}>
        <TouchableOpacity style={styles.quickCard} onPress={() => onNavigateTab('active')}>
          <Text style={styles.quickIcon}>🧭</Text>
          <Text style={styles.quickTitle}>Active Trip</Text>
          <Text style={styles.quickSub}>Navigation & OTP</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickCard} onPress={() => onNavigateTab('earnings')}>
          <Text style={styles.quickIcon}>💳</Text>
          <Text style={styles.quickTitle}>Instant Payout</Text>
          <Text style={styles.quickSub}>Withdraw to UPI</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    paddingBottom: 100,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  riderName: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  riderVehicle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    gap: 10,
  },
  jobAlertCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 18,
  },
  jobAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  jobAlertTitle: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  jobAlertSub: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 12,
  },
  jobAlertBtn: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  jobAlertBtnText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  offlineNotice: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  offlineIcon: {
    fontSize: 30,
    marginBottom: 6,
  },
  offlineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  offlineSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: '85%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  linkText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  earningHero: {
    marginBottom: 16,
  },
  earningValue: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.onlineGreen,
  },
  earningSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  statGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  incentiveCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  incentiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  incentiveBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  incentiveReward: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B45309',
  },
  incentiveTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  incentiveSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#FDE68A',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  quickSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
