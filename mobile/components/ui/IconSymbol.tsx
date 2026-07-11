import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'xmark': 'close',
  'checkmark': 'check',
  'cart.fill': 'shopping-cart',
  'bag.fill': 'shopping-bag',
  'person.fill': 'person',
  'magnifyingglass': 'search',
  'bell.fill': 'notifications',
  'heart.fill': 'favorite',
  'star.fill': 'star',
  'location.fill': 'location-on',
} as const satisfies Record<string, React.ComponentProps<typeof MaterialIcons>['name']>;

export type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
