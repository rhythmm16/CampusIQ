import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Message } from '@/types';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { RouteCard } from './RouteCard';

interface ChatBubbleProps {
  message: Message;
  showAvatar?: boolean;
}

export function ChatBubble({ message, showAvatar = true }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const formattedTime = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      style={[
        styles.container,
        isUser ? styles.containerUser : styles.containerAI,
      ]}
    >
      {!isUser && showAvatar && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>CW</Text>
        </View>
      )}

      <View style={styles.bubbleContainer}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAI,
          ]}
        >
          <Text
            style={[styles.messageText, isUser && styles.messageTextUser]}
          >
            {message.content}
          </Text>
        </View>

        {message.route_data && (
          <RouteCard routeData={message.route_data} />
        )}

        <Text
          style={[
            styles.timestamp,
            isUser ? styles.timestampUser : styles.timestampAI,
          ]}
        >
          {formattedTime}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  containerUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  containerAI: {
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
    marginBottom: SPACING.xs,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  bubbleContainer: {
    flexShrink: 1,
  },
  bubble: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    maxWidth: '100%',
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.sm,
  },
  bubbleAI: {
    backgroundColor: '#F1F5F9',
    borderRadius: BORDER_RADIUS.xl,
    borderBottomLeftRadius: BORDER_RADIUS.sm,
  },
  messageText: {
    fontSize: FONT_SIZE.base,
    lineHeight: 22,
    color: COLORS.textPrimary,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  timestampUser: {
    textAlign: 'right',
  },
  timestampAI: {
    marginLeft: SPACING.xs,
  },
});
