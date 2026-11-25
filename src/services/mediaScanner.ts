import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import type { Permission } from 'react-native';
import type { Track } from '../types/audio';

interface RawAudioFile {
  id?: unknown;
  title?: unknown;
  artist?: unknown;
  album?: unknown;
  duration?: unknown;
  url?: unknown;
  artwork?: unknown;
  mimeType?: unknown;
  folder?: unknown;
  dateAdded?: unknown;
}

interface LocalAudioModuleType {
  getAllAudioFiles: () => Promise<RawAudioFile[]>;
}

const getAudioPermission = (): Permission => {
  const sdkVersion =
    typeof Platform.Version === 'number'
      ? Platform.Version
      : parseInt(String(Platform.Version), 10) || 0;

  if (sdkVersion >= 33) {
    return (
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO ??
      ('android.permission.READ_MEDIA_AUDIO' as Permission)
    );
  }

  return (
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE ??
    ('android.permission.READ_EXTERNAL_STORAGE' as Permission)
  );
};

export async function checkAudioPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const permission = getAudioPermission();
    return await PermissionsAndroid.check(permission);
  } catch {
    return false;
  }
}

export async function requestAudioPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const permission = getAudioPermission();
    const alreadyGranted = await PermissionsAndroid.check(permission);
    if (alreadyGranted) {
      return true;
    }

    const result = await PermissionsAndroid.request(permission, {
      title: 'إذن الوصول إلى الملفات الصوتية',
      message:
        'يحتاج التطبيق إلى إذن الوصول إلى الملفات الصوتية لقراءة وتشغيل مقاطعك المحلية.',
      buttonPositive: 'سماح',
      buttonNegative: 'إلغاء',
    });

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

const normalizeTrack = (raw: RawAudioFile, index: number): Track | null => {
  const url = typeof raw.url === 'string' ? raw.url.trim() : '';
  if (!url) {
    return null;
  }

  const rawTitle = typeof raw.title === 'string' ? raw.title.trim() : '';
  const rawArtist = typeof raw.artist === 'string' ? raw.artist.trim() : '';
  const rawAlbum = typeof raw.album === 'string' ? raw.album.trim() : '';
  const rawFolder = typeof raw.folder === 'string' ? raw.folder.trim() : '';
  const rawMimeType =
    typeof raw.mimeType === 'string' ? raw.mimeType.trim() : '';
  const rawArtwork = typeof raw.artwork === 'string' ? raw.artwork.trim() : '';

  const duration =
    typeof raw.duration === 'number' &&
    Number.isFinite(raw.duration) &&
    raw.duration >= 0
      ? raw.duration
      : 0;

  const dateAdded =
    typeof raw.dateAdded === 'number' && Number.isFinite(raw.dateAdded)
      ? raw.dateAdded
      : undefined;

  const id =
    raw.id !== undefined && raw.id !== null && String(raw.id).trim().length > 0
      ? String(raw.id).trim()
      : `${url}_${index}`;

  return {
    id,
    title: rawTitle.length > 0 ? rawTitle : 'مقطع صوتي بدون عنوان',
    artist:
      rawArtist.length > 0 && rawArtist !== '<unknown>'
        ? rawArtist
        : 'فنان غير معروف',
    album:
      rawAlbum.length > 0 && rawAlbum !== '<unknown>'
        ? rawAlbum
        : 'ألبوم غير معروف',
    duration,
    url,
    artwork: rawArtwork.length > 0 ? rawArtwork : null,
    mimeType: rawMimeType.length > 0 ? rawMimeType : undefined,
    folder: rawFolder.length > 0 ? rawFolder : undefined,
    dateAdded,
  };
};

export async function scanLocalAudioFiles(): Promise<Track[]> {
  if (Platform.OS !== 'android') {
    return [];
  }

  const module = NativeModules.LocalAudioModule as
    | LocalAudioModuleType
    | undefined;
  if (!module || typeof module.getAllAudioFiles !== 'function') {
    return [];
  }

  const rawFiles = await module.getAllAudioFiles();
  if (!Array.isArray(rawFiles)) {
    return [];
  }

  const normalized: Track[] = [];
  for (let i = 0; i < rawFiles.length; i += 1) {
    const item = rawFiles[i];
    if (item && typeof item === 'object') {
      const track = normalizeTrack(item, i);
      if (track) {
        normalized.push(track);
      }
    }
  }

  return normalized;
}
