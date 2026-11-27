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

// HeadlessJsTaskService.reactContext supports both Bridgeless ReactHost (RN 0.88+) and legacy ReactNativeHost,
// and Android 14+ (targetSdkVersion 36) requires foregroundServiceType on startForeground in startAndStopEmptyNotificationToAvoidANR.
patchFile(
  path.join(trackPlayerJavaDir, 'service', 'MusicService.kt'),
  [
    {
      pattern: 'reactNativeHost.reactInstanceManager.currentReactContext',
      replacement: 'reactContext',
    },
    {
      pattern:
        /(val notification = notificationBuilder\.build\(\)\r?\n)([ \t]*)startForeground\(EMPTY_NOTIFICATION_ID, notification\)/,
      replacement:
        '$1$2if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {\n$2    startForeground(EMPTY_NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)\n$2} else {\n$2    startForeground(EMPTY_NOTIFICATION_ID, notification)\n$2}',
    },
  ],
  'Patched react-native-track-player MusicService.kt for New Architecture reactContext and Android 14+ startForeground type',
);

// Arguments.fromBundle requires a non-null Bundle in RN 0.88+ / Kotlin 2.2; guard nullable Track.originalItem,
// and RN 0.88+ TurboModuleInteropUtils requires @ReactMethod functions to return void (Unit), not kotlinx.coroutines.Job.
function convertScopeLaunchExprToBlock(content) {
  const markerRegex = /\)\s*=\s*scope\.launch\s*\{/g;
  let result = content;
  let searchFrom = 0;

  while (true) {
    markerRegex.lastIndex = searchFrom;
    const match = markerRegex.exec(result);
    if (!match) {
      break;
    }

    const idx = match.index;
    const openBraceIdx = idx + match[0].length - 1;
    let depth = 1;
    let i = openBraceIdx + 1;
    let inString = false;
    let escape = false;

    while (i < result.length && depth > 0) {
      const ch = result[i];
      if (inString) {
        if (escape) {
          escape = false;
        } else if (ch === '\\') {
          escape = true;
        } else if (ch === '"') {
          inString = false;
        }
      } else {
        if (ch === '"') {
          inString = true;
        } else if (ch === '{') {
          depth++;
        } else if (ch === '}') {
          depth--;
        }
      }
      i++;
    }

    if (depth !== 0) {
      throw new Error('Unbalanced braces while patching MusicModule.kt');
    }

    const closeBraceIdx = i - 1;
    const body = result.slice(openBraceIdx + 1, closeBraceIdx);
    const replacement = `) {\n        scope.launch {${body}}\n    }`;
    result =
      result.slice(0, idx) + replacement + result.slice(closeBraceIdx + 1);
    searchFrom = idx + replacement.length;
  }

  return result;
}

const musicModulePath = path.join(trackPlayerJavaDir, 'module', 'MusicModule.kt');
if (fs.existsSync(musicModulePath)) {
  const originalModule = fs.readFileSync(musicModulePath, 'utf8');
  let patchedModule = originalModule
    .split('Arguments.fromBundle(musicService.tracks[index].originalItem)')
    .join(
      'musicService.tracks[index].originalItem?.let { Arguments.fromBundle(it) }',
    )
    .replace(
      /Arguments\.fromBundle\(\s*musicService\.tracks\[musicService\.getCurrentTrackIndex\(\)\]\.originalItem\s*\)/g,
      'musicService.tracks[musicService.getCurrentTrackIndex()].originalItem?.let { Arguments.fromBundle(it) }',
    );
  patchedModule = convertScopeLaunchExprToBlock(patchedModule);

  if (patchedModule !== originalModule) {
    fs.writeFileSync(musicModulePath, patchedModule, 'utf8');
    console.log(
      'Patched react-native-track-player MusicModule.kt for nullable originalItem and Unit return types',
    );
  }
}
