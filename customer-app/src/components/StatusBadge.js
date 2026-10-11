import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default function StatusBadge({ status }) {
  const getStyle = () => {
    switch ((status || '').toLowerCase()) {
      case 'delivered':
      case 'completed':
        return { bg: COLORS.successLight, text: COLORS.success, label: 'Delivered' };
      case 'in_transit':
      case 'out_for_delivery':
      case 'picked_up':
        return { bg: COLORS.primaryLight, text: COLORS.primary, label: 'In Transit' };
      case 'assigned':
      case 'driver_assigned':
        return { bg: '#E0F2FE', text: '#0284C7', label: 'Rider Assigned' };
      case 'pending':
      case 'booked':
        return { bg: COLORS.warningLight, text: COLORS.warning, label: 'Booked' };
      case 'cancelled':
        return { bg: COLORS.dangerLight, text: COLORS.danger, label: 'Cancelled' };
      default:
        return { bg: '#F1F5F9', text: COLORS.textMuted, label: status || 'Pending' };
    }
  };

  const style = getStyle();

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
