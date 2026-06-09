import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Image, ScrollView, TouchableOpacity, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useChatStore, useUserStore, useMapStore } from '@/store';
import { useChat } from '@/hooks';
import { ChatBubble, ChatInput, TypingIndicator, QuickActions } from '@/components/chat';
import { OfflineBanner, EventBanner, AccessibilityProfileModal } from '@/components/ui';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/colors';
import { SAMPLE_EVENTS, BUILDINGS } from '@/constants/campus';
import { Settings, Accessibility } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function ChatScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const { messages, isLoading, sendMessage, isConnected, sessionId } = useChat();
  const { accessibilityProfile, hasCompletedOnboarding } = useUserStore();
  const { events, activeRoute } = useMapStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [hasCompletedOnboarding]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const handleProfilePress = () => {
    setShowProfileModal(true);
  };

  const hasActiveAccessibilityNeeds =
    accessibilityProfile.wheelchair ||
    accessibilityProfile.elevator_required ||
    accessibilityProfile.avoid_stairs;

  const renderWelcomeState = () => (
    <View style={styles.welcomeContainer}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.welcomeContent}>
        <Text style={styles.welcomeEmoji}>🗺️</Text>
        <Text style={styles.welcomeTitle}>Hi! I'm CampusWay AI</Text>
        <Text style={styles.welcomeText}>
          Ask me anything about navigating the campus, finding buildings, or getting directions.
        </Text>
      </Animated.View>
    </View>
  );

  const renderMessage = ({ item, index }: { item: typeof messages[0]; index: number }) => (
    <ChatBubble message={item} />
  );

  const renderTypingIndicator = () => {
    if (!isLoading) return null;
    return <TypingIndicator />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>CampusWay AI</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, isConnected ? styles.online : styles.offline]} />
              <Text style={styles.statusText}>{isConnected ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {hasActiveAccessibilityNeeds && (
              <TouchableOpacity style={styles.a11yIndicator} onPress={handleProfilePress}>
                <Accessibility size={18} color={COLORS.accent} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.settingsButton} onPress={handleProfilePress}>
              <Settings size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <EventBanner events={SAMPLE_EVENTS.filter(e => e.is_active)} />

        <OfflineBanner isVisible={!isConnected} />

        {messages.length === 0 ? (
          renderWelcomeState()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
            ListFooterComponent={renderTypingIndicator}
          />
        )}

        {messages.length === 0 && <QuickActions onActionPress={handleSendMessage} />}

        <View style={styles.bottomBar}>
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={!isConnected && !isLoading}
          />
        </View>
      </KeyboardAvoidingView>

      <AccessibilityProfileModal
        visible={showOnboarding || showProfileModal}
        onClose={() => {
          setShowOnboarding(false);
          setShowProfileModal(false);
        }}
        isOnboarding={showOnboarding}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Inter-Bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  online: {
    backgroundColor: COLORS.accent,
  },
  offline: {
    backgroundColor: COLORS.textMuted,
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  a11yIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  welcomeTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
  },
  welcomeText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  bottomBar: {
    backgroundColor: COLORS.card,
  },
});
