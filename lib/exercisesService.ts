import { supabase } from './supabase';

export interface Exercise {
  id: string;
  exercise_name: string;
  icon: string;
  description: string;
  media_type: string;
  video_link: string;
  audio_link: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseGalleryItem {
  id: string;
  category: string;
  color: string;
  display: boolean;
  display_order: number | null;
  created_at: string;
  updated_at: string;
  exercise_name?: string;
  media_type?: string;
}

export interface CategoryGroup {
  category: string;
  color: string;
  exercises: ExerciseGalleryItem[];
}

export async function getVisibleExercises(): Promise<ExerciseGalleryItem[]> {
  try {
    const { data, error } = await supabase
      .from('exercises_gallery')
      .select(`
        id,
        category,
        color,
        display,
        display_order,
        created_at,
        updated_at,
        eye_exercises (
          exercise_name,
          media_type
        )
      `)
      .eq('display', true)
      .order('category', { ascending: true })
      .order('display_order', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching visible exercises:', error);
      throw error;
    }

    const exercises = data?.map((item: any) => ({
      id: item.id,
      category: item.category,
      color: item.color,
      display: item.display,
      display_order: item.display_order,
      created_at: item.created_at,
      updated_at: item.updated_at,
      exercise_name: item.eye_exercises?.exercise_name || '',
      media_type: item.eye_exercises?.media_type || '',
    })) || [];

    return exercises;
  } catch (error) {
    console.error('Failed to fetch visible exercises:', error);
    return [];
  }
}

export async function getExercisesByCategory(): Promise<CategoryGroup[]> {
  try {
    const exercises = await getVisibleExercises();

    const categoryMap = new Map<string, CategoryGroup>();

    exercises.forEach((exercise) => {
      if (!categoryMap.has(exercise.category)) {
        categoryMap.set(exercise.category, {
          category: exercise.category,
          color: exercise.color,
          exercises: [],
        });
      }

      categoryMap.get(exercise.category)?.exercises.push(exercise);
    });

    return Array.from(categoryMap.values());
  } catch (error) {
    console.error('Failed to group exercises by category:', error);
    return [];
  }
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  try {
    const { data, error } = await supabase
      .from('eye_exercises')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching exercise by ID:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch exercise:', error);
    return null;
  }
}

export async function getAllExercises(): Promise<Exercise[]> {
  try {
    const { data, error } = await supabase
      .from('eye_exercises')
      .select('*')
      .order('exercise_name', { ascending: true });

    if (error) {
      console.error('Error fetching all exercises:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch all exercises:', error);
    return [];
  }
}
