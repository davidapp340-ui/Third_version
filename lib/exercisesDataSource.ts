/**
 * Exercises Data Source Configuration
 *
 * This file contains the Google Sheets URL that serves as the single source of truth
 * for exercise data. Update this URL if the data source changes.
 */

// Google Sheets configuration
const GOOGLE_SHEETS_CONFIG = {
  // Original edit URL (for reference)
  editUrl: 'https://docs.google.com/spreadsheets/d/1LBrZ_qRTsD0caYtnU1R6MOGjgALrPqADhtyd-fVVVig/edit?usp=sharing',

  // Sheet ID extracted from the URL
  sheetId: '1LBrZ_qRTsD0caYtnU1R6MOGjgALrPqADhtyd-fVVVig',

  // GID for specific sheets (0 is the first sheet by default)
  // Add more GIDs if you have multiple sheets/tabs
  gids: {
    exercises: '0', // Main exercises sheet
    gallery: '0',   // Gallery configuration (update if on different tab)
  }
};

/**
 * Get CSV export URL for a specific sheet
 */
export function getSheetCsvUrl(sheetType: 'exercises' | 'gallery' = 'exercises'): string {
  const gid = GOOGLE_SHEETS_CONFIG.gids[sheetType];
  return `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Fetch CSV data from Google Sheets
 */
export async function fetchSheetData(sheetType: 'exercises' | 'gallery' = 'exercises'): Promise<string> {
  try {
    const url = getSheetCsvUrl(sheetType);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet data: ${response.status} ${response.statusText}`);
    }

    const csvData = await response.text();
    return csvData;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

/**
 * Parse CSV data into structured format
 */
export function parseCsvData(csvData: string): Record<string, string>[] {
  const lines = csvData.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    return [];
  }

  // First line is headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  // Parse remaining lines
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }

  return data;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last value
  values.push(current.trim());

  return values;
}

/**
 * Interface for parsed exercise data from Google Sheets
 * Matches the actual database schema for eye_exercises and exercises_gallery
 */
export interface ExerciseSheetData {
  id: string;
  exercise_name: string;
  icon?: string;
  description?: string;
  media_type?: string;
  video_link?: string;
  audio_link?: string;
  // Gallery-specific fields
  category?: string;
  color?: string;
  display?: boolean;
  display_order?: number;
}

/**
 * Fetch and parse exercise data from Google Sheets
 */
export async function fetchExercisesData(): Promise<ExerciseSheetData[]> {
  try {
    const csvData = await fetchSheetData('exercises');
    const parsedData = parseCsvData(csvData);

    // Transform to ExerciseSheetData format
    return parsedData.map(row => ({
      id: row.id || row.ID || '',
      exercise_name: row.exercise_name || row['Exercise Name'] || row['exercise name'] || '',
      icon: row.icon || row.Icon || '',
      description: row.description || row.Description || '',
      media_type: row.media_type || row['Media Type'] || row['media type'] || 'Video',
      video_link: row.video_link || row['Video Link'] || row['video link'] || '',
      audio_link: row.audio_link || row['Audio Link'] || row['audio link'] || '',
      category: row.category || row.Category || '',
      color: row.color || row.Color || '',
      display: row.display !== undefined ? (row.display === 'true' || row.display === 'TRUE' || row.display === '1') : true,
      display_order: row.display_order ? parseInt(row.display_order) : row.display_order ? parseInt(row['Display Order']) : undefined,
    }));
  } catch (error) {
    console.error('Error fetching exercises data:', error);
    throw error;
  }
}

/**
 * Get the original Google Sheets edit URL
 */
export function getSheetEditUrl(): string {
  return GOOGLE_SHEETS_CONFIG.editUrl;
}

/**
 * Configuration object export for easy access
 */
export const EXERCISES_DATA_SOURCE = {
  config: GOOGLE_SHEETS_CONFIG,
  getSheetCsvUrl,
  fetchSheetData,
  parseCsvData,
  fetchExercisesData,
  getSheetEditUrl,
};
