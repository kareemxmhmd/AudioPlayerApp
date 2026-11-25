import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  I18nManager,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FilterTabs } from '../components/FilterTabs';
import { FloatingControlPill } from '../components/FloatingControlPill';
import { RootStackParamList } from '../components/navigationTypes';
import { PlaylistModal } from '../components/PlaylistModal';
import { TrackItem } from '../components/TrackItem';
import { useMusic } from '../context/MusicContext';
import { COLORS, RADIUS, SPACING } from '../theme/colors';
import { Playlist, SortType, Track } from '../types/audio';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MyMusic'>;

const SORT_OPTIONS: Array<{ key: SortType; label: string }> = [
  { key: 'title', label: 'ترتيب حسب الاسم' },
  { key: 'date', label: 'ترتيب حسب الأحدث' },
  { key: 'duration', label: 'ترتيب حسب المدة' },
];

/**
 * Primary library screen ('موسيقاي') with search toggle, options menu, filter pills,
 * playlist management, track list, and floating playback pill.
 */
export function MyMusicScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {
    filteredTracks,
    playlists,
    currentTrack,
    isPlaying,
    activeTab,
    setActiveTab,
    selectedPlaylistId,
    setSelectedPlaylistId,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    isLoading,
    hasPermission,
    rescanMedia,
    playTrack,
    togglePlayPause,
    removeTrackFromPlaylist,
    deletePlaylist,
  } = useMusic();

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [targetTrackId, setTargetTrackId] = useState<string | null>(null);

  const selectedPlaylist = useMemo(
    () => playlists.find(p => p.id === selectedPlaylistId) ?? null,
    [playlists, selectedPlaylistId],
  );

  const handleToggleSearch = () => {
    if (isSearchVisible) {
      setSearchQuery('');
      setIsSearchVisible(false);
    } else {
      setIsSearchVisible(true);
    }
  };

  const handleTrackPress = async (track: Track) => {
    if (currentTrack?.id !== track.id) {
      await Promise.resolve(playTrack(track, filteredTracks));
    } else if (!isPlaying) {
      await Promise.resolve(togglePlayPause());
    }
    navigation.navigate('NowPlaying');
  };

  const handleTrackTogglePlay = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track, filteredTracks);
    }
  };

  const handleOpenPlaylistForTrack = (track: Track) => {
    setTargetTrackId(track.id);
    setPlaylistModalVisible(true);
  };

  const handleOpenCreatePlaylist = () => {
    setTargetTrackId(null);
    setPlaylistModalVisible(true);
  };

  const renderTrackItem = ({ item }: { item: Track }) => {
    const isActive = currentTrack?.id === item.id;
    return (
      <TrackItem
        track={item}
        isActive={isActive}
        isPlaying={isActive && isPlaying}
        onPress={handleTrackPress}
        onTogglePlay={handleTrackTogglePlay}
        onMorePress={track => {
          if (selectedPlaylist) {
            removeTrackFromPlaylist(selectedPlaylist.id, track.id);
          } else {
            handleOpenPlaylistForTrack(track);
          }
        }}
      />
    );
  };

  const renderPlaylistCard = ({ item }: { item: Playlist }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setSelectedPlaylistId(item.id)}
      style={styles.playlistCard}
    >
      <View style={styles.playlistIconBox}>
        <Ionicons name="musical-notes" size={22} color={COLORS.accent} />
      </View>
      <View style={styles.playlistCardText}>
        <Text numberOfLines={1} style={styles.playlistCardTitle}>
          {item.name}
        </Text>
        <Text style={styles.playlistCardCount}>
          {`${item.trackIds.length} أغنية`}
        </Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => deletePlaylist(item.id)}
        hitSlop={10}
        style={styles.playlistDeleteBtn}
        accessibilityLabel="حذف قائمة التشغيل"
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (!hasPermission) {
      return (
        <View style={styles.centerState}>
          <Ionicons
            name="folder-open-outline"
            size={54}
            color={COLORS.textSecondary}
          />
          <Text style={styles.stateTitle}>الوصول إلى الملفات الصوتية</Text>
          <Text style={styles.stateDescription}>
            يرجى السماح بالوصول إلى الصوتيات المخزنة على جهازك لعرضها وتشغيلها.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              rescanMedia();
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>منح الإذن وإعادة الفحص</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.stateDescription}>جاري فحص الملفات الصوتية...</Text>
        </View>
      );
    }

    if (activeTab === 'playlists' && !selectedPlaylist) {
      return (
        <FlatList
          data={playlists}
          keyExtractor={item => item.id}
          renderItem={renderPlaylistCard}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenCreatePlaylist}
              style={styles.createPlaylistBanner}
            >
              <View style={styles.createPlaylistIcon}>
                <Ionicons name="add" size={22} color={COLORS.iconOnAccent} />
              </View>
              <Text style={styles.createPlaylistText}>إنشاء قائمة تشغيل</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons
                name="albums-outline"
                size={46}
                color={COLORS.textSecondary}
              />
              <Text style={styles.stateTitle}>لا توجد قوائم تشغيل</Text>
              <Text style={styles.stateDescription}>
                أنشئ قائمة تشغيل جديدة لتنظيم مقاطعك المفضلة.
              </Text>
            </View>
          }
        />
      );
    }

    const emptyTitle = searchQuery.trim()
      ? 'لا توجد نتائج مطابقة'
      : activeTab === 'liked'
      ? 'لا توجد مقاطع مفضلة بعد'
      : selectedPlaylist
      ? 'قائمة التشغيل فارغة'
      : 'لا توجد ملفات صوتية';

    return (
      <View style={styles.flexOne}>
        {activeTab === 'playlists' && selectedPlaylist ? (
          <View style={styles.playlistHeaderBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedPlaylistId(null)}
              style={styles.backToPlaylistsBtn}
            >
              <Ionicons
                name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
                size={20}
                color={COLORS.textPrimary}
              />
              <Text style={styles.backToPlaylistsText}>قوائم التشغيل</Text>
            </TouchableOpacity>
            <Text numberOfLines={1} style={styles.selectedPlaylistName}>
              {selectedPlaylist.name}
            </Text>
          </View>
        ) : null}

        <FlatList
          data={filteredTracks}
          keyExtractor={item => item.id}
          renderItem={renderTrackItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons
                name="musical-notes-outline"
                size={48}
                color={COLORS.textSecondary}
              />
              <Text style={styles.stateTitle}>{emptyTitle}</Text>
              {activeTab === 'all' && !searchQuery.trim() ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    rescanMedia();
                  }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>إعادة فحص الجهاز</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      </View>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleToggleSearch}
          style={styles.circleButton}
          accessibilityLabel="بحث"
        >
          <Ionicons
            name={isSearchVisible ? 'close' : 'search'}
            size={20}
            color={isSearchVisible ? COLORS.accent : COLORS.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>موسيقاي</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsMenuVisible(true)}
          style={styles.circleButton}
          accessibilityLabel="المزيد من الخيارات"
        >
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {isSearchVisible ? (
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ابحث عن أغنية أو فنان أو مجلد..."
            placeholderTextColor={COLORS.textSecondary}
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              accessibilityLabel="مسح البحث"
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <FilterTabs
        activeTab={activeTab}
        onSelectTab={tab => {
          setActiveTab(tab);
          if (tab !== 'playlists') {
            setSelectedPlaylistId(null);
          }
        }}
      />

      <View style={styles.flexOne}>{renderContent()}</View>

      <FloatingControlPill
        onOpenNowPlaying={() => navigation.navigate('NowPlaying')}
      />

      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setIsMenuVisible(false)}
        >
          <View
            style={[
              styles.menuCard,
              I18nManager.isRTL ? styles.menuCardRtl : styles.menuCardLtr,
              { top: insets.top + 56 },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                setIsMenuVisible(false);
                rescanMedia();
              }}
              style={styles.menuItem}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color={COLORS.textPrimary}
              />
              <Text style={styles.menuItemText}>إعادة فحص الجهاز</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                setIsMenuVisible(false);
                handleOpenCreatePlaylist();
              }}
              style={styles.menuItem}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={COLORS.textPrimary}
              />
              <Text style={styles.menuItemText}>إنشاء قائمة تشغيل جديدة</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {SORT_OPTIONS.map(option => {
              const selected = sortBy === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.75}
                  onPress={() => {
                    setSortBy(option.key);
                    setIsMenuVisible(false);
                  }}
                  style={styles.menuItem}
                >
                  <Ionicons
                    name={selected ? 'checkmark' : 'swap-vertical-outline'}
                    size={18}
                    color={selected ? COLORS.accent : COLORS.textSecondary}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      selected && styles.menuItemTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <PlaylistModal
        visible={playlistModalVisible}
        onClose={() => setPlaylistModalVisible(false)}
        trackId={targetTrackId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flexOne: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    paddingVertical: SPACING.sm + 2,
    textAlign: 'right',
  },
  listContent: {
    paddingTop: SPACING.xs,
    paddingBottom: 112,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingTop: 64,
    gap: SPACING.md,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  stateDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  primaryButtonText: {
    color: COLORS.iconOnAccent,
    fontSize: 14,
    fontWeight: '700',
  },
  createPlaylistBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.md,
  },
  createPlaylistIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPlaylistText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xs + 2,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  playlistIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistCardText: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  playlistCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 2,
  },
  playlistCardCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'right',
  },
  playlistDeleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backToPlaylistsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  backToPlaylistsText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  selectedPlaylistName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: I18nManager.isRTL ? 'left' : 'right',
    marginStart: SPACING.md,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  menuCard: {
    position: 'absolute',
    width: 230,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  menuCardRtl: {
    left: SPACING.lg,
  },
  menuCardLtr: {
    right: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 3,
    gap: SPACING.md,
  },
  menuItemText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.xs,
  },
});
