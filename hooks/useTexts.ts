import { useState, useEffect } from 'react';
import { getAllTexts, getTextsByScreen, setupRealtimeTextUpdates, TextData } from '@/lib/textService';

export function useTexts(languageCode: string = 'he') {
  const [texts, setTexts] = useState<TextData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function loadTexts() {
      try {
        setLoading(true);
        const fetchedTexts = await getAllTexts(languageCode);
        setTexts(fetchedTexts);
        setError(null);

        unsubscribe = setupRealtimeTextUpdates(languageCode, (updatedTexts) => {
          setTexts(updatedTexts);
        });
      } catch (err) {
        console.error('Error loading texts:', err);
        setError('Failed to load texts');
      } finally {
        setLoading(false);
      }
    }

    loadTexts();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [languageCode]);

  const getText = (key: string, fallback?: string): string => {
    return texts[key] || fallback || key;
  };

  return { texts, loading, error, getText };
}

export function useScreenTexts(screen: string, languageCode: string = 'he') {
  const [texts, setTexts] = useState<TextData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTexts() {
      try {
        setLoading(true);
        const fetchedTexts = await getTextsByScreen(screen, languageCode);
        setTexts(fetchedTexts);
        setError(null);
      } catch (err) {
        console.error(`Error loading texts for screen ${screen}:`, err);
        setError(`Failed to load texts for ${screen}`);
      } finally {
        setLoading(false);
      }
    }

    loadTexts();
  }, [screen, languageCode]);

  const getText = (key: string, fallback?: string): string => {
    return texts[key] || fallback || key;
  };

  return { texts, loading, error, getText };
}
