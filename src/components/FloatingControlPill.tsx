import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useMusic } from '../context/MusicContext';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { ArtworkView } from './ArtworkView';
import { formatDuration } from './formatTime';

interface FloatingControlPillProps {
  onOpenNowPlaying: () => void;
}

/**
 * Large floating Mini-Player bar showing current track artwork, title,
 * live elapsed/total duration, progress bar, playback mode toggle, and Play/Pause.
 */
export function FloatingControlPill({
  onOpenNowPlaying,
}: FloatingControlPillProps) {
  const insets = useSafeAreaInsets();
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    playbackMode,
    togglePlayPause,
    cyclePlaybackMode,
  } = useMusic();

  if (!currentTrack) {
    return null;
  }

  const effectiveDuration =
    duration > 0 ? duration : Math.max(currentTrack.duration || 0, 0);
  const clampedPosition =
    effectiveDuration > 0
      ? Math.min(Math.max(position, 0), effectiveDuration)
      : 0;
  const progressRatio =
    effectiveDuration > 0
      ? Math.min(Math.max(clampedPosition / effectiveDuration, 0), 1)
      : 0;

  const bottomOffset = Math.max(insets.bottom, SPACING.md) + SPACING.xs;
  const artistName =
    currentTrack.artist && currentTrack.artist !== '<unknown>'
      ? currentTrack.artist
      : currentTrack.folder || 'فنان غير معروف';

  const modeLabel =
    playbackMode === 'shuffle'
      ? 'وضع التشغيل: عشوائي'
      : playbackMode === 'repeat-one'
        ? 'وضع التشغيل: تكرار المقطع'
        : 'وضع التشغيل: بالترتيب';

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: bottomOffset }]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onOpenNowPlaying}
        style={styles.card}
        accessibilityLabel="فتح شاشة قيد التشغيل"
      >
        <View style={styles.row}>
          <ArtworkView
            uri={currentTrack.artwork}
            size={48}
            borderRadius={RADIUS.md}
            iconSize={22}
          />

          <View style={styles.info}>
            <Text numberOfLines={1} style={styles.title}>
              {currentTrack.title}
            </Text>
            <Text numberOfLines={1} style={styles.meta}>
              {`${formatDuration(clampedPosition)} / ${formatDuration(effectiveDuration)} • ${artistName}`}
            </Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                cyclePlaybackMode();
              }}
              hitSlop={8}
              style={styles.modeButton}
              accessibilityLabel={modeLabel}
            >
              <View style={styles.modeIconWrap}>
                <Ionicons
                  name={playbackMode === 'shuffle' ? 'shuffle' : 'repeat'}
                  size={20}
                  color={
                    playbackMode === 'sequential'
                      ? COLORS.textSecondary
                      : COLORS.accent
                  }
                />
                {playbackMode === 'repeat-one' ? (
                  <View style={styles.repeatOneBadge}>
                    <Text style={styles.repeatOneBadgeText}>1</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                togglePlayPause();
              }}
              hitSlop={8}
              style={styles.playButton}
              accessibilityLabel={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color={COLORS.iconOnAccent}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progressRatio * 100)}%` },
            ]}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
  },
  card: {
    backgroundColor: 'rgba(24, 26, 34, 0.96)',
    borderRadius: RADIUS.lg + 4,
    paddingTop: SPACING.sm + 2,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginBottom: 3,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  modeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneBadge: {
    position: 'absolute',
    top: -4,
    right: -5,
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    minWidth: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  repeatOneBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.iconOnAccent,
    lineHeight: 10,
  },
  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
});
