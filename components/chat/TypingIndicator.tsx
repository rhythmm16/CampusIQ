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
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/colors';

export function TypingIndicator() {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);

  useEffect(() => {
    const animateDot = (value: Animated.SharedValue<number>, delay: number) => {
      value.value = withDelay(
        delay,
        withRepeat(
          withSequence(withTiming(1.4, { duration: 150 }), withTiming(1, { duration: 150 })),
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
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Animated.Text style={styles.avatarText}>CW</Animated.Text>
      </View>

      <View style={styles.bubble}>
        <Animated.View style={[styles.dot, animatedStyle1]} />
        <Animated.View style={[styles.dot, animatedStyle2]} />
        <Animated.View style={[styles.dot, animatedStyle3]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: '#F1F5F9',
    borderRadius: BORDER_RADIUS.xl,
    borderBottomLeftRadius: BORDER_RADIUS.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
