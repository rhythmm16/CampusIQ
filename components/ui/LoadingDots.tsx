import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { COLORS, SPACING } from '@/constants/colors';

interface LoadingDotsProps {
  color?: string;
  size?: number;
}

export function LoadingDots({ color = COLORS.primary, size = 8 }: LoadingDotsProps) {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);

  useEffect(() => {
    const animateDot = (value: Animated.SharedValue<number>, delay: number) => {
      value.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.5, { duration: 200 }),
            withTiming(1, { duration: 200 })
          ),
          -1
        )
      );
    };

    animateDot(scale1, 0);
    animateDot(scale2, 150);
    animateDot(scale3, 300);
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: scale1.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: scale2.value,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: scale3.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, animatedStyle1]} />
      <Animated.View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, animatedStyle2]} />
      <Animated.View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, animatedStyle3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    // Styles are passed as props
  },
});
