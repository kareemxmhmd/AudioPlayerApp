import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useMusic } from '../context/MusicContext';
import { COLORS, RADIUS, SPACING } from '../theme/colors';

interface FloatingControlPillProps {
  onOpenNowPlaying: () => void;
}

/**
 * Floating centered bottom pill visible while a track is loaded.
 * Shows Play/Pause, a vertical divider, and Shuffle toggle; tapping opens NowPlaying.
 */
export function FloatingControlPill({
  onOpenNowPlaying,
}: FloatingControlPillProps) {
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlaying, shuffle, togglePlayPause, toggleShuffle } =
    useMusic();

  if (!currentTrack) {
    return null;
  }

  const bottomOffset = Math.max(insets.bottom, SPACING.md) + SPACING.sm;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: bottomOffset }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onOpenNowPlaying}
        style={styles.pill}
        accessibilityLabel="فتح شاشة قيد التشغيل"
      >
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            togglePlayPause();
          }}
          hitSlop={10}
          style={styles.controlButton}
          accessibilityLabel={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={22}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            toggleShuffle();
          }}
          hitSlop={10}
          style={styles.controlButton}
          accessibilityLabel="تبديل التشغيل العشوائي"
        >
          <Ionicons
            name="shuffle"
            size={22}
            color={shuffle ? COLORS.accent : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceTranslucent,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  controlButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.xs,
  },
});
