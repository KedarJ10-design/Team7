'use client';

import { useState, useEffect } from 'react';

/**
 * useFormDraft Hook
 * Automatically persists and restores form draft states to localStorage
 * so that mobile app switching or browser refresh does not discard user input.
 */
export function useFormDraft<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void, () => void, boolean] {
  const [data, setData] = useState<T>(initialValue);
  const [hasRestored, setHasRestored] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tgt_draft_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed !== null && parsed !== undefined) {
          setData(parsed);
          setHasRestored(true);
        }
      }
    } catch (e) {
      console.debug('Failed to read draft from localStorage', e);
    }
  }, [key]);

  const updateDraft = (val: T | ((prev: T) => T)) => {
    setData((prev) => {
      const nextVal = typeof val === 'function' ? (val as (prev: T) => T)(prev) : val;
      try {
        localStorage.setItem(`tgt_draft_${key}`, JSON.stringify(nextVal));
      } catch (e) {
        console.debug('Failed to save draft to localStorage', e);
      }
      return nextVal;
    });
  };

  const clearDraft = () => {
    setData(initialValue);
    setHasRestored(false);
    try {
      localStorage.removeItem(`tgt_draft_${key}`);
    } catch (e) {
      console.debug('Failed to clear draft from localStorage', e);
    }
  };

  return [data, updateDraft, clearDraft, hasRestored];
}
