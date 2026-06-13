import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Send, Mic } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { useVoiceInput } from '@/hooks';
import { useUserStore } from '@/store';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const { t } = useTranslation();
  const language = useUserStore((s) => s.language);

  const { supported: voiceSupported, listening, start, stop } = useVoiceInput((transcript) => {
    setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
  }, language);

  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleMicPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (listening) {
      stop();
    } else {
      start();
    }
  };

  const isSendDisabled = !message.trim() || isLoading || disabled;

  const defaultPlaceholder = placeholder || t('chat.placeholder');

  return (
    <View style={styles.container}>
      <View
        style={[styles.inputContainer, disabled && styles.inputContainerDisabled]}
      >
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={
            listening
              ? t('chat.listening')
              : disabled
              ? t('common.offline')
              : defaultPlaceholder
          }
          placeholderTextColor={disabled ? COLORS.textMuted : COLORS.textSecondary}
          multiline
          maxLength={500}
          editable={!disabled}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        {voiceSupported && !disabled && (
          <TouchableOpacity
            style={[styles.micButton, listening && styles.micButtonActive]}
            onPress={handleMicPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={listening ? t('chat.stop') : t('chat.voice')}
            accessibilityState={{ selected: listening }}
          >
            <Mic size={20} color={listening ? '#FFFFFF' : COLORS.textSecondary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.sendButton, isSendDisabled && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isSendDisabled}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
          accessibilityState={{ disabled: isSendDisabled }}
        >
          <Send
            size={20}
            color={isSendDisabled ? COLORS.textMuted : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingRight: SPACING.sm,
    minHeight: 48,
  },
  inputContainerDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    maxHeight: 120,
    fontFamily: 'Inter-Regular',
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  micButtonActive: {
    backgroundColor: COLORS.danger,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    marginRight: 4,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
});
