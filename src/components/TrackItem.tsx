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
  onPress: (track: Track) => void;
  onMorePress?: (track: Track) => void;
}

/**
 * Single audio track row with artwork, title, artist/folder + duration subtitle,
 * and a 3-dots options button (tapping the row plays the track).
 */
export function TrackItem({
  track,
  isActive,
  onPress,
  onMorePress,
}: TrackItemProps) {
  const secondaryLabel =
    track.artist && track.artist !== '<unknown>'
      ? track.artist
      : track.folder || 'فنان غير معروف';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress(track)}
      onLongPress={() => onMorePress?.(track)}
      style={[styles.row, isActive ? styles.rowActive : null]}
    >
      <ArtworkView
        uri={track.artwork}
        size={52}
        borderRadius={RADIUS.md}
        iconSize={22}
      />

      <View style={styles.textContainer}>
        <Text
          numberOfLines={1}
          style={[styles.title, isActive ? styles.titleActive : null]}
        >
          {track.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {`${secondaryLabel} • ${formatDuration(track.duration)}`}
        </Text>
      </View>

      {onMorePress ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onMorePress(track)}
          hitSlop={10}
          style={styles.moreButton}
          accessibilityLabel="خيارات الأغنية"
        >
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      ) : null}
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
  rowActive: {
    backgroundColor: 'rgba(212, 238, 66, 0.06)',
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
  titleActive: {
    color: COLORS.accent,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  moreButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
