import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { WifiOff } from 'lucide-react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';

interface OfflineBannerProps {
  isVisible: boolean;
}

export function OfflineBanner({ isVisible }: OfflineBannerProps) {
  if (!isVisible) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(300).springify()}
      exiting={SlideOutDown.duration(200)}
      style={styles.container}
    >
      <View style={styles.content}>
        <WifiOff size={16} color="#92400E" />
        <Text style={styles.text}>Offline — showing cached campus data</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  text: {
    fontSize: FONT_SIZE.sm,
    color: '#92400E',
    fontWeight: '500',
  },
});
