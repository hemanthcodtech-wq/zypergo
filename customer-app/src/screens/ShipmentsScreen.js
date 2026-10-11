import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function ShipmentsScreen({ onNavigate }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const dummyShipments = [
    {
      id: 'ZP-849204',
      sender: 'Indiranagar, Bangalore',
      recipient: 'Koramangala, Bangalore',
      status: 'OUT FOR DELIVERY',
      statusType: 'primary',
      date: 'Today, 10:15 AM',
      price: '₹145',
      items: 'Electronics & Document'
    },
    {
      id: 'ZP-729105',
      sender: 'HSR Layout, Bangalore',
      recipient: 'Electronic City, Bangalore',
      status: 'DELIVERED',
      statusType: 'success',
      date: 'Yesterday, 04:30 PM',
      price: '₹210',
      items: 'Gift Box (1.8kg)'
    },
    {
      id: 'ZP-601934',
      sender: 'MG Road, Bangalore',
      recipient: 'Whitefield, Bangalore',
      status: 'DELIVERED',
      statusType: 'success',
      date: '05 Oct 2026',
      price: '₹280',
      items: 'Clothing & Apparel'
    },
    {
      id: 'ZP-518290',
      sender: 'Jayanagar, Bangalore',
      recipient: 'Malleshwaram, Bangalore',
      status: 'CANCELLED',
      statusType: 'danger',
      date: '28 Sep 2026',
      price: '₹95',
      items: 'Legal Documents'
    }
  ];

  const filteredShipments = dummyShipments.filter((item) => {
    if (filter === 'ACTIVE' && item.status !== 'OUT FOR DELIVERY' && item.status !== 'IN TRANSIT') return false;
    if (filter === 'COMPLETED' && item.status !== 'DELIVERED') return false;
    if (search && !item.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenHeading}>My Shipments</Text>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {['ALL', 'ACTIVE', 'COMPLETED'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.tab, filter === f && styles.tabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by Order ID..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Shipments List */}
      {filteredShipments.map((item) => {
        const isDelivered = item.status === 'DELIVERED';
        const isCancelled = item.status === 'CANCELLED';

        let badgeBg = '#E8F0FE';
        let badgeColor = colors.primary;
        if (isDelivered) {
          badgeBg = '#E3FCEF';
          badgeColor = colors.success;
        } else if (isCancelled) {
          badgeBg = '#FFEBE6';
          badgeColor = colors.danger;
        }

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => onNavigate('track', { trackingNumber: item.id })}
          >
            <View style={styles.cardHeader}>
              <View style={styles.idBox}>
                <Ionicons name="cube-outline" size={18} color={colors.primary} />
                <Text style={styles.idText}>{item.id}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.badgeText, { color: badgeColor }]}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.addressSection}>
              <View style={styles.addressRow}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                <Text style={styles.addressText} numberOfLines={1}>From: {item.sender}</Text>
              </View>
              <View style={styles.addressRow}>
                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                <Text style={styles.addressText} numberOfLines={1}>To: {item.recipient}</Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <View>
                <Text style={styles.dateText}>{item.date}</Text>
                <Text style={styles.itemSub}>{item.items}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.priceText}>{item.price}</Text>
                <Text style={styles.viewDetail}>Track & Details ›</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '800'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
    color: colors.text
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  idBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  idText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.black
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  addressSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 6
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  addressText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    flex: 1
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  itemSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.black
  },
  viewDetail: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2
  }
});
