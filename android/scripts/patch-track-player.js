const fs = require('fs');
const path = require('path');

const target = path.join(
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
  'service',
  'MusicService.kt',
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const original = fs.readFileSync(target, 'utf8');
const legacyRef = 'reactNativeHost.reactInstanceManager.currentReactContext';

if (!original.includes(legacyRef)) {
  process.exit(0);
}

// HeadlessJsTaskService.reactContext supports both Bridgeless ReactHost (RN 0.88+) and legacy ReactNativeHost.
const updated = original.split(legacyRef).join('reactContext');
fs.writeFileSync(target, updated, 'utf8');
console.log('Patched react-native-track-player MusicService.kt for New Architecture reactContext');
