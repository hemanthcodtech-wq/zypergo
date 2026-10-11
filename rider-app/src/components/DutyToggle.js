import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function DutyToggle() {
  const { isOnDuty, toggleDuty } = useAuth();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isOnDuty ? styles.onlineContainer : styles.offlineContainer,
      ]}
      onPress={toggleDuty}
    >
      <View style={[styles.indicator, isOnDuty ? styles.onlineIndicator : styles.offlineIndicator]} />
      <Text style={[styles.label, isOnDuty ? styles.onlineLabel : styles.offlineLabel]}>
        {isOnDuty ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}
      </Text>
      <Text style={styles.actionPrompt}>
        {isOnDuty ? 'Tap to Go Offline' : 'Tap to Go Online'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  onlineContainer: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  offlineContainer: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  indicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  onlineIndicator: {
    backgroundColor: '#10B981',
  },
  offlineIndicator: {
    backgroundColor: '#94A3B8',
  },
  label: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    flex: 1,
  },
  onlineLabel: {
    color: '#065F46',
  },
  offlineLabel: {
    color: '#475569',
  },
  actionPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
});
