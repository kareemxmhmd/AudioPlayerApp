import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import TrackPlayer, {
  Event,
  State,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import type { Track as RNTPTrack } from 'react-native-track-player';
import {
  deleteLocalAudioFile,
  requestAudioPermission,
  scanLocalAudioFiles,
} from '../services/mediaScanner';
import {
  loadLikedIds,
  loadPlaylists,
  saveLikedIds,
  savePlaylists,
} from '../services/storageService';
import {
  loadAndPlayQueue,
  setPlayerRepeatMode,
  setupPlayer,
  skipNextInPlayer,
  skipPreviousInPlayer,
  syncUpcomingShuffle,
} from '../services/trackPlayerService';
import type {
  PlaybackMode,
  Playlist,
  RepeatModeType,
  SortType,
  TabType,
  Track,
} from '../types/audio';

interface MusicContextValue {
  tracks: Track[];
  filteredTracks: Track[];
  playlists: Playlist[];
  likedIds: string[];
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  shuffle: boolean;
  repeatMode: RepeatModeType;
  playbackMode: PlaybackMode;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: SortType;
  setSortBy: (sort: SortType) => void;
  isLoading: boolean;
  hasPermission: boolean;
  rescanMedia: () => Promise<void>;
  playTrack: (track: Track, queueTracks?: Track[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  toggleShuffle: () => Promise<void>;
  toggleRepeatMode: () => Promise<void>;
  cyclePlaybackMode: () => Promise<void>;
  toggleLike: (trackId: string) => void;
  deleteTrack: (trackId: string) => Promise<boolean>;
  createPlaylist: (name: string) => Playlist | null;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
}

const MusicContext = createContext<MusicContextValue | undefined>(undefined);

const mapRNTPTrackToTrack = (
  rntpTrack: RNTPTrack,
  knownTracks: Track[],
): Track | null => {
  const trackId =
    rntpTrack.id !== undefined && rntpTrack.id !== null
      ? String(rntpTrack.id)
      : '';
  const match = knownTracks.find(item => item.id === trackId);
  if (match) {
    return match;
  }

  if (!rntpTrack.url) {
    return null;
  }

  return {
    id: trackId || String(rntpTrack.url),
    title: rntpTrack.title ?? 'مقطع صوتي بدون عنوان',
    artist: rntpTrack.artist ?? 'فنان غير معروف',
    album: rntpTrack.album ?? 'ألبوم غير معروف',
    duration: typeof rntpTrack.duration === 'number' ? rntpTrack.duration : 0,
    url: String(rntpTrack.url),
    artwork: typeof rntpTrack.artwork === 'string' ? rntpTrack.artwork : null,
  };
};

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatModeType>('off');
  const [activeTab, setActiveTabState] = useState<TabType>('all');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortType>('title');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const tracksRef = useRef<Track[]>([]);
  tracksRef.current = tracks;

  const baseQueueRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(null);
  currentTrackRef.current = currentTrack;

  const playbackState = usePlaybackState();
  const progress = useProgress(500);

  const isPlaying = playbackState.state === State.Playing;
  const position = progress.position;
  const duration =
    progress.duration > 0 ? progress.duration : currentTrack?.duration ?? 0;

  const rescanMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const granted = await requestAudioPermission();
      setHasPermission(granted);
      if (!granted) {
        setTracks([]);
        return;
      }

      const scannedTracks = await scanLocalAudioFiles();
      setTracks(scannedTracks);
    } catch {
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const [storedLiked, storedPlaylists] = await Promise.all([
          loadLikedIds(),
          loadPlaylists(),
        ]);

        if (!mounted) {
          return;
        }

        setLikedIds(storedLiked);
        setPlaylists(storedPlaylists);
      } catch {
        // Ignore storage load errors on startup
      }

      if (mounted) {
        await rescanMedia();
      }
    };

    bootstrap().catch(() => {});

    return () => {
      mounted = false;
    };
  }, [rescanMedia]);

  useTrackPlayerEvents(
    [Event.PlaybackActiveTrackChanged, Event.PlaybackQueueEnded],
    event => {
      if (event.type === Event.PlaybackActiveTrackChanged) {
        if (event.track) {
          const mapped = mapRNTPTrackToTrack(event.track, tracksRef.current);
          if (mapped) {
            setCurrentTrack(mapped);
          }
        }
      } else if (event.type === Event.PlaybackQueueEnded) {
        // Keep current track displayed when queue finishes
      }
    },
  );

  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
    if (tab !== 'playlists') {
      setSelectedPlaylistId(null);
    }
  }, []);

  const filteredTracks = useMemo(() => {
    let base: Track[] = [];

    if (activeTab === 'all') {
      base = tracks;
    } else if (activeTab === 'liked') {
      const likedSet = new Set(likedIds);
      base = tracks.filter(track => likedSet.has(track.id));
    } else if (activeTab === 'playlists') {
      if (selectedPlaylistId) {
        const playlist = playlists.find(pl => pl.id === selectedPlaylistId);
        if (playlist) {
          const trackMap = new Map(tracks.map(track => [track.id, track]));
          base = playlist.trackIds
            .map(id => trackMap.get(id))
            .filter((item): item is Track => item !== undefined);
        }
      }
    }

    const query = searchQuery.trim().toLowerCase();
    const searched = query
      ? base.filter(
          track =>
            track.title.toLowerCase().includes(query) ||
            track.artist.toLowerCase().includes(query) ||
            track.album.toLowerCase().includes(query) ||
            (track.folder?.toLowerCase().includes(query) ?? false),
        )
      : [...base];

    searched.sort((a, b) => {
      if (sortBy === 'duration') {
        return (b.duration ?? 0) - (a.duration ?? 0);
      }
      if (sortBy === 'date') {
        return (b.dateAdded ?? 0) - (a.dateAdded ?? 0);
      }
      return a.title.localeCompare(b.title, 'ar');
    });

    return searched;
  }, [
    activeTab,
    likedIds,
    playlists,
    searchQuery,
    selectedPlaylistId,
    sortBy,
    tracks,
  ]);

  const playTrack = useCallback(
    async (track: Track, queueTracks?: Track[]) => {
      const sourceQueue =
        queueTracks && queueTracks.length > 0
          ? queueTracks
          : filteredTracks.length > 0
            ? filteredTracks
            : tracks;

      baseQueueRef.current = sourceQueue;
      setCurrentTrack(track);

      try {
        await loadAndPlayQueue(sourceQueue, track, shuffle);
        await setPlayerRepeatMode(repeatMode);
      } catch {
        // Ignore transient native playback errors
      }
    },
    [filteredTracks, repeatMode, shuffle, tracks],
  );

  const togglePlayPause = useCallback(async () => {
    try {
      const ready = await setupPlayer();
      if (!ready) {
        return;
      }

      if (isPlaying) {
        await TrackPlayer.pause();
        return;
      }

      const active = await TrackPlayer.getActiveTrack();
      if (active) {
        await TrackPlayer.play();
      } else if (currentTrackRef.current) {
        await loadAndPlayQueue(
          baseQueueRef.current.length > 0
            ? baseQueueRef.current
            : filteredTracks,
          currentTrackRef.current,
          shuffle,
        );
      }
    } catch {
      // Ignore playback toggle errors
    }
  }, [filteredTracks, isPlaying, shuffle]);

  const skipToNext = useCallback(async () => {
    try {
      const ready = await setupPlayer();
      if (!ready) {
        return;
      }
      await skipNextInPlayer();
    } catch {
      // Ignore skip errors
    }
  }, []);

  const skipToPrevious = useCallback(async () => {
    try {
      const ready = await setupPlayer();
      if (!ready) {
        return;
      }
      await skipPreviousInPlayer();
    } catch {
      // Ignore skip errors
    }
  }, []);

  const seekTo = useCallback(async (seconds: number) => {
    try {
      const ready = await setupPlayer();
      if (!ready) {
        return;
      }
      const clamped = Math.max(0, seconds);
      await TrackPlayer.seekTo(clamped);
    } catch {
      // Ignore seek errors
    }
  }, []);

  const toggleShuffle = useCallback(async () => {
    const nextShuffle = !shuffle;
    setShuffle(nextShuffle);
    if (nextShuffle && repeatMode === 'track') {
      setRepeatMode('off');
      setPlayerRepeatMode('off').catch(() => {});
    }
    try {
      const sourceQueue =
        baseQueueRef.current.length > 0
          ? baseQueueRef.current
          : filteredTracks.length > 0
            ? filteredTracks
            : tracks;
      await syncUpcomingShuffle(
        sourceQueue,
        currentTrackRef.current,
        nextShuffle,
      );
    } catch {
      // Ignore queue sync errors
    }
  }, [filteredTracks, repeatMode, shuffle, tracks]);

  const toggleRepeatMode = useCallback(async () => {
    const nextMode: RepeatModeType = repeatMode === 'track' ? 'off' : 'track';
    setRepeatMode(nextMode);
    if (nextMode === 'track' && shuffle) {
      setShuffle(false);
    }
    try {
      await setPlayerRepeatMode(nextMode);
    } catch {
      // Ignore repeat mode errors
    }
  }, [repeatMode, shuffle]);

  const playbackMode: PlaybackMode =
    repeatMode === 'track'
      ? 'repeat-one'
      : shuffle
        ? 'shuffle'
        : 'sequential';

  const cyclePlaybackMode = useCallback(async () => {
    if (playbackMode === 'sequential') {
      // sequential -> shuffle
      setShuffle(true);
      setRepeatMode('off');
      try {
        await setPlayerRepeatMode('off');
        const sourceQueue =
          baseQueueRef.current.length > 0
            ? baseQueueRef.current
            : filteredTracks.length > 0
              ? filteredTracks
              : tracks;
        await syncUpcomingShuffle(sourceQueue, currentTrackRef.current, true);
      } catch {
        // Ignore
      }
    } else if (playbackMode === 'shuffle') {
      // shuffle -> repeat-one
      setShuffle(false);
      setRepeatMode('track');
      try {
        await setPlayerRepeatMode('track');
      } catch {
        // Ignore
      }
    } else {
      // repeat-one -> sequential
      setShuffle(false);
      setRepeatMode('off');
      try {
        await setPlayerRepeatMode('off');
        const sourceQueue =
          baseQueueRef.current.length > 0
            ? baseQueueRef.current
            : filteredTracks.length > 0
              ? filteredTracks
              : tracks;
        await syncUpcomingShuffle(sourceQueue, currentTrackRef.current, false);
      } catch {
        // Ignore
      }
    }
  }, [filteredTracks, playbackMode, tracks]);

  const deleteTrack = useCallback(async (trackId: string): Promise<boolean> => {
    const deleted = await deleteLocalAudioFile(trackId);
    if (!deleted) {
      return false;
    }

    setTracks(prev => prev.filter(item => item.id !== trackId));
    baseQueueRef.current = baseQueueRef.current.filter(
      item => item.id !== trackId,
    );

    setLikedIds(prev => {
      if (!prev.includes(trackId)) {
        return prev;
      }
      const next = prev.filter(id => id !== trackId);
      saveLikedIds(next).catch(() => {});
      return next;
    });

    setPlaylists(prev => {
      const next = prev.map(playlist => ({
        ...playlist,
        trackIds: playlist.trackIds.filter(id => id !== trackId),
      }));
      savePlaylists(next).catch(() => {});
      return next;
    });

    if (currentTrackRef.current?.id === trackId) {
      setCurrentTrack(null);
      TrackPlayer.reset().catch(() => {});
    }

    return true;
  }, []);

  const toggleLike = useCallback((trackId: string) => {
    setLikedIds(prev => {
      const next = prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId];
      saveLikedIds(next).catch(() => {});
      return next;
    });
  }, []);

  const createPlaylist = useCallback((name: string): Playlist | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return null;
    }

    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: trimmed,
      trackIds: [],
      createdAt: Date.now(),
    };

    setPlaylists(prev => {
      const next = [newPlaylist, ...prev];
      savePlaylists(next).catch(() => {});
      return next;
    });

    return newPlaylist;
  }, []);

  const addTrackToPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      setPlaylists(prev => {
        const next = prev.map(playlist => {
          if (playlist.id !== playlistId) {
            return playlist;
          }
          if (playlist.trackIds.includes(trackId)) {
            return playlist;
          }
          return {
            ...playlist,
            trackIds: [...playlist.trackIds, trackId],
          };
        });
        savePlaylists(next).catch(() => {});
        return next;
      });
    },
    [],
  );

  const removeTrackFromPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      setPlaylists(prev => {
        const next = prev.map(playlist => {
          if (playlist.id !== playlistId) {
            return playlist;
          }
          return {
            ...playlist,
            trackIds: playlist.trackIds.filter(id => id !== trackId),
          };
        });
        savePlaylists(next).catch(() => {});
        return next;
      });
    },
    [],
  );

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists(prev => {
      const next = prev.filter(playlist => playlist.id !== playlistId);
      savePlaylists(next).catch(() => {});
      return next;
    });
    setSelectedPlaylistId(prev => (prev === playlistId ? null : prev));
  }, []);

  const value = useMemo<MusicContextValue>(
    () => ({
      tracks,
      filteredTracks,
      playlists,
      likedIds,
      currentTrack,
      isPlaying,
      position,
      duration,
      shuffle,
      repeatMode,
      playbackMode,
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
      skipToNext,
      skipToPrevious,
      seekTo,
      toggleShuffle,
      toggleRepeatMode,
      cyclePlaybackMode,
      toggleLike,
      deleteTrack,
      createPlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      deletePlaylist,
    }),
    [
      activeTab,
      addTrackToPlaylist,
      createPlaylist,
      currentTrack,
      cyclePlaybackMode,
      deletePlaylist,
      deleteTrack,
      duration,
      filteredTracks,
      hasPermission,
      isLoading,
      isPlaying,
      likedIds,
      playTrack,
      playbackMode,
      playlists,
      position,
      removeTrackFromPlaylist,
      repeatMode,
      rescanMedia,
      searchQuery,
      seekTo,
      selectedPlaylistId,
      setActiveTab,
      shuffle,
      skipToNext,
      skipToPrevious,
      sortBy,
      toggleLike,
      togglePlayPause,
      toggleRepeatMode,
      toggleShuffle,
      tracks,
    ],
  );

  return (
    <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
  );
};

export function useMusic(): MusicContextValue {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
