# Progress Page Component Documentation

## Overview

The Progress Page component displays a child's 30-day learning journey with an interactive winding path design. When a day is tapped, a modal opens showing personalized information and a horizontal scrollable list of exercises for that day.

## Component Architecture

### File Structure

```
app/(tabs)/progress.tsx          - Main progress screen with 30-day path
components/DayDetailModal.tsx    - Modal showing day details and exercises
types/progress.ts                - TypeScript type definitions
lib/trackService.ts              - Data service for tracks and progress
lib/exercisesService.ts          - Data service for exercises
```

## Features

### 1. Main Progress Screen (`progress.tsx`)

**Visual Design:**
- Gradient header with progress bar
- Winding path layout with day buttons alternating left/right
- Three day states:
  - **Locked** (gray): Not yet accessible
  - **Current** (green with glow): Today's exercise
  - **Completed** (green with checkmark): Finished exercises
- Character icon showing current position
- Trophy celebration at day 30

**Functionality:**
- Loads child profile and progress from Supabase
- Displays 30-day track with proper access control
- Shows connecting lines between days
- Pull-to-refresh support
- Responsive touch targets optimized for children

**Accessibility:**
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast for visibility
- Large touch targets (64x64 minimum)

### 2. Day Detail Modal (`DayDetailModal.tsx`)

**Visual Design:**
- Slide-up modal animation
- Gradient header matching main screen
- Horizontal scrollable exercise cards
- Large, colorful exercise cards (70% screen width)
- Visual feedback with shadows and animations

**Content:**
- Day number (e.g., "Day 5 of 30")
- Personalized greeting: "Hello [child's name], what are we working on today?"
- Day theme and description
- Horizontal scrollable exercise list with:
  - Exercise number badge
  - Exercise title and description
  - Duration badge
  - Completion status
  - Play button
- "Start Training" button to begin first exercise

**Interactions:**
- Tap outside to close
- Tap X button to close
- Tap exercise card to view/start exercise
- Horizontal scroll with snap-to-card behavior
- Smooth slide animations

## Data Structure

### Database Integration

The component integrates with Supabase tables:

#### 1. Training Tracks (`training_tracks`)
```typescript
interface TrainingTrack {
  id: string;
  name: string;
  name_he: string;              // Hebrew name
  description: string;
  description_he: string;        // Hebrew description
  difficulty_level: number;
  total_days: number;            // Always 30
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}
```

#### 2. Track Days (`track_days`)
```typescript
interface TrackDay {
  id: string;
  track_id: string;
  day_number: number;            // 1-30
  title: string;
  title_he: string;
  description: string;
  description_he: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}
```

#### 3. User Track Progress (`user_track_progress`)
```typescript
interface UserTrackProgress {
  id: string;
  child_id: string;
  track_id: string;
  current_day: number;           // Current day (1-30)
  days_completed: number[];      // Array of completed day numbers
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
}
```

#### 4. Track Day Exercise Assignments (`track_day_exercise_assignments`)
```typescript
interface TrackDayExerciseAssignment {
  id: string;
  track_day_id: string;
  exercise_id_text: string;
  exercise_order: number;
  duration_override: number | null;  // Duration in seconds
  notes: string;
}
```

#### 5. Eye Exercises (`eye_exercises`)
```typescript
interface Exercise {
  id: string;
  exercise_name: string;
  icon: string;
  description: string;
  media_type: string;           // 'video', 'audio', 'interactive'
  video_link: string;
  audio_link: string;
  created_at: string;
  updated_at: string;
}
```

### Type Definitions (`types/progress.ts`)

Additional types for component state management:

```typescript
interface DayExercise {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  description: string;
  videoUrl?: string;
  audioUrl?: string;
  mediaType: 'video' | 'audio' | 'interactive';
}

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  currentDay: number;
  totalDaysCompleted: number;
  consecutiveDays: number;
  avatarUrl?: string;
}
```

## Key Functions

### Progress Screen Functions

#### `loadData()`
- Fetches current user and child profile
- Loads active track progress
- Retrieves all track days
- Updates component state

#### `handleDayPress(day: TrackDay)`
- Validates day accessibility
- Loads exercises for selected day
- Opens day detail modal
- Business logic:
  - Day 1 is always accessible
  - Other days require previous day completion
  - Current day accessible if previous completed
  - Completed days always accessible

#### `loadDayExercises(trackDayId: string)`
- Fetches exercise assignments for day
- Retrieves detailed exercise information
- Maps to modal-friendly format
- Handles loading errors gracefully

#### `getDayStatus(dayNumber: number)`
- Returns day state: 'locked', 'current', or 'completed'
- Used for styling and interaction logic

### Modal Functions

#### `onExercisePress(exerciseId: string)`
- Closes modal
- Navigates to exercise detail screen
- Passes exercise ID as parameter

## Mock Data Example

For development/testing without database:

