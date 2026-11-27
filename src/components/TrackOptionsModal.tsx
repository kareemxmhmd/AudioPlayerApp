import React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { Track } from '../types/audio';
import { ArtworkView } from './ArtworkView';
import { formatDuration } from './formatTime';

interface TrackOptionsModalProps {
  visible: boolean;
  track: Track | null;
  playlistName?: string | null;
  onClose: () => void;
  onAddToPlaylist: (track: Track) => void;
  onRemoveFromPlaylist?: (track: Track) => void;
  onDeleteTrack: (track: Track) => Promise<boolean>;
}

/**
 * Bottom action sheet for per-track actions: add/remove playlist, share, and delete.
 */
export function TrackOptionsModal({
  visible,
  track,
  playlistName,
  onClose,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onDeleteTrack,
}: TrackOptionsModalProps) {
  if (!track) {
    return null;
  }

  const handleShare = async () => {
    onClose();
    try {
      const artist =
        track.artist && track.artist !== '<unknown>' ? track.artist : '';
      const message = artist ? `${track.title} - ${artist}` : track.title;
      await Share.share({
        title: track.title,
        message,
        url: track.url,
      });
    } catch {
      // Ignore user cancel or share sheet errors
    }
  };

  const handleDeletePress = () => {
    onClose();
    Alert.alert(
      'حذف المقطع الصوتي',
      `هل أنت متأكد من حذف "${track.title}" من الجهاز؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            onDeleteTrack(track).then(deleted => {
              if (!deleted) {
                Alert.alert(
                  'تعذر الحذف',
                  'لم يتم حذف الملف الصوتي من الجهاز.',
                );
              }
            });
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.trackHeader}>
            <ArtworkView
              uri={track.artwork}
              size={48}
              borderRadius={RADIUS.md}
              iconSize={20}
            />
            <View style={styles.trackMeta}>
              <Text numberOfLines={1} style={styles.trackTitle}>
                {track.title}
              </Text>
              <Text numberOfLines={1} style={styles.trackSubtitle}>
                {`${track.artist || 'فنان غير معروف'} • ${formatDuration(track.duration)}`}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              onClose();
              onAddToPlaylist(track);
            }}
            style={styles.actionRow}
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={COLORS.textPrimary}
            />
            <Text style={styles.actionText}>إضافة إلى قائمة تشغيل</Text>
          </TouchableOpacity>

          {playlistName && onRemoveFromPlaylist ? (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                onClose();
                onRemoveFromPlaylist(track);
              }}
              style={styles.actionRow}
            >
              <Ionicons
                name="remove-circle-outline"
                size={22}
                color={COLORS.textPrimary}
              />
              <Text style={styles.actionText}>
                {`إزالة من "${playlistName}"`}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleShare}
            style={styles.actionRow}
          >
            <Ionicons
              name="share-social-outline"
              size={22}
              color={COLORS.textPrimary}
            />
            <Text style={styles.actionText}>مشاركة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleDeletePress}
            style={styles.actionRow}
          >
            <Ionicons name="trash-outline" size={22} color="#FF5A5F" />
            <Text style={[styles.actionText, styles.deleteText]}>
              حذف من الجهاز
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg + 6,
    borderTopRightRadius: RADIUS.lg + 6,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.divider,
    marginBottom: SPACING.lg,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  trackMeta: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginBottom: 2,
  },
  trackSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: SPACING.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  deleteText: {
    color: '#FF5A5F',
  },
});
