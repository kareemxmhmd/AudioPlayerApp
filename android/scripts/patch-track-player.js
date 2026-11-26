const fs = require('fs');
const path = require('path');

const trackPlayerJavaDir = path.join(
  __dirname,
  '..',
  '..',
  'node_modules',
  'react-native-track-player',
  'android',
  'src',
  'main',
  'java',
  'com',
  'doublesymmetry',
  'trackplayer',
);

/**
 * Applies idempotent string/regex replacements to a file if it exists.
 * @param {string} filePath
 * @param {Array<{pattern: string | RegExp, replacement: string}>} transforms
 * @param {string} message
 */
function patchFile(filePath, transforms, message) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const {pattern, replacement} of transforms) {
    if (typeof pattern === 'string') {
      content = content.split(pattern).join(replacement);
    } else {
      content = content.replace(pattern, replacement);
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(message);
  }
}

// HeadlessJsTaskService.reactContext supports both Bridgeless ReactHost (RN 0.88+) and legacy ReactNativeHost.
patchFile(
  path.join(trackPlayerJavaDir, 'service', 'MusicService.kt'),
  [
    {
      pattern: 'reactNativeHost.reactInstanceManager.currentReactContext',
      replacement: 'reactContext',
    },
  ],
  'Patched react-native-track-player MusicService.kt for New Architecture reactContext',
);

// Arguments.fromBundle requires a non-null Bundle in RN 0.88+ / Kotlin 2.2; guard nullable Track.originalItem.
patchFile(
  path.join(trackPlayerJavaDir, 'module', 'MusicModule.kt'),
  [
    {
      pattern: 'Arguments.fromBundle(musicService.tracks[index].originalItem)',
      replacement:
        'musicService.tracks[index].originalItem?.let { Arguments.fromBundle(it) }',
    },
    {
      pattern:
        /Arguments\.fromBundle\(\s*musicService\.tracks\[musicService\.getCurrentTrackIndex\(\)\]\.originalItem\s*\)/g,
      replacement:
        'musicService.tracks[musicService.getCurrentTrackIndex()].originalItem?.let { Arguments.fromBundle(it) }',
    },
  ],
  'Patched react-native-track-player MusicModule.kt for nullable originalItem Bundle?',
);
