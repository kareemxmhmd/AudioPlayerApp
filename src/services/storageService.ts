import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Playlist } from '../types/audio';

const LIKED_IDS_KEY = '@audio_player/liked_ids';
const PLAYLISTS_KEY = '@audio_player/playlists';

export async function loadLikedIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(LIKED_IDS_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

export async function saveLikedIds(likedIds: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LIKED_IDS_KEY, JSON.stringify(likedIds));
  } catch {
    // Ignore storage write errors so playback/UI remains responsive
  }
}

export async function loadPlaylists(): Promise<Playlist[]> {
  try {
    const raw = await AsyncStorage.getItem(PLAYLISTS_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is Playlist => {
      if (!item || typeof item !== 'object') {
        return false;
      }
      const candidate = item as Partial<Playlist>;
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.name === 'string' &&
        Array.isArray(candidate.trackIds) &&
        typeof candidate.createdAt === 'number'
      );
    });
  } catch {
    return [];
  }
}

export async function savePlaylists(playlists: Playlist[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  } catch {
    // Ignore storage write errors so playback/UI remains responsive
  }
}
