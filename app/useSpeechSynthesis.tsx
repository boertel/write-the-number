import { useState, useEffect, useCallback, useRef } from "react";

export function useSpeechSynthesis({
  lang,
  name,
}: {
  lang: string;
  name: string;
}) {
  const [hasSpeech, setHasSpeech] = useState<boolean>(false);
  const voice = useRef<SpeechSynthesisVoice | null>(null);

  const onVoicesChanged = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    voice.current =
      voices.find((v) => lang === v.lang && name === v.name) || null;
    setHasSpeech(true);
  }, [lang, name]);

  useEffect(() => {
    if (!!window.speechSynthesis) {
      onVoicesChanged();
      window.speechSynthesis.onvoiceschanged = function () {
        onVoicesChanged;
      };
      return () => (window.speechSynthesis.onvoiceschanged = null);
    }
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
