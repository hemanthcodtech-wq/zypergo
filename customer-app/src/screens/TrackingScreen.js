import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function TrackingScreen({ initialTrackingNumber, onNavigate, goBack }) {
  const [trackingId, setTrackingId] = useState(initialTrackingNumber || 'ZP-849204');
  const [currentStep, setCurrentStep] = useState(3); // 3 = Out for Delivery

  const steps = [
    { title: 'Order Booked', desc: 'Package registered in ZyperGo network', time: '10:15 AM' },
    { title: 'Picked Up', desc: 'Courier agent collected package from sender', time: '11:40 AM' },
    { title: 'In Transit - Hub Dispatch', desc: 'Arrived at Central Hub (BLR South)', time: '01:20 PM' },
    { title: 'Out for Delivery', desc: 'Assigned to delivery partner Suresh M.', time: '03:45 PM' },
    { title: 'Delivered', desc: 'Delivered to recipient with OTP verification', time: 'Pending' }
  ];

  const handleCallRider = () => {
    Linking.openURL('tel:+919876543210');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: 120 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => (goBack ? goBack() : onNavigate('home'))}
          style={{ marginRight: 12, padding: 4 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={[styles.screenHeading, { marginBottom: 0 }]}>Shipment Tracking</Text>
      </View>

      {/* Tracking Input Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Enter Tracking ID (e.g. ZP-849204)"
          value={trackingId}
          onChangeText={setTrackingId}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.searchBtn}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View>
            <Text style={styles.trackingNumberLabel}>CURRENT TRACKING</Text>
            <Text style={styles.trackingNumber}>{trackingId}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>OUT FOR DELIVERY</Text>
          </View>
        </View>

        <View style={styles.etaBox}>
          <Ionicons name="flash" size={20} color={colors.accent} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.etaTitle}>Estimated Arrival Today</Text>
            <Text style={styles.etaTime}>Between 5:30 PM - 6:30 PM</Text>
          </View>
        </View>
      </View>

      {/* Driver / Rider Card */}
      <View style={styles.riderCard}>
        <View style={styles.riderAvatar}>
          <Ionicons name="person" size={26} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.riderName}>Suresh M.</Text>
          <Text style={styles.riderSub}>Delivery Partner • Honda Activa (KA-03-ES-4912)</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>4.9 (420+ Deliveries)</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callButton} onPress={handleCallRider}>
          <Ionicons name="call" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Activity Timeline</Text>

        {steps.map((s, index) => {
          const isDone = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    isDone && styles.timelineDotDone,
                    isCurrent && styles.timelineDotCurrent
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  ) : (
                    <View style={styles.timelineDotInner} />
                  )}
                </View>
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      index < currentStep && styles.timelineLineDone
                    ]}
                  />
                )}
              </View>

              <View style={styles.timelineContent}>
                <View style={styles.timelineContentHeader}>
                  <Text style={[styles.stepTitle, isCurrent && styles.stepTitleActive]}>
                    {s.title}
                  </Text>
                  <Text style={styles.stepTime}>{s.time}</Text>
                </View>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  content: {
    padding: 20,
    paddingBottom: 90
  },
  screenHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.black,
    marginBottom: 16
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    fontWeight: '600'
  },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10
  },
  searchBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700'
  },
  statusCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  trackingNumberLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  trackingNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2
  },
  badge: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary
  },
  etaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14
  },
  etaTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E'
  },
  etaTime: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B45309',
    marginTop: 2
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  riderName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black
  },
  riderSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706'
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center'
  },
  timelineCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 20
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 65
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 14,
    width: 24
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  timelineDotDone: {
    backgroundColor: colors.primary
  },
  timelineDotCurrent: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: '#93C5FD'
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4
  },
  timelineLineDone: {
    backgroundColor: colors.primary
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16
  },
  timelineContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary
  },
  stepTitleActive: {
    fontWeight: '800',
    color: colors.black
  },
  stepTime: {
    fontSize: 12,
    color: colors.textMuted
  },
  stepDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3
  }
});
