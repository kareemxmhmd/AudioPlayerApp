declare module 'react-native-vector-icons/Ionicons' {
  import type { ComponentType } from 'react';
  import type { ColorValue, TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: ColorValue;
  }

  const Ionicons: ComponentType<IconProps>;
  export default Ionicons;
}
