import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme';

export default function Header({ title, subtitle, rightAction, onRightPress }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction ? (
        <TouchableOpacity style={styles.rightBtn} onPress={onRightPress}>
          <Text style={styles.rightBtnText}>{rightAction}</Text>
        </TouchableOpacity>
      ) : null}
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
  rightBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  rightBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
