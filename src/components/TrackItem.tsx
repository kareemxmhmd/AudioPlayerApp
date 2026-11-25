import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { Track } from '../types/audio';
import { ArtworkView } from './ArtworkView';
import { formatDuration } from './formatTime';

interface TrackItemProps {
  track: Track;
  isActive: boolean;
  isPlaying: boolean;
  onPress: (track: Track) => void;
  onTogglePlay: (track: Track) => void;
  onMorePress?: (track: Track) => void;
}

/**
 * Single audio track row with artwork, title, artist/folder + duration subtitle,
 * playlist action button, and circular Play/Pause control.
 */
export function TrackItem({
  track,
  isActive,
  isPlaying,
  onPress,
  onTogglePlay,
  onMorePress,
}: TrackItemProps) {
  const showPause = isActive && isPlaying;
  const secondaryLabel =
    track.artist && track.artist !== '<unknown>'
      ? track.artist
      : track.folder || 'فنان غير معروف';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress(track)}
      onLongPress={() => onMorePress?.(track)}
      style={styles.row}
    >
      <ArtworkView
        uri={track.artwork}
        size={52}
        borderRadius={RADIUS.md}
        iconSize={22}
      />

      <View style={styles.textContainer}>
        <Text numberOfLines={1} style={styles.title}>
          {track.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {`${secondaryLabel} • ${formatDuration(track.duration)}`}
        </Text>
      </View>

      <View style={styles.actions}>
        {onMorePress ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onMorePress(track)}
            hitSlop={8}
            style={styles.moreButton}
            accessibilityLabel="خيارات الأغنية"
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onTogglePlay(track)}
          hitSlop={8}
          style={[
            styles.playButton,
            showPause ? styles.playButtonActive : styles.playButtonInactive,
          ]}
          accessibilityLabel={showPause ? 'إيقاف مؤقت' : 'تشغيل'}
        >
          <Ionicons
            name={showPause ? 'pause' : 'play'}
            size={16}
            color={showPause ? COLORS.iconOnAccent : COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
  },
  textContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  moreButton: {
    width: 30,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonActive: {
    backgroundColor: COLORS.accent,
  },
  playButtonInactive: {
    backgroundColor: COLORS.surface,
  },
});
