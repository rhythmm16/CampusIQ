import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { QUICK_ACTIONS } from '@/constants/campus';
import * as Haptics from 'expo-haptics';

interface QuickActionsProps {
  onActionPress: (query: string) => void;
}

export function QuickActions({ onActionPress }: QuickActionsProps) {
  const handlePress = (query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onActionPress(query);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {QUICK_ACTIONS.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.chip}
            onPress={() => handlePress(action.query)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipEmoji}>{action.emoji}</Text>
            <Text style={styles.chipText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
    gap: SPACING.xs,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
