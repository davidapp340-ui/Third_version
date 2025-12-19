export interface DayProgressData {
  dayNumber: number;
  status: 'locked' | 'current' | 'completed';
  title: string;
  description: string;
  exercises: DayExercise[];
}

export interface DayExercise {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  description: string;
  videoUrl?: string;
  audioUrl?: string;
  mediaType: 'video' | 'audio' | 'interactive';
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  currentDay: number;
  totalDaysCompleted: number;
  consecutiveDays: number;
  avatarUrl?: string;
}

export interface ProgressTrackData {
  trackId: string;
  trackName: string;
  trackDescription: string;
  totalDays: number;
  currentDay: number;
  daysCompleted: number[];
  startedAt: string;
  completedAt?: string;
}
