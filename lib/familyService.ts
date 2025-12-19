import { supabase } from './supabase';
import { Child } from '@/types/zoomi';

// שליפת כל הילדים של משפחה מסוימת
export async function getFamilyChildren(familyId: string): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// יצירת ילד מקושר חדש (ע"י הורה)
export async function createLinkedChild(familyId: string, name: string): Promise<Child> {
  // 1. יצירת הרשומה בטבלת הילדים
  // הטריגר ב-SQL ידאג אוטומטית לשייך לו מסלול אימון!
  const { data, error } = await supabase
    .from('children')
    .insert({
      family_id: familyId,
      name: name,
      user_id: null // זהו ילד מקושר, אין לו יוזר משלו
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// מחיקת ילד
export async function deleteChild(childId: string) {
  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', childId);

  if (error) throw error;
}