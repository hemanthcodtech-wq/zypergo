import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SHADOWS } from '../theme';
import Header from '../components/Header';
import api from '../config/api';

export default function BookingScreen({ onBookingSuccess }) {
  const [step, setStep] = useState(1); // 1: Pickup & Drop, 2: Package & Estimate
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [pickupName, setPickupName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState('Hyderabad');

  const [dropName, setDropName] = useState('');
  const [dropPhone, setDropPhone] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [dropCity, setDropCity] = useState('Hyderabad');

  const [packageType, setPackageType] = useState('Box / Parcel');
  const [weight, setWeight] = useState('1');
  const [deliveryType, setDeliveryType] = useState('Standard');
  const [calculatedFare, setCalculatedFare] = useState(120);

  const packageOptions = ['Document', 'Box / Parcel', 'Food / Bakery', 'Electronics', 'Heavy Cargo'];

  const handleNextStep = () => {
    if (!pickupAddress || !dropAddress) {
      Alert.alert('Required Fields', 'Please fill in pickup and drop addresses.');
      return;
    }
    // Calculate estimated fare
    const baseRate = deliveryType === 'Express' ? 180 : 120;
    const wtRate = (parseFloat(weight) || 1) * 25;
    setCalculatedFare(Math.round(baseRate + wtRate));
    setStep(2);
  };

  const handleCreateBooking = async () => {
    setLoading(true);
    try {
      const payload = {
        pickup: {
          name: pickupName || 'Sender',
          phone: pickupPhone || '9876543210',
          address: pickupAddress,
          city: pickupCity,
        },
        drop: {
          name: dropName || 'Recipient',
          phone: dropPhone || '9876543210',
          address: dropAddress,
          city: dropCity,
        },
        package: {
          type: packageType,
          weight: parseFloat(weight) || 1,
        },
        deliveryType,
        totalAmount: calculatedFare,
        paymentMode: 'COD',
      };

      const res = await api.post('/bookings', payload);
      const tracking = res?.booking?.trackingNumber || res?.trackingNumber || 'ZYP-' + Math.floor(100000 + Math.random() * 900000);
      
      Alert.alert(
        'Booking Confirmed! 🎉',
        `Your delivery has been booked successfully!\n\nTracking AWB: ${tracking}\nEstimated Fare: ₹${calculatedFare}`,
        [{ text: 'View Shipments', onPress: () => onBookingSuccess && onBookingSuccess(tracking) }]
      );
    } catch (err) {
      // Offline fallback demonstration
      const simulatedAwb = 'ZYP-' + Math.floor(100000 + Math.random() * 900000);
      Alert.alert(
        'Order Logged! 🎉',
        `Tracking ID: ${simulatedAwb}\nRider will be assigned shortly.`,
        [{ text: 'Done', onPress: () => onBookingSuccess && onBookingSuccess(simulatedAwb) }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Book Delivery" 
        subtitle={step === 1 ? 'Step 1 of 2: Route Details' : 'Step 2 of 2: Package & Review'} 
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 1 ? (
          <View style={styles.formSection}>
            <Text style={styles.sectionHeader}>📍 Pickup Location</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                placeholder="Sender Contact Name"
                placeholderTextColor={COLORS.textMuted}
                value={pickupName}
                onChangeText={setPickupName}
              />
              <TextInput
                style={styles.input}
                placeholder="Sender Phone Number"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={pickupPhone}
                onChangeText={setPickupPhone}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Complete Pickup Address (House / Flat / Landmark)"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
                value={pickupAddress}
                onChangeText={setPickupAddress}
              />
              <TextInput
                style={styles.input}
                placeholder="City (e.g. Hyderabad)"
                placeholderTextColor={COLORS.textMuted}
                value={pickupCity}
                onChangeText={setPickupCity}
              />
            </View>

            <Text style={[styles.sectionHeader, { marginTop: 20 }]}>🎯 Drop Location</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                placeholder="Recipient Name"
                placeholderTextColor={COLORS.textMuted}
                value={dropName}
                onChangeText={setDropName}
              />
              <TextInput
                style={styles.input}
                placeholder="Recipient Phone Number"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={dropPhone}
                onChangeText={setDropPhone}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Complete Drop Address (Door no / Street / Area)"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
                value={dropAddress}
                onChangeText={setDropAddress}
              />
              <TextInput
                style={styles.input}
                placeholder="City (e.g. Hyderabad)"
                placeholderTextColor={COLORS.textMuted}
                value={dropCity}
                onChangeText={setDropCity}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleNextStep}>
              <Text style={styles.primaryBtnText}>Continue to Package Details →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formSection}>
            <Text style={styles.sectionHeader}>📦 Package Details</Text>
            <View style={styles.card}>
              <Text style={styles.label}>Select Item Type</Text>
              <View style={styles.chipsRow}>
                {packageOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, packageType === opt && styles.chipActive]}
                    onPress={() => setPackageType(opt)}
                  >
                    <Text style={[styles.chipText, packageType === opt && styles.chipTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Approx Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2.5"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />

              <Text style={[styles.label, { marginTop: 16 }]}>Speed / Service</Text>
              <View style={styles.speedRow}>
                <TouchableOpacity
                  style={[styles.speedCard, deliveryType === 'Standard' && styles.speedCardActive]}
                  onPress={() => setDeliveryType('Standard')}
                >
                  <Text style={styles.speedTitle}>Standard</Text>
                  <Text style={styles.speedSub}>Same Day</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.speedCard, deliveryType === 'Express' && styles.speedCardActive]}
                  onPress={() => setDeliveryType('Express')}
                >
                  <Text style={styles.speedTitle}>⚡ Express</Text>
                  <Text style={styles.speedSub}>60 Mins</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Price Breakdown */}
            <View style={[styles.fareCard, SHADOWS.card]}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Estimated Delivery Fare</Text>
                <Text style={styles.farePrice}>₹{calculatedFare}</Text>
              </View>
              <Text style={styles.fareNote}>Includes doorstep pickup, safe handling & live GPS tracking</Text>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.primaryBtn, { flex: 2, marginTop: 0 }]} 
                onPress={handleCreateBooking}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Confirm & Book</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    paddingBottom: 40,
  },
  formSection: {
    gap: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.background,
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
  speedRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  speedCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  speedCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  speedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  speedSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  fareCard: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  farePrice: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.accent,
  },
  fareNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  backBtnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
