import React, { useEffect, useState } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme/colors';

interface ArtworkViewProps {
  uri?: string | null;
  size: number;
  borderRadius: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}

const GRADIENT_COLORS = ['#2A2E3B', '#1C1E26', '#121319'];

/**
 * Displays track album artwork with a dark LinearGradient + music note fallback.
 */
export function ArtworkView({
  uri,
  size,
  borderRadius,
  iconSize,
  style,
}: ArtworkViewProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  const containerDimensions = {
    width: size,
    height: size,
    borderRadius,
  };

  const resolvedIconSize = iconSize ?? Math.round(size * 0.42);

  if (uri && !hasError) {
    return (
      <View style={[styles.container, containerDimensions, style]}>
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, styles.fallback, containerDimensions, style]}
    >
      <Ionicons
        name="musical-notes"
        size={resolvedIconSize}
        color={COLORS.accent}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
