import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useMusic } from '../context/MusicContext';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { Playlist } from '../types/audio';

interface PlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  trackId?: string | null;
}

/**
 * Dark modal to create a new playlist and add/remove a target trackId across playlists.
 */
export function PlaylistModal({
  visible,
  onClose,
  trackId,
}: PlaylistModalProps) {
  const {
    playlists,
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = useMusic();
  const [playlistName, setPlaylistName] = useState('');

  const handleCreate = async () => {
    const trimmed = playlistName.trim();
    if (!trimmed) {
      return;
    }
    const created = await Promise.resolve(createPlaylist(trimmed));
    setPlaylistName('');
    if (
      trackId &&
      created &&
      typeof created === 'object' &&
      'id' in created &&
      typeof (created as Playlist).id === 'string'
    ) {
      await Promise.resolve(
        addTrackToPlaylist((created as Playlist).id, trackId),
      );
    }
  };

  const handleToggleTrack = (playlist: Playlist) => {
    if (!trackId) {
      return;
    }
    const exists = playlist.trackIds.includes(trackId);
    if (exists) {
      removeTrackFromPlaylist(playlist.id, trackId);
    } else {
      addTrackToPlaylist(playlist.id, trackId);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {trackId ? 'إضافة إلى قائمة تشغيل' : 'قوائم التشغيل'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={10}
              style={styles.closeButton}
              accessibilityLabel="إغلاق"
            >
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.createRow}>
            <TextInput
              value={playlistName}
              onChangeText={setPlaylistName}
              placeholder="اسم قائمة التشغيل الجديدة..."
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreate}
              disabled={!playlistName.trim()}
              style={[
                styles.createButton,
                !playlistName.trim() && styles.createButtonDisabled,
              ]}
            >
              <Text style={styles.createButtonText}>إنشاء</Text>
            </TouchableOpacity>
          </View>

          {trackId ? (
            <FlatList
              data={playlists}
              keyExtractor={item => item.id}
              style={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  لا توجد قوائم تشغيل بعد. أنشئ قائمة جديدة بالأعلى.
                </Text>
              }
              renderItem={({ item }) => {
                const isIncluded = item.trackIds.includes(trackId);
                return (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleToggleTrack(item)}
                    style={styles.playlistRow}
                  >
                    <View style={styles.playlistInfo}>
                      <Ionicons
                        name="musical-notes-outline"
                        size={18}
                        color={isIncluded ? COLORS.accent : COLORS.textSecondary}
                      />
                      <View style={styles.playlistTextWrap}>
                        <Text numberOfLines={1} style={styles.playlistName}>
                          {item.name}
                        </Text>
                        <Text style={styles.playlistCount}>
                          {`${item.trackIds.length} أغنية`}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={
                        isIncluded ? 'checkmark-circle' : 'add-circle-outline'
                      }
                      size={24}
                      color={isIncluded ? COLORS.accent : COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  dismissArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 14,
    textAlign: 'right',
  },
  createButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.45,
  },
  createButtonText: {
    color: COLORS.iconOnAccent,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    maxHeight: 280,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  playlistInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  playlistTextWrap: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  playlistName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  playlistCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'right',
  },
});
