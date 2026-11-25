export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  artwork?: string | null;
  mimeType?: string;
  folder?: string;
  dateAdded?: number;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

export type TabType = 'all' | 'playlists' | 'liked';

export type SortType = 'title' | 'date' | 'duration';
