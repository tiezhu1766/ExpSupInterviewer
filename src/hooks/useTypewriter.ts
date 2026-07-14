import { useState, useEffect } from 'react';

export function useTypewriter(text: string, speed = 20, enabled = true): string {
  const [displayed, setDisplayed] = useState(enabled ? '' : text);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      return;
    }

    setDisplayed('');
    if (!text) return;

    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, enabled]);

  return displayed;
}
