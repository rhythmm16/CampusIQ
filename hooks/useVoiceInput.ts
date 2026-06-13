import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { LanguageCode } from '@/store/userStore';

const LOCALE_MAP: Record<LanguageCode, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  pa: 'pa-IN',
};

interface UseVoiceInputResult {
  supported: boolean;
  listening: boolean;
  start: () => void;
  stop: () => void;
}

/**
 * Speech-to-text using Web Speech API (works on web only).
 * For native mobile apps, this requires a custom development build with expo-speech-recognition.
 * In Expo Go, the mic button is hidden on mobile.
 */
export function useVoiceInput(
  onResult: (transcript: string) => void,
  language: LanguageCode = 'en'
): UseVoiceInputResult {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Web Speech Recognition (only works on web)
  const getWebRecognition = useCallback(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return SpeechRecognition ? new SpeechRecognition() : null;
  }, []);

  // Only supported on web (Expo Go doesn't support native STT)
  const supported = Platform.OS === 'web' && !!getWebRecognition();

  const start = useCallback(() => {
    const recognition = getWebRecognition();
    if (!recognition) return;

    recognition.lang = LOCALE_MAP[language] ?? 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        onResult(transcript);
      }
    };
    
    recognition.onend = () => setListening(false);
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [getWebRecognition, language, onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop?.();
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
    };
  }, []);

  return { supported, listening, start, stop };
}

