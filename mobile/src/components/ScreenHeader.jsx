import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './hooks/useTheme';
import {
  useFonts,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

export default function ScreenHeader({ 
  title, 
  rightIcon: RightIcon, 
  onRightPress,
  showNotificationBadge = false 
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View
      style={{
        paddingTop: insets.top + 20,
        paddingHorizontal: 20,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 28,
          color: colors.text,
          fontFamily: 'Inter_600SemiBold',
        }}
      >
        {title}
      </Text>

      {RightIcon && (
        <TouchableOpacity
          onPress={onRightPress}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.cardBackground,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <RightIcon size={20} color={colors.text} strokeWidth={1.5} />
          {showNotificationBadge && (
            <View
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#FF3B30',
              }}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}