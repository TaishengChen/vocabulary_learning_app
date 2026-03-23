import type { Language } from '@/types/vocab'

const langMap: Record<Language, string> = {
  en: 'en-US',
  fi: 'fi-FI',
  es: 'es-ES',
}

export function speak(text: string, language: Language): void {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = langMap[language]

  const voices = window.speechSynthesis.getVoices()
  const match = voices.find((v) => v.lang.startsWith(langMap[language]))
  if (match) utterance.voice = match

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
