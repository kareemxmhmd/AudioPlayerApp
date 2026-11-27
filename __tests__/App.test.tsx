/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {
  NativeModules,
  PermissionsAndroid,
  Platform,
  Text,
  TextInput,
} from 'react-native';

jest.setTimeout(15000);

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
}));

jest.mock('react-native-track-player', () => {
  const mockPlayer = {
    registerPlaybackService: jest.fn(),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    setupPlayer: jest.fn(async () => undefined),
    updateOptions: jest.fn(async () => undefined),
    setRepeatMode: jest.fn(async () => undefined),
    getActiveTrack: jest.fn(async () => undefined),
    getActiveTrackIndex: jest.fn(async () => 0),
    getQueue: jest.fn(async () => []),
    getProgress: jest.fn(async () => ({ position: 0, duration: 0, buffered: 0 })),
    reset: jest.fn(async () => undefined),
    add: jest.fn(async () => undefined),
    skip: jest.fn(async () => undefined),
    skipToNext: jest.fn(async () => undefined),
    skipToPrevious: jest.fn(async () => undefined),
    play: jest.fn(async () => undefined),
    pause: jest.fn(async () => undefined),
    stop: jest.fn(async () => undefined),
    seekTo: jest.fn(async () => undefined),
    removeUpcomingTracks: jest.fn(async () => undefined),
  };

  return {
    __esModule: true,
    default: mockPlayer,
    AppKilledPlaybackBehavior: {
      ContinuePlayback: 'continue-playback',
    },
    Capability: {
      Play: 'play',
      Pause: 'pause',
      SkipToNext: 'skip-to-next',
      SkipToPrevious: 'skip-to-previous',
      SeekTo: 'seek-to',
    },
    Event: {
      RemotePlay: 'remote-play',
      RemotePause: 'remote-pause',
      RemoteNext: 'remote-next',
      RemotePrevious: 'remote-previous',
      RemoteSeek: 'remote-seek',
      RemoteStop: 'remote-stop',
      PlaybackActiveTrackChanged: 'playback-active-track-changed',
      PlaybackQueueEnded: 'playback-queue-ended',
    },
    RepeatMode: {
      Off: 0,
      Track: 1,
    },
    State: {
      None: 'none',
      Playing: 'playing',
      Paused: 'paused',
    },
    usePlaybackState: jest.fn(() => ({ state: 'none' })),
    useProgress: jest.fn(() => ({ position: 0, duration: 0, buffered: 0 })),
    useTrackPlayerEvents: jest.fn(),
  };
});

jest.mock('@react-native-community/slider', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return function MockSlider(props: Record<string, unknown>) {
    return ReactLib.createElement(View, props);
  };
});

jest.mock('react-native-linear-gradient', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return function MockLinearGradient(props: { children?: React.ReactNode }) {
    return ReactLib.createElement(View, props, props.children);
  };
});

jest.mock('react-native-vector-icons/Ionicons', () => {
  const ReactLib = require('react');
  const { Text: RNText } = require('react-native');
  return function MockIonicons(props: { name: string }) {
    return ReactLib.createElement(RNText, null, props.name);
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactLib = require('react');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      ReactLib.createElement(ReactLib.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const ReactLib = require('react');
  return {
    DarkTheme: {
      dark: true,
      colors: {
        primary: '#D4EE42',
        background: '#0D0E12',
        card: '#1C1E26',
        text: '#FFFFFF',
        border: 'rgba(255, 255, 255, 0.12)',
        notification: '#D4EE42',
      },
    },
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      ReactLib.createElement(ReactLib.Fragment, null, children),
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const ReactLib = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) => {
        const screens = ReactLib.Children.toArray(children);
        return screens[0] ?? null;
      },
      Screen: ({ component: Component }: { component: React.ComponentType }) =>
        ReactLib.createElement(Component),
    }),
  };
});

import TrackPlayer from 'react-native-track-player';
import App from '../App';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { MusicProvider, useMusic } from '../src/context/MusicContext';
import { NowPlayingScreen } from '../src/screens/NowPlayingScreen';

const SAMPLE_TRACK = {
  id: '1',
  title: 'أغنية تجريبية',
  artist: 'فنان تجريبي',
  album: 'ألبوم تجريبي',
  duration: 185,
  url: 'content://media/external/audio/media/1',
  artwork: null,
  mimeType: 'audio/mpeg',
  folder: 'Music',
  dateAdded: 1700000000,
};

function collectText(root: ReactTestRenderer.ReactTestInstance): string[] {
  return root.findAllByType(Text).map(node => {
    const children = node.props.children;
    if (Array.isArray(children)) {
      return children.join('');
    }
    return typeof children === 'string' || typeof children === 'number'
      ? String(children)
      : '';
  });
}

async function flushMicrotasks(rounds = 8) {
  for (let i = 0; i < rounds; i += 1) {
    await Promise.resolve();
  }
}

