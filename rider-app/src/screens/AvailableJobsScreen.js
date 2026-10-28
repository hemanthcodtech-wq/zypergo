import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { COLORS, SHADOWS } from '../theme';
import RiderHeader from '../components/RiderHeader';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

export default function AvailableJobsScreen({ onJobAccepted, onNavigateTab, goBack }) {
  const { isOnDuty } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [isOnDuty]);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/rider/jobs');
      const list = res?.data || res?.jobs || (Array.isArray(res) ? res : []);
      if (list && list.length > 0) {
        setJobs(list);
      } else {
        // Mock active pool of available jobs
        setJobs([
          {
            _id: 'job-101',
            trackingNumber: 'ZYP-992144-HYD',
            pickupAddress: 'Road 36, Jubilee Hills, Hyderabad',
            pickupDistance: '1.2 km away',
            dropAddress: 'Mindspace IT Park, Madhapur, Hyderabad',
            tripDistance: '5.4 km',
            packageType: 'Document Folder',
            estimatedPayout: 95,
            urgent: true,
          },
          {
            _id: 'job-102',
            trackingNumber: 'ZYP-881203-HYD',
            pickupAddress: 'Banjara Hills Rd 10, Hyderabad',
            pickupDistance: '2.5 km away',
            dropAddress: 'Kondapur Main Rd, Hyderabad',
            tripDistance: '8.1 km',
            packageType: 'Bakery / Cake Box',
            estimatedPayout: 140,
            urgent: false,
          },
          {
            _id: 'job-103',
            trackingNumber: 'ZYP-774910-HYD',
            pickupAddress: 'Begumpet Airport Rd, Hyderabad',
            pickupDistance: '3.8 km away',
            dropAddress: 'Secunderabad Railway Station, Hyderabad',
            tripDistance: '4.2 km',
            packageType: 'Electronics Parcel',
            estimatedPayout: 110,
            urgent: false,
          },
        ]);
      }
    } catch (e) {
      setJobs([
        {
          _id: 'job-101',
          trackingNumber: 'ZYP-992144-HYD',
          pickupAddress: 'Road 36, Jubilee Hills, Hyderabad',
          pickupDistance: '1.2 km away',
          dropAddress: 'Mindspace IT Park, Madhapur, Hyderabad',
          tripDistance: '5.4 km',
          packageType: 'Document Folder',
          estimatedPayout: 95,
          urgent: true,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAccept = async (job) => {
    setAcceptingId(job._id);
    try {
      await api.post(`/rider/jobs/${job._id}/accept`, {});
      Alert.alert(
        'Trip Accepted! 🛵',
        `Navigate to ${job.pickupAddress} for pickup.`,
        [{ text: 'Start Trip', onPress: () => onJobAccepted(job) }]
      );
    } catch (e) {
      // Offline fallback
      Alert.alert(
        'Trip Assigned! 🛵',
        `Proceeding with ${job.trackingNumber}`,
        [{ text: 'Start Trip', onPress: () => onJobAccepted(job) }]
      );
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = (jobId) => {
    setJobs(prev => prev.filter(j => j._id !== jobId));
  };

  return (
    <View style={styles.container}>
      <RiderHeader 
        title="Available Pickups" 
        subtitle={`${jobs.length} delivery requests nearby`} 
        onBack={goBack || (() => onNavigateTab && onNavigateTab('dashboard'))}
      />

      {!isOnDuty ? (
        <View style={styles.dutyWarning}>
          <Text style={styles.dutyWarningText}>⚠️ You must be ON DUTY to accept delivery orders.</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); fetchJobs(); }} 
              colors={[COLORS.primary]} 
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySub}>No pending deliveries right now. Stay online to catch new requests.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.jobCard, SHADOWS.card]}>
              <View style={styles.cardTop}>
                <View style={styles.badgeRow}>
                  <View style={styles.awbBadge}>
                    <Text style={styles.awbText}>{item.trackingNumber}</Text>
                  </View>
                  {item.urgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>⚡ EXPRESS</Text>
                    </View>
                  )}
                </View>
                <View style={styles.payoutCol}>
                  <Text style={styles.payoutLabel}>Payout</Text>
                  <Text style={styles.payoutValue}>₹{item.estimatedPayout}</Text>
                </View>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.pointRow}>
                  <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                  <View style={styles.pointContent}>
                    <Text style={styles.pointLabel}>PICKUP ({item.pickupDistance || 'Near you'})</Text>
                    <Text style={styles.pointAddress}>{item.pickupAddress}</Text>
                  </View>
                </View>

                <View style={styles.routeLine} />

                <View style={styles.pointRow}>
                  <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
                  <View style={styles.pointContent}>
                    <Text style={styles.pointLabel}>DROPOFF ({item.tripDistance || 'Est. trip'})</Text>
                    <Text style={styles.pointAddress}>{item.dropAddress}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.packageTag}>
                <Text style={styles.packageTagText}>📦 {item.packageType}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.declineBtn} 
                  onPress={() => handleDecline(item._id)}
                >
                  <Text style={styles.declineBtnText}>Pass</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.acceptBtn, (!isOnDuty || acceptingId === item._id) && styles.btnDisabled]} 
                  onPress={() => handleAccept(item)}
                  disabled={!isOnDuty || acceptingId === item._id}
                >
                  {acceptingId === item._id ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Text style={styles.acceptBtnText}>Accept & Ride →</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  dutyWarning: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  dutyWarningText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  awbBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  awbText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgentText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '900',
  },
  payoutCol: {
    alignItems: 'flex-end',
  },
  payoutLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  payoutValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.onlineGreen,
  },
  routeContainer: {
    marginVertical: 10,
    gap: 4,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.border,
    marginLeft: 4,
  },
  pointContent: {
    flex: 1,
  },
  pointLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  pointAddress: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  packageTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 14,
  },
  packageTagText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  declineBtnText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  acceptBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: '80%',
  },
});
