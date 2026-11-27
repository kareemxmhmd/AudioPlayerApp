import React from 'react';
import { StatusBar } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RootStackParamList } from './components/navigationTypes';
import { MusicProvider } from './context/MusicContext';
import { MyMusicScreen } from './screens/MyMusicScreen';
import { NowPlayingScreen } from './screens/NowPlayingScreen';
import { COLORS } from './theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const APP_NAVIGATION_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    primary: COLORS.accent,
    border: COLORS.divider,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <MusicProvider>
          <StatusBar barStyle="light-content" />
          <NavigationContainer theme={APP_NAVIGATION_THEME}>
            <Stack.Navigator
              initialRouteName="MyMusic"
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.background },
                animation: 'slide_from_bottom',
              }}
            >
              <Stack.Screen name="MyMusic" component={MyMusicScreen} />
              <Stack.Screen name="NowPlaying" component={NowPlayingScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </MusicProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
