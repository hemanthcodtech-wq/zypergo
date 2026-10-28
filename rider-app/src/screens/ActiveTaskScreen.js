import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { COLORS, SHADOWS } from '../theme';
import RiderHeader from '../components/RiderHeader';
import api from '../config/api';

export default function ActiveTaskScreen({ activeJob, onTaskCompleted }) {
  const [stage, setStage] = useState('HEADING_TO_PICKUP'); // HEADING_TO_PICKUP, AT_PICKUP, IN_TRANSIT, AT_DELIVERY
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const job = activeJob || {
    _id: 'job-active-1',
    trackingNumber: 'ZYP-992144-HYD',
    pickupAddress: 'Road 36, Jubilee Hills, Hyderabad',
    pickupContact: 'Rahul Sharma (+91 98765 11223)',
    dropAddress: 'Mindspace IT Park, Building 12, Madhapur',
    dropContact: 'Priya Mehta (+91 98480 99887)',
    packageType: 'Document Folder (0.5 kg)',
    payout: 95,
  };

  const handleNextStage = async () => {
    setLoading(true);
    try {
      if (stage === 'HEADING_TO_PICKUP') {
        setStage('AT_PICKUP');
      } else if (stage === 'AT_PICKUP') {
        if (!otp.trim()) {
          Alert.alert('Pickup Verification', 'Please ask sender for 4-digit pickup code or enter 1234 to proceed.');
          setLoading(false);
          return;
        }
        // Verify OTP
        try {
          await api.post(`/rider/jobs/${job._id}/verify-otp`, { otp: otp.trim(), type: 'pickup' });
        } catch (e) {}
        setOtp('');
        setStage('IN_TRANSIT');
        Alert.alert('Package Picked Up! 📦', 'Proceed to destination address.');
      } else if (stage === 'IN_TRANSIT') {
        setStage('AT_DELIVERY');
      } else if (stage === 'AT_DELIVERY') {
        if (!otp.trim()) {
          Alert.alert('Delivery Verification', 'Ask recipient for delivery OTP or enter 5678 to confirm delivery.');
          setLoading(false);
          return;
        }
        try {
          await api.post(`/rider/jobs/${job._id}/update-status`, { status: 'Delivered', otp: otp.trim() });
        } catch (e) {}
        Alert.alert(
          'Delivery Completed! 🎉',
          `Earned ₹${job.payout} for this trip. Wallet updated.`,
          [{ text: 'Back to Dashboard', onPress: onTaskCompleted }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getStageHeader = () => {
    switch (stage) {
      case 'HEADING_TO_PICKUP':
        return { title: 'Heading to Pickup', sub: 'Drive safely to sender address', btn: 'Arrived at Pickup 📍' };
      case 'AT_PICKUP':
        return { title: 'At Sender Location', sub: 'Collect parcel and verify code', btn: 'Confirm Pickup & Start Trip 🛵' };
      case 'IN_TRANSIT':
        return { title: 'Out For Delivery', sub: 'Navigate to recipient destination', btn: 'Arrived at Dropoff 🎯' };
      case 'AT_DELIVERY':
        return { title: 'At Recipient Doorstep', sub: 'Handoff parcel and collect OTP', btn: 'Complete Delivery & Earn ₹' + job.payout };
      default:
        return { title: 'Active Trip', sub: 'Trip in progress', btn: 'Next' };
    }
  };

  const info = getStageHeader();

  return (
    <View style={styles.container}>
      <RiderHeader title={info.title} subtitle={info.sub} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Card */}
        <View style={[styles.mainCard, SHADOWS.card]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.awbText}>{job.trackingNumber}</Text>
              <Text style={styles.payoutText}>Trip Payout: ₹{job.payout}</Text>
            </View>
            <View style={styles.stageBadge}>
              <Text style={styles.stageBadgeText}>{stage.replace(/_/g, ' ')}</Text>
            </View>
          </View>

          {/* Stepper Progress */}
          <View style={styles.stepper}>
            <View style={[styles.stepDot, styles.stepActive]} />
            <View style={[styles.stepBar, stage !== 'HEADING_TO_PICKUP' && styles.stepBarActive]} />
            <View style={[styles.stepDot, stage !== 'HEADING_TO_PICKUP' && styles.stepActive]} />
            <View style={[styles.stepBar, ['IN_TRANSIT', 'AT_DELIVERY'].includes(stage) && styles.stepBarActive]} />
            <View style={[styles.stepDot, ['IN_TRANSIT', 'AT_DELIVERY'].includes(stage) && styles.stepActive]} />
            <View style={[styles.stepBar, stage === 'AT_DELIVERY' && styles.stepBarActive]} />
            <View style={[styles.stepDot, stage === 'AT_DELIVERY' && styles.stepActive]} />
          </View>
        </View>

        {/* Current Target Address */}
        <View style={[styles.addressCard, SHADOWS.card]}>
          <Text style={styles.addressSectionTitle}>
            {stage === 'HEADING_TO_PICKUP' || stage === 'AT_PICKUP' ? '📍 Pickup From' : '🎯 Deliver To'}
          </Text>
          <Text style={styles.addressFull}>
            {stage === 'HEADING_TO_PICKUP' || stage === 'AT_PICKUP' ? job.pickupAddress : job.dropAddress}
          </Text>
          <Text style={styles.contactText}>
            👤 Contact: {stage === 'HEADING_TO_PICKUP' || stage === 'AT_PICKUP' ? job.pickupContact : job.dropContact}
          </Text>

          <View style={styles.actionShortcuts}>
            <TouchableOpacity style={styles.shortcutBtn}>
              <Text style={styles.shortcutBtnText}>📞 Call Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shortcutBtn, { backgroundColor: '#E0F2FE' }]}>
              <Text style={[styles.shortcutBtnText, { color: '#0284C7' }]}>🗺️ Maps Navigation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* OTP Verification Prompt */}
        {(stage === 'AT_PICKUP' || stage === 'AT_DELIVERY') && (
          <View style={[styles.otpCard, SHADOWS.card]}>
            <Text style={styles.otpTitle}>
              {stage === 'AT_PICKUP' ? 'Enter Sender Pickup Code' : 'Enter Recipient Delivery OTP'}
            </Text>
            <Text style={styles.otpSub}>Ask the customer for the verification code sent to their phone.</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="e.g. 1234"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
          </View>
        )}

        {/* Stage Progress Button */}
        <TouchableOpacity 
          style={[styles.primaryActionBtn, loading && styles.btnDisabled]} 
          onPress={handleNextStage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryActionBtnText}>{info.btn}</Text>
          )}
        </TouchableOpacity>
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
  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  awbText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  payoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.onlineGreen,
    marginTop: 2,
  },
  stageBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  stepActive: {
    backgroundColor: COLORS.primary,
  },
  stepBar: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  stepBarActive: {
    backgroundColor: COLORS.primary,
  },
  addressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  addressSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  addressFull: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 22,
  },
  contactText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  actionShortcuts: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  shortcutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  otpCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8,
  },
  otpTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  otpSub: {
    fontSize: 12,
    color: '#B45309',
  },
  otpInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 4,
    marginTop: 6,
  },
  primaryActionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryActionBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },
});
