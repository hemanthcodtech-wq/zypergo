import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ onNavigate }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenHeading}>Account & Settings</Text>

      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'customer@zypergo.com'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>VERIFIED CUSTOMER</Text>
          </View>
        </View>
      </View>

      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <View>
          <Text style={styles.walletLabel}>ZyperGo Wallet Balance</Text>
          <Text style={styles.walletAmount}>₹ 450.00</Text>
        </View>
        <TouchableOpacity style={styles.addMoneyBtn}>
          <Ionicons name="add" size={16} color={colors.white} />
          <Text style={styles.addMoneyText}>Top Up</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Options */}
      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#E8F0FE' }]}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.menuTitle}>Saved Addresses</Text>
            <Text style={styles.menuSub}>Home, Work, Warehouse</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#E3FCEF' }]}>
            <Ionicons name="card-outline" size={20} color={colors.success} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.menuTitle}>Payment Methods</Text>
            <Text style={styles.menuSub}>UPI, Cards, Netbanking</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#FFF0B3' }]}>
            <Ionicons name="help-buoy-outline" size={20} color={colors.warning} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.menuTitle}>Support & Help Center</Text>
            <Text style={styles.menuSub}>24x7 Live chat & FAQs</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#F1F5F9' }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.menuTitle}>Terms & Privacy Policy</Text>
            <Text style={styles.menuSub}>ZyperGo Platform v1.0.0</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800'
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.black
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  roleBadge: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary
  },
  walletCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  walletLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600'
  },
  walletAmount: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4
  },
  addMoneyBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4
  },
  addMoneyText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black
  },
  menuSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: 8
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700'
  }
});
