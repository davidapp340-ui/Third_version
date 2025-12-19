import { supabase } from './supabase';

export interface TextData {
  [key: string]: string;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
}

let cachedTexts: TextData | null = null;
let cachedLanguageCode: string | null = null;

export async function getActiveLanguages(): Promise<Language[]> {
  const { data, error } = await supabase
    .from('languages')
    .select('*')
    .eq('is_active', true)
    .order('is_default', { ascending: false });

  if (error) {
    console.error('Error fetching languages:', error);
    return [];
  }

  return data || [];
}

export async function getDefaultLanguage(): Promise<Language | null> {
  const { data, error } = await supabase
    .from('languages')
    .select('*')
    .eq('is_default', true)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching default language:', error);
    return null;
  }

  return data;
}

export async function getAllTexts(languageCode: string = 'he'): Promise<TextData> {
  if (cachedTexts && cachedLanguageCode === languageCode) {
    return cachedTexts;
  }

  const { data, error } = await supabase
    .from('texts')
    .select(`
      value,
      text_keys!inner(key),
      languages!inner(code)
    `)
    .eq('languages.code', languageCode)
    .eq('languages.is_active', true);

  if (error) {
    console.error('Error fetching texts:', error);
    return {};
  }

  const textMap: TextData = {};
  data?.forEach((item: any) => {
    textMap[item.text_keys.key] = item.value;
  });

  cachedTexts = textMap;
  cachedLanguageCode = languageCode;

  return textMap;
}

export async function getTextsByScreen(
  screen: string,
  languageCode: string = 'he'
): Promise<TextData> {
  const { data, error } = await supabase
    .from('texts')
    .select(`
      value,
      text_keys!inner(key, screen),
      languages!inner(code)
    `)
    .eq('text_keys.screen', screen)
    .eq('languages.code', languageCode)
    .eq('languages.is_active', true);

  if (error) {
    console.error(`Error fetching texts for screen ${screen}:`, error);
    return {};
  }

  const textMap: TextData = {};
  data?.forEach((item: any) => {
    textMap[item.text_keys.key] = item.value;
  });

  return textMap;
}

export async function getText(
  key: string,
  languageCode: string = 'he'
): Promise<string> {
  const { data, error } = await supabase
    .from('texts')
    .select(`
      value,
      text_keys!inner(key),
      languages!inner(code)
    `)
    .eq('text_keys.key', key)
    .eq('languages.code', languageCode)
    .eq('languages.is_active', true)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching text for key ${key}:`, error);
    return key;
  }

  return data?.value || key;
}

export function clearTextCache(): void {
  cachedTexts = null;
  cachedLanguageCode = null;
}

export function setupRealtimeTextUpdates(
  languageCode: string,
  onUpdate: (texts: TextData) => void
): (() => void) {
  const channel = supabase
    .channel('text-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'texts',
      },
      async () => {
        clearTextCache();
        const updatedTexts = await getAllTexts(languageCode);
        onUpdate(updatedTexts);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
