import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { TabType } from '../types/audio';

interface FilterTabsProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

const TABS: Array<{ key: TabType; label: string }> = [
  { key: 'all', label: 'الكل' },
  { key: 'playlists', label: 'قوائم التشغيل' },
  { key: 'liked', label: 'المفضلة' },
];

/**
 * Horizontal pill filter tabs for switching between All, Playlists, and Liked tracks.
 */
export function FilterTabs({ activeTab, onSelectTab }: FilterTabsProps) {
  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.8}
            onPress={() => onSelectTab(tab.key)}
            style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.label,
                isActive ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  pill: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: COLORS.accent,
  },
  pillInactive: {
    backgroundColor: COLORS.surface,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: COLORS.iconOnAccent,
  },
  labelInactive: {
    color: COLORS.textSecondary,
  },
});
