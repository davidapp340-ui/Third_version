import type { TrainingTrack, TrackDay, UserTrackProgress } from './trackService';
import type { DayExercise } from '@/types/progress';

export const mockChild = {
  id: 'child-123',
  family_id: 'family-456',
  user_id: 'user-789',
  name: 'שרה',
  age: 8,
  avatar_url: null,
  linking_code: 'ABC123',
  is_linked: true,
  linked_at: '2024-01-01T10:00:00Z',
  current_step: 5,
  total_steps: 30,
  consecutive_days: 4,
  last_practice_date: '2024-01-04',
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-04T10:00:00Z',
};

export const mockTrack: TrainingTrack = {
  id: 'track-001',
  name: '30-Day Vision Training',
  name_he: 'מסלול אימון ראייה ל-30 יום',
  description: 'Complete daily eye exercises to strengthen vision and eye coordination',
  description_he: 'השלם תרגילי עיניים יומיים לחיזוק הראייה ותיאום עיניים',
  difficulty_level: 1,
  total_days: 30,
  is_active: true,
  display_order: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockTrackDays: TrackDay[] = Array.from({ length: 30 }, (_, i) => ({
  id: `day-${String(i + 1).padStart(3, '0')}`,
  track_id: 'track-001',
  day_number: i + 1,
  title: `Day ${i + 1} Training`,
  title_he: `אימון יום ${i + 1}`,
  description: `Complete today's exercises to progress`,
  description_he: `השלם את התרגילים של היום כדי להתקדם`,
  is_locked: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}));

export const mockUserProgress: UserTrackProgress = {
  id: 'progress-001',
  child_id: 'child-123',
  track_id: 'track-001',
  current_day: 5,
  days_completed: [1, 2, 3, 4],
  started_at: '2024-01-01T10:00:00Z',
  last_activity_at: '2024-01-04T15:30:00Z',
  completed_at: null,
};

export const mockExercisesDay1: DayExercise[] = [
  {
    id: 'ex-001',
    title: 'Eye Tracking - Horizontal',
    duration: '5 דקות',
    isCompleted: true,
    description: 'Follow the moving object from left to right with your eyes',
    videoUrl: 'https://example.com/video1.mp4',
    mediaType: 'video',
  },
  {
    id: 'ex-002',
    title: 'Focus Practice - Near & Far',
    duration: '3 דקות',
    isCompleted: true,
    description: 'Alternate focus between a near object and a far object',
    videoUrl: 'https://example.com/video2.mp4',
    mediaType: 'video',
  },
  {
    id: 'ex-003',
    title: 'Eye Relaxation',
    duration: '2 דקות',
    isCompleted: true,
    description: 'Gently massage around your eyes and relax',
    audioUrl: 'https://example.com/audio1.mp3',
    mediaType: 'audio',
  },
];

export const mockExercisesDay5: DayExercise[] = [
  {
    id: 'ex-013',
    title: 'Circular Eye Movement',
    duration: '4 דקות',
    isCompleted: false,
    description: 'Move your eyes in a circular motion, clockwise then counter-clockwise',
    videoUrl: 'https://example.com/video5.mp4',
    mediaType: 'video',
  },
  {
    id: 'ex-014',
    title: 'Peripheral Vision Exercise',
    duration: '5 דקות',
    isCompleted: false,
    description: 'Focus on center while being aware of objects in peripheral vision',
    mediaType: 'interactive',
  },
  {
    id: 'ex-015',
    title: 'Blink & Refresh',
    duration: '3 דקות',
    isCompleted: false,
    description: 'Practice proper blinking technique to keep eyes moist',
    videoUrl: 'https://example.com/video6.mp4',
    mediaType: 'video',
  },
  {
    id: 'ex-016',
    title: 'Eye Yoga',
    duration: '3 דקות',
    isCompleted: false,
    description: 'Gentle stretching exercises for eye muscles',
    audioUrl: 'https://example.com/audio2.mp3',
    mediaType: 'audio',
  },
];

export const mockExercisesByDay = new Map<number, DayExercise[]>([
  [1, mockExercisesDay1],
  [5, mockExercisesDay5],
  [2, [
    {
      id: 'ex-004',
      title: 'Eye Tracking - Vertical',
      duration: '5 דקות',
      isCompleted: true,
      description: 'Follow the moving object up and down',
      videoUrl: 'https://example.com/video3.mp4',
      mediaType: 'video',
    },
    {
      id: 'ex-005',
      title: 'Convergence Training',
      duration: '4 דקות',
      isCompleted: true,
      description: 'Practice bringing both eyes to focus on near object',
      mediaType: 'interactive',
    },
  ]],
  [3, [
    {
      id: 'ex-007',
      title: 'Figure-8 Tracking',
      duration: '5 דקות',
      isCompleted: true,
      description: 'Trace a figure-8 pattern with your eyes',
      videoUrl: 'https://example.com/video4.mp4',
      mediaType: 'video',
    },
    {
      id: 'ex-008',
      title: 'Depth Perception',
      duration: '4 דקות',
      isCompleted: true,
      description: 'Judge distances between objects',
      mediaType: 'interactive',
    },
    {
      id: 'ex-009',
      title: 'Palming Relaxation',
      duration: '2 דקות',
      isCompleted: true,
      description: 'Cover eyes with palms and relax',
      audioUrl: 'https://example.com/audio3.mp3',
      mediaType: 'audio',
    },
  ]],
  [4, [
    {
      id: 'ex-010',
      title: 'Diagonal Eye Movement',
      duration: '5 דקות',
      isCompleted: true,
      description: 'Move eyes diagonally across field of vision',
      videoUrl: 'https://example.com/video5.mp4',
      mediaType: 'video',
    },
    {
      id: 'ex-011',
      title: 'Speed Reading Prep',
      duration: '4 דקות',
      isCompleted: true,
      description: 'Quick saccadic movements between points',
      mediaType: 'interactive',
    },
    {
      id: 'ex-012',
      title: 'Color Recognition',
      duration: '3 דקות',
      isCompleted: true,
      description: 'Identify colors in peripheral vision',
      mediaType: 'interactive',
    },
  ]],
]);

export function getMockExercisesForDay(dayNumber: number): DayExercise[] {
  const exercises = mockExercisesByDay.get(dayNumber);

  if (exercises) {
    return exercises;
  }

  return [
    {
      id: `ex-day${dayNumber}-1`,
      title: `תרגיל 1 - יום ${dayNumber}`,
      duration: '5 דקות',
      isCompleted: dayNumber <= mockUserProgress.days_completed.length,
      description: 'תרגיל מותאם אישית ליום זה',
      mediaType: 'video',
    },
    {
      id: `ex-day${dayNumber}-2`,
      title: `תרגיל 2 - יום ${dayNumber}`,
      duration: '4 דקות',
      isCompleted: dayNumber <= mockUserProgress.days_completed.length,
      description: 'תרגיל נוסף לחיזוק הראייה',
      mediaType: 'interactive',
    },
    {
      id: `ex-day${dayNumber}-3`,
      title: `תרגיל 3 - יום ${dayNumber}`,
      duration: '3 דקות',
      isCompleted: dayNumber <= mockUserProgress.days_completed.length,
      description: 'תרגיל הרפיה וסיום',
      audioUrl: 'https://example.com/audio-generic.mp3',
      mediaType: 'audio',
    },
  ];
}

export const mockData = {
  child: mockChild,
  track: mockTrack,
  trackDays: mockTrackDays,
  userProgress: mockUserProgress,
  getExercisesForDay: getMockExercisesForDay,
};
