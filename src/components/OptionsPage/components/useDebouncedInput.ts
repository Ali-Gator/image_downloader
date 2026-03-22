import { ChangeEvent, useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 300;

/**
 * Local state + debounce for text inputs backed by async storage (chrome.storage).
 * Prevents flickering caused by storage change events arriving out of order during fast typing.
 */
export function useDebouncedInput(
  storeValue: string,
  setStoreValue: (value: string) => void,
) {
  const [localValue, setLocalValue] = useState(storeValue);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);

  // Sync store → local only when not actively typing (e.g. reset or external change)
  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalValue(storeValue);
    }
  }, [storeValue]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    isTypingRef.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStoreValue(value);
      isTypingRef.current = false;
    }, DEBOUNCE_MS);
  };

  return { value: localValue, onChange: handleChange };
}
