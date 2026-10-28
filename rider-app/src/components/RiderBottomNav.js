import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme';

export default function RiderBottomNav({ activeTab, onSelectTab }) {
  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'jobs', label: 'Pickups', icon: '📦' },
    { key: 'active', label: 'Active Trip', icon: '🧭' },
    { key: 'earnings', label: 'Earnings', icon: '💰' },
    { key: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onSelectTab(tab.key)}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
    paddingBottom: 20,
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
