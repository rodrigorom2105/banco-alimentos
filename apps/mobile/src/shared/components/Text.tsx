import { StyleSheet, Text as RNText, type TextProps } from 'react-native';

import { fonts } from '@/shared/theme';

// Text con Inter por defecto: React Native no tiene una fuente global, y sin esto cada párrafo
// caería en la del sistema. Respeta la fuente que el texto ya traiga:
// - un `fontFamily` en su style (títulos, botones) y
// - un `font-*` en su className (NativeWind). Aquí no se inyecta nada porque el style en línea
//   le ganaría a la clase.
// Un Text anidado sin fuente propia usa Inter, no la de su padre.
export function Text({ style, ...props }: TextProps) {
  const hasFontClass = typeof props.className === 'string' && /(^|\s)font-/.test(props.className);
  const hasFontStyle = !!StyleSheet.flatten(style)?.fontFamily;
  const needsDefault = !hasFontClass && !hasFontStyle;

  return <RNText {...props} style={needsDefault ? [{ fontFamily: fonts.body }, style] : style} />;
}
