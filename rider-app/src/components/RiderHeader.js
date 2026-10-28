import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function RiderHeader({ title, subtitle }) {
  const { isOnDuty } = useAuth();

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.statusChip, isOnDuty ? styles.chipOnline : styles.chipOffline]}>
        <View style={[styles.dot, isOnDuty ? styles.dotOnline : styles.dotOffline]} />
        <Text style={[styles.statusText, isOnDuty ? styles.textOnline : styles.textOffline]}>
          {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  chipOnline: {
    backgroundColor: '#ECFDF5',
  },
  chipOffline: {
    backgroundColor: '#F1F5F9',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: '#10B981',
  },
  dotOffline: {
    backgroundColor: '#94A3B8',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textOnline: {
    color: '#065F46',
  },
  textOffline: {
    color: '#475569',
  },
});