```typescript
const mockProgressData = {
  child: {
    id: '123',
    name: 'Sarah',
    age: 8,
    currentDay: 5,
    totalDaysCompleted: 4,
    consecutiveDays: 4,
  },
  track: {
    trackId: 'track-1',
    trackName: '30-Day Vision Training',
    trackDescription: 'Complete daily exercises to strengthen eye muscles',
    totalDays: 30,
    currentDay: 5,
    daysCompleted: [1, 2, 3, 4],
    startedAt: '2024-01-01',
  },
  dayExercises: {
    5: [
      {
        id: 'ex-1',
        title: 'Eye Tracking',
        duration: '5 minutes',
        isCompleted: false,
        description: 'Follow the moving object with your eyes',
        mediaType: 'video',
      },
      {
        id: 'ex-2',
        title: 'Focus Practice',
        duration: '3 minutes',
        isCompleted: false,
        description: 'Switch focus between near and far objects',
        mediaType: 'interactive',
      },
      {
        id: 'ex-3',
        title: 'Relaxation',
        duration: '2 minutes',
        isCompleted: false,
        description: 'Gentle eye relaxation exercises',
        mediaType: 'audio',
      },
    ],
  },
};
```

## Styling Guidelines

### Color Scheme
- Primary Green: `#4FFFB0` (completed, success)
- Primary Yellow-Green: `#B4FF39` (current day, active)
- Background: `#F5F5F5` (light gray)
- Text Primary: `#1A1A1A` (dark gray)
- Text Secondary: `#666666` (medium gray)
- Locked State: `#E5E5EA` (light gray)

### Spacing System (8px base)
- Extra Small: 8px
- Small: 12px
- Medium: 16px
- Large: 20px
- Extra Large: 24px
- XXL: 32px

### Typography
- Title: 32px, bold
- Section Title: 24px, bold
- Body Large: 18px
- Body: 16px
- Body Small: 14px

### Touch Targets
- Minimum: 44x44 points (iOS guidelines)
- Day buttons: 64x64 points (extra large for children)
- Icon buttons: 44x44 points

## Accessibility Features

### Screen Reader Support
- Descriptive labels for all interactive elements
- Status announcements for state changes
- Clear hierarchy with proper heading levels

### Keyboard Navigation
- Tab order follows visual flow
- Enter/Space activates buttons
- Escape closes modal

### Visual Accessibility
- High contrast ratios (4.5:1 minimum)
- Large text sizes
- Color not used as only indicator
- Clear focus indicators

## Performance Optimizations

### Loading Strategy
- Initial load shows skeleton/loading state
- Progressive data loading
- Pull-to-refresh for manual updates

### Memory Management
- Modal content lazy-loaded
- Exercise details fetched on-demand
- Images loaded with appropriate sizes

### Smooth Animations
- Hardware-accelerated transforms
- 60fps target for all animations
- Reduced motion support

## Future Enhancements

### Potential Features
1. **Offline Support**: Cache progress data locally
2. **Achievements**: Badges for milestones (7-day streak, etc.)
3. **Parent Insights**: Weekly progress reports
4. **Customization**: Choose character avatar
5. **Social Features**: Share progress with family
6. **Reminders**: Daily practice notifications
7. **Multi-language**: Support multiple languages beyond Hebrew

### API Integration Points
- Real-time progress sync
- Analytics tracking
- Video streaming
- Push notifications

## Testing Considerations

### Unit Tests
- Day status calculation logic
- Access control validation
- Data transformation functions

### Integration Tests
- Database query correctness
- Modal open/close flow
- Navigation between screens

### User Testing
- Child usability (ages 6-12)
- Touch target accessibility
- Visual appeal and engagement
- Performance on target devices

## Maintenance Notes

### Regular Tasks
- Update exercise content
- Monitor completion rates
- Analyze drop-off points
- Optimize loading times

### Known Limitations
- Requires active internet connection
- 30-day track limit (can extend with new tracks)
- Hebrew text requires RTL support

## Support and Troubleshooting

### Common Issues

**Modal not opening:**
- Check day accessibility logic
- Verify exercise data exists for day
- Console log for API errors

**Progress not saving:**
- Verify Supabase connection
- Check RLS policies
- Validate user authentication

**Styling issues:**
- Ensure React Native styles (not web CSS)
- Test on multiple screen sizes
- Check for RTL text rendering

### Debug Mode
Enable detailed logging:
```typescript
const DEBUG = true;

if (DEBUG) {
  console.log('Progress data:', progress);
  console.log('Selected day:', selectedDay);
  console.log('Day exercises:', dayExercises);
}
```

## Credits and License

Built with:
- React Native + Expo
- Supabase (Database & Auth)
- TypeScript
- Lucide Icons

Follows accessibility guidelines:
- WCAG 2.1 Level AA
- iOS Human Interface Guidelines
- Material Design (Android)
