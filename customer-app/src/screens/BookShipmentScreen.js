import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function BookShipmentScreen({ onNavigate, goBack }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Form State
  const [pickupName, setPickupName] = useState(user?.name || '');
  const [pickupPhone, setPickupPhone] = useState(user?.phone || '+91 98765 43210');
  const [pickupAddress, setPickupAddress] = useState('Flat 402, Sunshine Heights, Indiranagar');
  const [pickupPincode, setPickupPincode] = useState('560038');

  const [dropName, setDropName] = useState('Amit Sharma');
  const [dropPhone, setDropPhone] = useState('+91 91234 56789');
  const [dropAddress, setDropAddress] = useState('Tech Park, Block B, 4th Floor, Whitefield');
  const [dropPincode, setDropPincode] = useState('560066');

  const [weight, setWeight] = useState('2.5');
  const [packageType, setPackageType] = useState('Parcel');
  const [vehicle, setVehicle] = useState('2-Wheeler (Bike)');
  const [paymentMethod, setPaymentMethod] = useState('UPI / Online');

  const calculateEstimate = () => {
    const base = 40;
    const w = parseFloat(weight) || 1;
    let multiplier = 25;
    if (vehicle.includes('Van')) multiplier = 50;
    if (vehicle.includes('Truck')) multiplier = 90;
    return Math.round(base + (w * multiplier));
  };

  const handleBooking = async () => {
    setLoading(true);
    const trackingId = 'ZP-' + Math.floor(100000 + Math.random() * 900000);
    const estimatedCost = calculateEstimate();

    const bookingPayload = {
      trackingNumber: trackingId,
      sender: { name: pickupName, phone: pickupPhone, address: pickupAddress, pincode: pickupPincode },
      recipient: { name: dropName, phone: dropPhone, address: dropAddress, pincode: dropPincode },
      package: { weight: parseFloat(weight) || 1, type: packageType, vehicle },
      pricing: { totalAmount: estimatedCost, paymentMode: paymentMethod },
      status: 'BOOKED',
      createdAt: new Date().toISOString()
    };

    try {
      await api.post('/bookings', bookingPayload);
    } catch (e) {
      console.log('Booked locally / offline mode');
    }

    setLoading(false);
    setBookingSuccess({ trackingId, estimatedCost });
  };

  if (bookingSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </View>
        <Text style={styles.successTitle}>Shipment Confirmed!</Text>
        <Text style={styles.successSub}>A courier agent has been requested for pickup.</Text>

        <View style={styles.trackingCard}>
          <Text style={styles.trackCardLabel}>TRACKING NUMBER</Text>
          <Text style={styles.trackCardCode}>{bookingSuccess.trackingId}</Text>
          <View style={styles.trackCardDivider} />
          <View style={styles.trackCardRow}>
            <Text style={styles.trackCardSmallLabel}>Estimated Fare</Text>
            <Text style={styles.trackCardPrice}>₹{bookingSuccess.estimatedCost}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => onNavigate('track', { trackingNumber: bookingSuccess.trackingId })}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.white} />
          <Text style={styles.primaryBtnText}>Track Shipment Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            setBookingSuccess(null);
            setStep(1);
            onNavigate('home');
          }}
        >
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: 120 }]}>
      {/* Step Indicator */}
      <View style={styles.stepHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (step > 1) {
              setStep(step - 1);
            } else if (goBack) {
              goBack();
            } else {
              onNavigate('home');
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.screenHeading}>Book Delivery</Text>
        <Text style={styles.stepCounter}>Step {step} of 3</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }]} />
      </View>

      {/* Step 1: Pickup & Drop */}
      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Pickup Location</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sender Name</Text>
            <TextInput
              style={styles.input}
              value={pickupName}
              onChangeText={setPickupName}
              placeholder="Your name"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sender Phone</Text>
            <TextInput
              style={styles.input}
              value={pickupPhone}
              onChangeText={setPickupPhone}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Complete Pickup Address</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              multiline
              value={pickupAddress}
              onChangeText={setPickupAddress}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pickup Pincode</Text>
            <TextInput
              style={styles.input}
              value={pickupPincode}
              onChangeText={setPickupPincode}
              keyboardType="number-pad"
            />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
            <Text style={styles.primaryBtnText}>Continue to Delivery Details</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Drop Location */}
      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏁 Delivery Address</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Receiver Name</Text>
            <TextInput
              style={styles.input}
              value={dropName}
              onChangeText={setDropName}
              placeholder="Receiver full name"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Receiver Phone</Text>
            <TextInput
              style={styles.input}
              value={dropPhone}
              onChangeText={setDropPhone}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Complete Delivery Address</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              multiline
              value={dropAddress}
              onChangeText={setDropAddress}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Pincode</Text>
            <TextInput
              style={styles.input}
              value={dropPincode}
              onChangeText={setDropPincode}
              keyboardType="number-pad"
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={() => setStep(3)}>
              <Text style={styles.primaryBtnText}>Continue to Package Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 3: Package, Vehicle & Confirmation */}
      {step === 3 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Parcel Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.label}>Package Type</Text>
          <View style={styles.chipRow}>
            {['Documents', 'Parcel', 'Fragile', 'Electronics'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, packageType === type && styles.chipActive]}
                onPress={() => setPackageType(type)}
              >
                <Text style={[styles.chipText, packageType === type && styles.chipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 14 }]}>Vehicle Type</Text>
          <View style={styles.chipRow}>
            {['2-Wheeler (Bike)', 'Van / Porter', 'Mini Truck'].map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.chip, vehicle === v && styles.chipActive]}
                onPress={() => setVehicle(v)}
              >
                <Text style={[styles.chipText, vehicle === v && styles.chipTextActive]}>
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pricing Summary */}
          <View style={styles.fareCard}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Estimated Delivery Fee</Text>
              <Text style={styles.fareValue}>₹{calculateEstimate()}</Text>
            </View>
            <Text style={styles.fareNote}>Includes GST and insurance protection</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1 }]}
              onPress={handleBooking}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Confirm & Book Pickup</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  screenHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.black
  },
  stepCounter: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3
  },
  card: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 14
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  fareCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 16,
    borderRadius: 14,
    marginTop: 12
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  fareLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534'
  },
  fareValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#166534'
  },
  fareNote: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 4
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 10
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700'
  },
  backBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 14,
    marginTop: 10
  },
  backBtnText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 14
  },
  successContainer: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  successIconCircle: {
    marginBottom: 16
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.black,
    textAlign: 'center'
  },
  successSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24
  },
  trackingCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 18,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24
  },
  trackCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textSecondary
  },
  trackCardCode: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6
  },
  trackCardDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    width: '100%',
    marginVertical: 14
  },
  trackCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  trackCardSmallLabel: {
    fontSize: 13,
    color: colors.textSecondary
  },
  trackCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success
  },
  secondaryBtn: {
    paddingVertical: 12,
    marginTop: 12
  },
  secondaryBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600'
  }
});
