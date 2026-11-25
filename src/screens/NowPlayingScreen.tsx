import React, { useEffect, useState } from 'react';
import {
  I18nManager,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ArtworkView } from '../components/ArtworkView';
import { formatDuration } from '../components/formatTime';
import { PlaylistModal } from '../components/PlaylistModal';
import { useMusic } from '../context/MusicContext';
import { COLORS, SPACING } from '../theme/colors';

const FALLBACK_BG_GRADIENT = ['#222733', '#14171F', COLORS.background];
const ARTWORK_OVERLAY_GRADIENT = [
  'rgba(13, 14, 18, 0.35)',
  'rgba(13, 14, 18, 0.78)',
  COLORS.background,
];

/**
 * Full-screen Now Playing view with blurred artwork backdrop, circular cover,
 * seek slider, and 5 playback controls (no lyrics section).
 */
export function NowPlayingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    shuffle,
    likedIds,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    toggleShuffle,
    toggleLike,
  } = useMusic();

  const [isSliding, setIsSliding] = useState(false);
  const [slidingValue, setSlidingValue] = useState(0);
  const [bgError, setBgError] = useState(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);

  useEffect(() => {
    setBgError(false);
  }, [currentTrack?.artwork]);

  if (!currentTrack) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={styles.glassButton}
            accessibilityLabel="رجوع"
          >
            <Ionicons
              name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>قيد التشغيل</Text>
          <View style={styles.glassPlaceholder} />
        </View>
        <View style={styles.emptyBody}>
          <Ionicons
            name="musical-notes-outline"
            size={54}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyText}>لا توجد أغنية قيد التشغيل حالياً</Text>
        </View>
      </View>
    );
  }

  const isLiked = likedIds.includes(currentTrack.id);
  const effectiveDuration =
    duration > 0 ? duration : Math.max(currentTrack.duration || 0, 0);
  const displayPosition = isSliding
    ? slidingValue
    : Math.min(Math.max(position, 0), effectiveDuration || 0);
  const remainingTime = Math.max(effectiveDuration - displayPosition, 0);
  const artistSubtitle =
    currentTrack.artist && currentTrack.artist !== '<unknown>'
      ? currentTrack.album && currentTrack.album !== '<unknown>'
        ? `${currentTrack.artist} • ${currentTrack.album}`
        : currentTrack.artist
      : currentTrack.album && currentTrack.album !== '<unknown>'
      ? currentTrack.album
      : currentTrack.folder || 'موسيقى محلية';

  return (
    <View style={styles.screen}>
      <View style={styles.backdropContainer} pointerEvents="none">
        {currentTrack.artwork && !bgError ? (
          <>
            <Image
              source={{ uri: currentTrack.artwork }}
              blurRadius={40}
              resizeMode="cover"
              style={styles.blurredArtwork}
              onError={() => setBgError(true)}
            />
            <LinearGradient
              colors={ARTWORK_OVERLAY_GRADIENT}
              locations={[0, 0.62, 1]}
              style={styles.backdropGradient}
            />
          </>
        ) : (
          <LinearGradient
            colors={FALLBACK_BG_GRADIENT}
            locations={[0, 0.55, 1]}
            style={styles.backdropGradient}
          />
        )}
      </View>

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + SPACING.sm,
            paddingBottom: Math.max(insets.bottom, SPACING.lg) + SPACING.md,
          },
        ]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={styles.glassButton}
            accessibilityLabel="رجوع"
          >
            <Ionicons
              name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>قيد التشغيل</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => toggleLike(currentTrack.id)}
            style={styles.glassButton}
            accessibilityLabel={isLiked ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={21}
              color={isLiked ? COLORS.heartLiked : COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.artworkSection}>
          <View style={styles.artworkShadowWrap}>
            <ArtworkView
              uri={currentTrack.artwork}
              size={250}
              borderRadius={999}
              iconSize={84}
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text numberOfLines={2} style={styles.trackTitle}>
            {currentTrack.title}
          </Text>
          <Text numberOfLines={1} style={styles.trackSubtitle}>
            {artistSubtitle}
          </Text>
        </View>

        <View style={styles.sliderSection}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={effectiveDuration > 0 ? effectiveDuration : 1}
            value={displayPosition}
            minimumTrackTintColor={COLORS.accent}
            maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
            thumbTintColor={COLORS.accent}
            onSlidingStart={val => {
              setIsSliding(true);
              setSlidingValue(val);
            }}
            onValueChange={val => {
              setSlidingValue(val);
            }}
            onSlidingComplete={val => {
              setIsSliding(false);
              seekTo(val);
            }}
          />
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>
              {formatDuration(displayPosition)}
            </Text>
            <Text style={styles.timeText}>
              {`-${formatDuration(remainingTime)}`}
            </Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={toggleShuffle}
            hitSlop={10}
            style={styles.secondaryControl}
            accessibilityLabel="تشغيل عشوائي"
          >
            <Ionicons
              name="shuffle"
              size={24}
              color={shuffle ? COLORS.accent : COLORS.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={skipToPrevious}
            hitSlop={10}
            style={styles.secondaryControl}
            accessibilityLabel="السابق"
          >
            <Ionicons
              name={I18nManager.isRTL ? 'play-skip-forward' : 'play-skip-back'}
              size={28}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={togglePlayPause}
            style={styles.mainPlayButton}
            accessibilityLabel={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={30}
              color={COLORS.iconOnAccent}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={skipToNext}
            hitSlop={10}
            style={styles.secondaryControl}
            accessibilityLabel="التالي"
          >
            <Ionicons
              name={I18nManager.isRTL ? 'play-skip-back' : 'play-skip-forward'}
              size={28}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setPlaylistModalVisible(true)}
            hitSlop={10}
            style={styles.secondaryControl}
            accessibilityLabel="إضافة إلى قائمة تشغيل"
          >
            <Ionicons
              name="list"
              size={24}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <PlaylistModal
        visible={playlistModalVisible}
        onClose={() => setPlaylistModalVisible(false)}
        trackId={currentTrack.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backdropContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '58%',
    overflow: 'hidden',
  },
  blurredArtwork: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  backdropGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  glassButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassPlaceholder: {
    width: 42,
    height: 42,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  artworkSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
  },
  artworkShadowWrap: {
    width: 250,
    height: 250,
    borderRadius: 999,
    elevation: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs + 2,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  trackSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sliderSection: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
    marginTop: SPACING.sm,
  },
  secondaryControl: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xl,
  },
  emptyBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
