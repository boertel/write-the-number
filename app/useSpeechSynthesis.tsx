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

  useEffect(() => {
    setHasSpeech(!!window.speechSynthesis);
  }, []);

  useEffect(() => {
    const voices = window.speechSynthesis.getVoices();
    voice.current =
      voices.find((v) => {
        return lang === v.lang && name === v.name;
      }) || null;
  }, [lang, name]);

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
