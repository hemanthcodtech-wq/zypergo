import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ onNavigate }) {
  const { user } = useAuth();
  const [quickTrackId, setQuickTrackId] = useState('');

  const handleTrackSubmit = () => {
    if (quickTrackId.trim()) {
      onNavigate('track', { trackingNumber: quickTrackId.trim() });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>Welcome back 👋</Text>
          <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
        </View>
        <TouchableOpacity style={styles.bellButton} onPress={() => onNavigate('profile')}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Quick Tracking Search Bar */}
      <View style={styles.searchCard}>
        <Text style={styles.searchTitle}>Track Your Shipment</Text>
        <Text style={styles.searchSubtitle}>Enter 10-digit AWB or tracking number</Text>
        <View style={styles.searchInputRow}>
          <Ionicons name="barcode-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="e.g. ZP-984210"
            placeholderTextColor={colors.textMuted}
            value={quickTrackId}
            onChangeText={setQuickTrackId}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.trackButton} onPress={handleTrackSubmit}>
            <Text style={styles.trackButtonText}>Track</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Primary Action Banner */}
      <View style={styles.heroBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTag}>EXPRESS SERVICE</Text>
          <Text style={styles.bannerTitle}>Ship Anywhere in City within 2 Hours</Text>
          <TouchableOpacity
            style={styles.bannerButton}
            onPress={() => onNavigate('book')}
          >
            <Text style={styles.bannerButtonText}>Book Parcel Now</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.heroIconCircle}>
          <Ionicons name="rocket-outline" size={38} color={colors.white} />
        </View>
      </View>

      {/* Quick Services Grid */}
      <Text style={styles.sectionTitle}>Our Services</Text>
      <View style={styles.servicesGrid}>
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => onNavigate('book', { serviceType: 'hyperlocal' })}
        >
          <View style={[styles.serviceIcon, { backgroundColor: '#E8F0FE' }]}>
            <Ionicons name="bicycle" size={24} color={colors.primary} />
          </View>
          <Text style={styles.serviceName}>Hyperlocal</Text>
          <Text style={styles.serviceDesc}>Instant 60m delivery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => onNavigate('book', { serviceType: 'standard' })}
        >
          <View style={[styles.serviceIcon, { backgroundColor: '#E3FCEF' }]}>
            <Ionicons name="car-outline" size={24} color={colors.success} />
          </View>
          <Text style={styles.serviceName}>Intercity</Text>
          <Text style={styles.serviceDesc}>Pan-India parcel cargo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => onNavigate('shipments')}
        >
          <View style={[styles.serviceIcon, { backgroundColor: '#FFF0B3' }]}>
            <Ionicons name="file-tray-full-outline" size={24} color={colors.warning} />
          </View>
          <Text style={styles.serviceName}>My Orders</Text>
          <Text style={styles.serviceDesc}>History & Invoices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => onNavigate('track')}
        >
          <View style={[styles.serviceIcon, { backgroundColor: '#FFEBE6' }]}>
            <Ionicons name="navigate-outline" size={24} color={colors.danger} />
          </View>
          <Text style={styles.serviceName}>Live Tracker</Text>
          <Text style={styles.serviceDesc}>Active GPS location</Text>
        </TouchableOpacity>
      </View>

      {/* Active Shipment Preview */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Shipment</Text>
        <TouchableOpacity onPress={() => onNavigate('shipments')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activeOrderCard}>
        <View style={styles.orderTopRow}>
          <View style={styles.orderIdBadge}>
            <Text style={styles.orderIdText}>ZP-849204</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>OUT FOR DELIVERY</Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routePoint}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={styles.routeCity}>Indiranagar, BLR</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
          <View style={styles.routePoint}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.routeCity}>Koramangala, BLR</Text>
          </View>
        </View>

        <View style={styles.etaRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.etaText}>Est. Delivery: Today by 6:30 PM</Text>
          </View>
          <TouchableOpacity
            style={styles.orderTrackBtn}
            onPress={() => onNavigate('track', { trackingNumber: 'ZP-849204' })}
          >
            <Text style={styles.orderTrackBtnText}>Track</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  greetingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.black
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger
  },
  searchCard: {
    backgroundColor: colors.white,
    padding: 18,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black
  },
  searchSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text
  },
  trackButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10
  },
  trackButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13
  },
  heroBanner: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6
  },
  bannerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 1,
    marginBottom: 4
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 22,
    marginBottom: 14
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6
  },
  bannerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary
  },
  heroIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 12
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  serviceCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black
  },
  serviceDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  activeOrderCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  orderIdBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text
  },
  statusBadge: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 12
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  routeCity: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  etaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  orderTrackBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10
  },
  orderTrackBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700'
  }
});
