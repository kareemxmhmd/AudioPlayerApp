import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
} from 'react-native-track-player';
import type { AddTrack } from 'react-native-track-player';
import type { RepeatModeType, Track } from '../types/audio';

let setupPromise: Promise<boolean> | null = null;
let isSetupDone = false;

export async function skipNextInPlayer(): Promise<void> {
  const ready = await setupPlayer();
  if (!ready) {
    return;
  }
  const queue = await TrackPlayer.getQueue();
  if (queue.length === 0) {
    return;
  }
  const activeIndex = await TrackPlayer.getActiveTrackIndex();
  if (activeIndex !== undefined && activeIndex < queue.length - 1) {
    await TrackPlayer.skipToNext();
  } else {
    await TrackPlayer.skip(0);
  }
  await TrackPlayer.play();
}

export async function skipPreviousInPlayer(): Promise<void> {
  const ready = await setupPlayer();
  if (!ready) {
    return;
  }
  const queue = await TrackPlayer.getQueue();
  if (queue.length === 0) {
    return;
  }
  const progress = await TrackPlayer.getProgress();
  if (progress.position > 3) {
    await TrackPlayer.seekTo(0);
    return;
  }
  const activeIndex = await TrackPlayer.getActiveTrackIndex();
  if (activeIndex !== undefined && activeIndex > 0) {
    await TrackPlayer.skipToPrevious();
  } else {
    await TrackPlayer.skip(queue.length - 1);
  }
  await TrackPlayer.play();
}

export async function PlaybackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play().catch(() => {});
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause().catch(() => {});
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    skipNextInPlayer().catch(() => {});
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    skipPreviousInPlayer().catch(() => {});
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, event => {
    TrackPlayer.seekTo(event.position).catch(() => {});
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop().catch(() => {});
  });
}

export async function configurePlayerOptions(): Promise<void> {
  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
    },
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.SeekTo,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
    ],
  });
}

export async function setupPlayer(): Promise<boolean> {
  if (isSetupDone) {
    return true;
  }

  if (setupPromise) {
    return setupPromise;
  }

  setupPromise = (async () => {
    try {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
      });
      await configurePlayerOptions();
      await TrackPlayer.setRepeatMode(RepeatMode.Off);
      isSetupDone = true;
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? '');
      if (message.toLowerCase().includes('already been initialized')) {
        await configurePlayerOptions().catch(() => {});
        isSetupDone = true;
        return true;
      }
      setupPromise = null;
      return false;
    }
  })();

  return setupPromise;
}

export async function setPlayerRepeatMode(
  mode: RepeatModeType,
): Promise<void> {
  const ready = await setupPlayer();
  if (!ready) {
    return;
  }

  await TrackPlayer.setRepeatMode(
    mode === 'track' ? RepeatMode.Track : RepeatMode.Off,
  );
}

export function toPlayerTrack(track: Track): AddTrack {
  return {
    id: track.id,
    url: track.url,
    title: track.title,
    artist: track.artist,
    album: track.album,
    duration: track.duration,
    artwork: track.artwork ?? undefined,
    contentType: track.mimeType,
  };
}

export function shuffleTracks<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

export async function loadAndPlayQueue(
  queueTracks: Track[],
  selectedTrack: Track,
  shuffle: boolean,
): Promise<void> {
  const ready = await setupPlayer();
  if (!ready) {
    return;
  }

  const baseQueue =
    queueTracks.length > 0 ? queueTracks : [selectedTrack];

  let orderedQueue: Track[];
  let startIndex = 0;

  if (shuffle) {
    const remaining = baseQueue.filter(item => item.id !== selectedTrack.id);
    orderedQueue = [selectedTrack, ...shuffleTracks(remaining)];
    startIndex = 0;
  } else {
    const foundIndex = baseQueue.findIndex(item => item.id === selectedTrack.id);
    if (foundIndex >= 0) {
      orderedQueue = baseQueue;
      startIndex = foundIndex;
    } else {
      orderedQueue = [selectedTrack, ...baseQueue];
      startIndex = 0;
    }
  }

  await TrackPlayer.reset();
  await TrackPlayer.add(orderedQueue.map(toPlayerTrack));
  if (startIndex > 0) {
    await TrackPlayer.skip(startIndex);
  }
  await TrackPlayer.play();
}

export async function syncUpcomingShuffle(
  baseQueue: Track[],
  currentTrack: Track | null,
  shuffle: boolean,
): Promise<void> {
  if (!currentTrack || baseQueue.length === 0) {
    return;
  }

  const ready = await setupPlayer();
  if (!ready) {
    return;
  }

  await TrackPlayer.removeUpcomingTracks();

  let upcoming: Track[];
  if (shuffle) {
    upcoming = shuffleTracks(
      baseQueue.filter(item => item.id !== currentTrack.id),
    );
  } else {
    const currentIndex = baseQueue.findIndex(
      item => item.id === currentTrack.id,
    );
    upcoming =
      currentIndex >= 0
        ? baseQueue.slice(currentIndex + 1)
        : baseQueue.filter(item => item.id !== currentTrack.id);
  }

  if (upcoming.length > 0) {
    await TrackPlayer.add(upcoming.map(toPlayerTrack));
  }
}
