import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { COLORS, SHADOWS } from '../theme';
import RiderHeader from '../components/RiderHeader';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl, setApiBaseUrl } from '../config/api';

export default function RiderProfileScreen() {
  const { user, logout } = useAuth();
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());

  const handleSaveUrl = () => {
    setApiBaseUrl(serverUrl.trim());
    Alert.alert('Updated', 'API Server URL has been updated.');
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your rider shift?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <RiderHeader title="Rider Profile" subtitle="Account and vehicle information" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Rider Profile Card */}
        <View style={[styles.profileCard, SHADOWS.card]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'Rider')[0].toUpperCase()}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.riderName}>{user?.name || 'Rider Captain'}</Text>
            <Text style={styles.riderPhone}>{user?.phone || '+91 98765 43210'}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified Fleet Partner</Text>
            </View>
          </View>
        </View>

        {/* Vehicle & Operational Info */}
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Vehicle & Registration</Text>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Vehicle Plate</Text>
            <Text style={styles.dataVal}>{user?.vehicleNumber || 'TS 09 AB 1234'}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Vehicle Type</Text>
            <Text style={styles.dataVal}>{user?.vehicleType || 'Motorcycle'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Base Hub / City</Text>
            <Text style={styles.dataVal}>Hyderabad Central Hub</Text>
          </View>
        </View>

        {/* Server Config */}
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Network Configuration</Text>
          <Text style={styles.dataLabel}>Backend API URL</Text>
          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            placeholder="http://10.0.2.2:5000/api"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUrl}>
            <Text style={styles.saveBtnText}>Save Server URL</Text>
          </TouchableOpacity>
        </View>

        {/* Support Hotline */}
        <View style={[styles.card, SHADOWS.card]}>
          <TouchableOpacity 
            style={styles.hotlineBtn}
            onPress={() => Alert.alert('Rider Helpline', 'Call Operations Dispatch: 1800-ZYP-RIDE')}
          >
            <Text style={styles.hotlineText}>🚨 24/7 Rider Emergency Helpline</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>End Shift & Sign Out</Text>
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
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
  },
  infoCol: {
    flex: 1,
  },
  riderName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  riderPhone: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  dataVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: COLORS.text,
    marginTop: 6,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  hotlineBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hotlineText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.danger,
  },
  arrow: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  logoutBtn: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '800',
  },
});
