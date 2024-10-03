import { useState, useEffect, useCallback, useRef } from "react";

export function useSpeechSynthesis({
  lang,
  name,
}: {
  lang: string;
  name?: string;
}) {
  const [hasSpeech, setHasSpeech] = useState<boolean>(false);
  const voice = useRef<SpeechSynthesisVoice | null>(null);

  const onVoicesChanged = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    const voicesForLang = voices.filter((v) => v.lang === lang);
    voice.current =
      voicesForLang.find((v) => name === v.name) || voicesForLang[0];
    setHasSpeech(true);
  }, [lang, name]);

  useEffect(() => {
    if (!!window.speechSynthesis) {
      onVoicesChanged();
      window.speechSynthesis.onvoiceschanged = onVoicesChanged;
    }
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [onVoicesChanged]);

  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice.current;
    window.speechSynthesis.speak(utterance);
  }, []);

  return {
    speak,
    hasSpeech,
  };
}
