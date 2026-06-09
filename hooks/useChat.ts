import { useState, useCallback } from 'react';
import { useChatStore, useUserStore } from '@/store';
import { offlineCache } from '@/services/offlineCache';
import { ChatResponse } from '@/types';

export function useChat() {
  const {
    messages,
    isLoading,
    sendMessage,
    clearHistory,
    isConnected,
    sessionId,
    getAIMockResponse,
  } = useChatStore();

  const { accessibilityProfile, deviceId } = useUserStore();

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      await sendMessage(content);
    },
    [sendMessage]
  );

  const handleClearHistory = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  return {
    messages,
    isLoading,
    isConnected,
    sessionId,
    sendMessage: handleSendMessage,
    clearHistory: handleClearHistory,
  };
}
