import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

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
  placeholder = 'Ask about campus navigation...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const isSendDisabled = !message.trim() || isLoading || disabled;

  return (
    <View style={styles.container}>
      <View
        style={[styles.inputContainer, disabled && styles.inputContainerDisabled]}
      >
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={disabled ? 'Offline mode - limited functionality' : placeholder}
          placeholderTextColor={disabled ? COLORS.textMuted : COLORS.textSecondary}
          multiline
          maxLength={500}
          editable={!disabled}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        <TouchableOpacity
          style={[styles.sendButton, isSendDisabled && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isSendDisabled}
          activeOpacity={0.7}
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
    fontFamily: 'Inter_400Regular',
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
