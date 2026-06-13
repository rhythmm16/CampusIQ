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
 * Speech-to-text via the Web Speech API on web. On native (Expo Go) there is no
 * built-in STT, so `supported` is false and callers should fall back to typing
 * (or post audio to the backend Whisper endpoint in a dev build).
 */
export function useVoiceInput(
  onResult: (transcript: string) => void,
  language: LanguageCode = 'en'
): UseVoiceInputResult {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const getRecognition = useCallback(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return SpeechRecognition ? new SpeechRecognition() : null;
  }, []);

  const supported = Platform.OS === 'web' && !!getRecognition();

  const start = useCallback(() => {
    const recognition = getRecognition();
    if (!recognition) return;

    recognition.lang = LOCALE_MAP[language] ?? 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [getRecognition, language, onResult]);

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
