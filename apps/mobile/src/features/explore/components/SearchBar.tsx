import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/shared/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar zona o colonia',
  style,
}: Props) {
  return (
    <View
      className="flex-row items-center gap-2 rounded-full border border-line bg-white px-4"
      style={style}
    >
      <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        className="flex-1 py-3 font-body text-[15px] text-carbon-500"
        returnKeyType="search"
        accessibilityLabel={placeholder}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityLabel="Borrar búsqueda"
        >
          <MaterialCommunityIcons name="close-circle" size={18} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}