const originalOS = Platform.OS;
const originalVersion = Platform.Version;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  (Platform as { OS: string; Version: number | string }).OS = 'android';
  (Platform as { OS: string; Version: number | string }).Version = 33;
  jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(true);
  jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted');
  NativeModules.LocalAudioModule = {
    getAllAudioFiles: jest.fn(async () => [SAMPLE_TRACK]),
  };
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  (Platform as { OS: string; Version: number | string }).OS = originalOS;
  (Platform as { OS: string; Version: number | string }).Version =
    originalVersion;
  jest.restoreAllMocks();
});

test('defers TrackPlayer setup on launch, scans tracks, toggles search, and shows FloatingControlPill on play', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
    await flushMicrotasks();
    jest.runOnlyPendingTimers();
  });

  expect(TrackPlayer.setupPlayer).not.toHaveBeenCalled();
  expect(TrackPlayer.getActiveTrack).not.toHaveBeenCalled();

  const texts = collectText(tree!.root);
  expect(texts).not.toContain('موسيقاي');
  expect(texts).toContain('الكل');
  expect(texts).toContain('قوائم التشغيل');
  expect(texts).toContain('المفضلة');
  expect(texts).toContain('أغنية تجريبية');

  const trackRowTitle = tree!.root
    .findAllByType(Text)
    .find(node => node.props.children === 'أغنية تجريبية');
  expect(trackRowTitle).toBeTruthy();

  await ReactTestRenderer.act(async () => {
    let parent = trackRowTitle!.parent;
    while (parent && typeof parent.props.onPress !== 'function') {
      parent = parent.parent;
    }
    parent!.props.onPress();
    await flushMicrotasks();
    jest.runOnlyPendingTimers();
  });

  expect(TrackPlayer.setupPlayer).toHaveBeenCalledTimes(1);

  const pill = tree!.root.findByProps({
    accessibilityLabel: 'فتح شاشة قيد التشغيل',
  });
  await ReactTestRenderer.act(async () => {
    pill.props.onPress();
  });
  expect(mockNavigate).toHaveBeenCalledWith('NowPlaying');

  expect(tree!.root.findAllByType(TextInput)).toHaveLength(0);

  const searchBtn = tree!.root.findByProps({ accessibilityLabel: 'بحث' });
  await ReactTestRenderer.act(async () => {
    searchBtn.props.onPress();
    await flushMicrotasks(2);
    jest.runOnlyPendingTimers();
  });

  const searchInputs = tree!.root.findAllByType(TextInput);
  expect(searchInputs.length).toBeGreaterThan(0);

  await ReactTestRenderer.act(async () => {
    tree!.unmount();
  });
});

test('renders NowPlaying without lyrics and opens PlaylistModal from playlist button', async () => {
  function AutoPlayNowPlaying() {
    const { playTrack } = useMusic();
    React.useEffect(() => {
      playTrack(SAMPLE_TRACK, [SAMPLE_TRACK]).catch(() => {});
    }, [playTrack]);
    return <NowPlayingScreen />;
  }

  let tree: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <MusicProvider>
        <AutoPlayNowPlaying />
      </MusicProvider>,
    );
    await flushMicrotasks();
    jest.runOnlyPendingTimers();
  });

  const initialTexts = collectText(tree!.root);
  expect(initialTexts).toContain('قيد التشغيل');
  expect(initialTexts).toContain('أغنية تجريبية');
  expect(initialTexts.some(t => t.includes('كلمات'))).toBe(false);

  const playlistBtn = tree!.root.findByProps({
    accessibilityLabel: 'إضافة إلى قائمة تشغيل',
  });
  await ReactTestRenderer.act(async () => {
    playlistBtn.props.onPress();
    await flushMicrotasks(2);
    jest.runOnlyPendingTimers();
  });

  const modalTexts = collectText(tree!.root);
  expect(modalTexts).toContain('إضافة إلى قائمة تشغيل');

  await ReactTestRenderer.act(async () => {
    tree!.unmount();
  });
});

test('ErrorBoundary displays Arabic error fallback and retries cleanly', async () => {
  const consoleErrorSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  let shouldThrow = true;
  function MaybeThrowingChild() {
    if (shouldThrow) {
      throw new Error('Test render failure');
    }
    return <Text>تمت الاستعادة</Text>;
  }

  let tree: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <ErrorBoundary>
        <MaybeThrowingChild />
      </ErrorBoundary>,
    );
  });

  const errorTexts = collectText(tree!.root);
  expect(errorTexts).toContain('حدث خطأ غير متوقع');
  expect(errorTexts).toContain('Test render failure');
  expect(errorTexts).toContain('إعادة المحاولة');

  shouldThrow = false;
  const retryBtn = tree!.root.findByProps({
    accessibilityLabel: 'إعادة المحاولة',
  });

  await ReactTestRenderer.act(async () => {
    retryBtn.props.onPress();
  });

  const recoveredTexts = collectText(tree!.root);
  expect(recoveredTexts).toContain('تمت الاستعادة');

  await ReactTestRenderer.act(async () => {
    tree!.unmount();
  });
  consoleErrorSpy.mockRestore();
});
