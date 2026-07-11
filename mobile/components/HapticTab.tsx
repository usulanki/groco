import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { TouchableOpacity } from 'react-native';

export function HapticTab({ onPress, onLongPress, children, style, accessibilityState }: BottomTabBarButtonProps) {
  return (
    <TouchableOpacity
      style={style}
      accessibilityState={accessibilityState}
      onPress={(ev) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(ev);
      }}
      onLongPress={onLongPress}>
      {children}
    </TouchableOpacity>
  );
}
