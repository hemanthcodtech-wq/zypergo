import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export default function BottomNav({ currentScreen, onNavigate }) {
  const insets = useSafeAreaInsets();
  const tabs = [
    { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { key: 'book', label: 'Book', icon: 'add-circle-outline', activeIcon: 'add-circle' },
    { key: 'track', label: 'Track', icon: 'navigate-outline', activeIcon: 'navigate' },
    { key: 'shipments', label: 'Orders', icon: 'cube-outline', activeIcon: 'cube' },
    { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' }
  ];

  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.navContainer, { paddingBottom: bottomInset, height: 60 + bottomInset }]}>
      {tabs.map((tab) => {
        const isActive = currentScreen === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onNavigate(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconWrapperActive: {
    backgroundColor: colors.primaryLight
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '800'
  }
});
