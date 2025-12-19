# Progress Page Usage Guide

## Quick Start

The Progress Page is already integrated into your app at `app/(tabs)/progress.tsx`. It automatically loads data from Supabase and displays the child's 30-day learning journey.

## Basic Usage

### 1. Viewing Progress

Navigate to the Progress tab in your app. The screen will:
- Show the child's current position in the 30-day journey
- Display completed days with green checkmarks
- Highlight the current day with a glowing green effect
- Lock future days until previous days are completed

### 2. Interacting with Days

**Tap any accessible day** (completed or current) to:
- Open the Day Detail Modal
- See personalized greeting with child's name
- View all exercises for that day
- Start training immediately

**Locked days** (gray) cannot be tapped until:
- Previous day is completed
- Child progresses to that day

### 3. Viewing Exercises

In the Day Detail Modal:
- **Scroll horizontally** through exercise cards
- **Tap any exercise** to view details and start
- **Tap "Start Training"** to begin with first exercise
- **Tap X or outside** to close modal

## Integration with Existing Code

### Using in Your Component

```tsx
import { DayDetailModal } from '@/components/DayDetailModal';
import { TrackDay } from '@/lib/trackService';

function YourComponent() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<TrackDay | null>(null);

  return (
    <>
      {/* Your UI */}

      <DayDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        day={selectedDay}
        dayNumber={selectedDay?.day_number || 0}
        childName="שרה"
        exercises={[
          {
            id: '1',
            title: 'Eye Tracking',
            duration: '5 דקות',
            isCompleted: false,
            description: 'Follow the moving object',
          },
        ]}
        onExercisePress={(id) => {
          console.log('Exercise pressed:', id);
        }}
      />
    </>
  );
}
```

### Fetching Real Data

```tsx
import {
  getUserActiveTrackProgress,
  getTrackWithDays,
  getTrackDayExercises
} from '@/lib/trackService';
import { getExerciseById } from '@/lib/exercisesService';
import { getChildByUserId } from '@/lib/familyService';

async function loadProgressData(userId: string) {
  // 1. Get child profile
  const child = await getChildByUserId(userId);

  // 2. Get active track progress
  const progress = await getUserActiveTrackProgress(child.id);

  // 3. Get track with all days
  const track = await getTrackWithDays(progress.track_id);

  return { child, progress, track };
}

async function loadDayExercises(trackDayId: string) {
  // 1. Get exercise assignments for this day
  const assignments = await getTrackDayExercises(trackDayId);

  // 2. Get full exercise details
  const exercises = await Promise.all(
    assignments.map(async (assignment) => {
      const exercise = await getExerciseById(assignment.exercise_id_text);

      return {
        id: exercise.id,
        title: exercise.exercise_name,
        duration: `${assignment.duration_override || 300} seconds`,
        isCompleted: false,
        description: exercise.description,
        videoUrl: exercise.video_link,
        audioUrl: exercise.audio_link,
        mediaType: exercise.media_type,
      };
    })
  );

  return exercises;
}
```

### Using Mock Data (Development)

```tsx
import { mockData, getMockExercisesForDay } from '@/lib/mockProgressData';

function DevelopmentComponent() {
  const [modalVisible, setModalVisible] = useState(true);
  const selectedDay = mockData.trackDays[4]; // Day 5
  const exercises = getMockExercisesForDay(5);

  return (
    <DayDetailModal
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
      day={selectedDay}
      dayNumber={5}
      childName={mockData.child.name}
      exercises={exercises}
      onExercisePress={(id) => {
        console.log('Exercise:', id);
      }}
    />
  );
}
```

## Customization

### Changing Colors

Edit the styles in `progress.tsx` or `DayDetailModal.tsx`:

```tsx
const styles = StyleSheet.create({
  // Change completed color
  dayCircleCompleted: {
    backgroundColor: '#4FFFB0',  // Change this
    borderColor: '#4FFFB0',
  },

  // Change current day color
  dayCircleCurrent: {
    backgroundColor: '#B4FF39',  // Change this
    borderColor: '#B4FF39',
  },

  // Change locked color
  dayCircleLocked: {
    backgroundColor: '#F0F0F0',  // Change this
    borderColor: '#E0E0E0',
  },
});
```

### Adjusting Animation Speed

In `DayDetailModal.tsx`:

```tsx
<Modal
  visible={visible}
  animationType="slide"  // Change to "fade" or "none"
  transparent={true}
  onRequestClose={onClose}
>
```

### Modifying Layout

Change the winding path direction in `progress.tsx`:

```tsx
// Current: alternates left/right
const isLeftSide = index % 2 === 0;

// All on right:
const isLeftSide = false;

// All on left:
const isLeftSide = true;

// Every 3rd alternates:
const isLeftSide = Math.floor(index / 3) % 2 === 0;
```

### Changing Exercise Card Width

In `DayDetailModal.tsx`:

```tsx
const EXERCISE_CARD_WIDTH = width * 0.7;  // 70% of screen width
// Change to: width * 0.8 for 80%
// Or: 300 for fixed 300px width
```

## API Reference

### DayDetailModal Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Called when modal should close |
| `day` | `TrackDay \| null` | Yes | The selected track day data |
| `dayNumber` | `number` | Yes | Day number (1-30) |
| `childName` | `string` | Yes | Child's name for greeting |
| `exercises` | `Exercise[]` | Yes | Array of exercises for the day |
| `onExercisePress` | `(id: string) => void` | Yes | Called when exercise is tapped |

### Exercise Object Structure

```typescript
interface Exercise {
  id: string;              // Unique exercise ID
  title: string;           // Exercise name
  duration: string;        // e.g., "5 דקות"
  isCompleted: boolean;    // Completion status
  description: string;     // Exercise description
  videoUrl?: string;       // Optional video URL
  audioUrl?: string;       // Optional audio URL
  mediaType: 'video' | 'audio' | 'interactive';
}
```

## Common Use Cases

### 1. Check if Day is Accessible

```tsx
function isDayAccessible(
  dayNumber: number,
  currentDay: number,
  completedDays: number[]
): boolean {
  // Day 1 always accessible
  if (dayNumber === 1) return true;

  // Completed days always accessible
  if (completedDays.includes(dayNumber)) return true;

  // Current day accessible if previous completed
  if (dayNumber === currentDay &&
      completedDays.includes(dayNumber - 1)) {
    return true;
  }

  return false;
}

// Usage:
const canAccess = isDayAccessible(5, 5, [1, 2, 3, 4]);
```

### 2. Calculate Progress Percentage

```tsx
function calculateProgress(completedDays: number[], totalDays: number = 30): number {
  return Math.round((completedDays.length / totalDays) * 100);
}

// Usage:
const percentage = calculateProgress([1, 2, 3, 4], 30); // 13%
```

### 3. Get Next Incomplete Day

```tsx
function getNextIncompleteDay(
  currentDay: number,
  completedDays: number[],
  totalDays: number = 30
): number | null {
  for (let i = 1; i <= totalDays; i++) {
    if (!completedDays.includes(i)) {
      return i;
    }
  }
  return null; // All completed
}

// Usage:
const nextDay = getNextIncompleteDay(5, [1, 2, 3, 4], 30); // 5
```

### 4. Mark Day as Completed

```tsx
import { completeTrackDay } from '@/lib/trackService';

async function markDayCompleted(
  childId: string,
  trackDayId: string,
  exercisesCompleted: number
) {
  const durationSeconds = 600; // 10 minutes

  const success = await completeTrackDay(
    childId,
    trackDayId,
    durationSeconds,
    exercisesCompleted
  );

  if (success) {
    console.log('Day completed successfully!');
    // Refresh progress data
  }
}
```

### 5. Handle Exercise Completion

```tsx
function handleExerciseComplete(
  exerciseId: string,
  exercises: Exercise[]
) {
  // Update exercise as completed
  const updated = exercises.map(ex =>
    ex.id === exerciseId
      ? { ...ex, isCompleted: true }
      : ex
  );

  // Check if all exercises completed
  const allCompleted = updated.every(ex => ex.isCompleted);

  if (allCompleted) {
    console.log('All exercises completed for today!');
    // Mark day as complete
  }

  return updated;
}
```

## Testing

### Manual Testing Checklist

- [ ] Day buttons render correctly (1-30)
- [ ] Locked days cannot be tapped
- [ ] Current day has glow effect
- [ ] Completed days show checkmark
- [ ] Modal opens on day tap
- [ ] Child name displays in greeting
- [ ] Exercises load and display
- [ ] Horizontal scroll works smoothly
- [ ] Exercise tap navigates correctly
- [ ] Modal closes properly
- [ ] Pull-to-refresh updates data
- [ ] Progress bar shows correct percentage

### Testing with Mock Data

```tsx
// In your test file
import { render, fireEvent } from '@testing-library/react-native';
import { DayDetailModal } from '@/components/DayDetailModal';
import { mockData, getMockExercisesForDay } from '@/lib/mockProgressData';

describe('DayDetailModal', () => {
  it('displays child name in greeting', () => {
    const { getByText } = render(
      <DayDetailModal
        visible={true}
        onClose={() => {}}
        day={mockData.trackDays[0]}
        dayNumber={1}
        childName="שרה"
        exercises={getMockExercisesForDay(1)}
        onExercisePress={() => {}}
      />
    );

    expect(getByText(/שלום שרה/)).toBeTruthy();
  });
});
```

## Troubleshooting

### Modal doesn't open
**Problem:** Tapping day button doesn't open modal
**Solution:** Check that day is accessible and `handleDayPress` is called

```tsx
// Add debug logging
const handleDayPress = async (day: TrackDay) => {
  console.log('Day pressed:', day.day_number);
  console.log('Is accessible:', isDayAccessible(day.day_number));
  // ... rest of function
};
```

### Exercises not loading
**Problem:** Modal shows empty state
**Solution:** Verify exercise data exists in database

```tsx
const loadDayExercises = async (trackDayId: string) => {
  try {
    const assignments = await getTrackDayExercises(trackDayId);
    console.log('Assignments found:', assignments.length);

    if (assignments.length === 0) {
      console.warn('No exercises assigned to this day');
    }
    // ... rest of function
  } catch (error) {
    console.error('Error loading exercises:', error);
  }
};
```

### Styling issues on different devices
**Problem:** Layout looks wrong on some screen sizes
**Solution:** Use responsive dimensions

```tsx
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;

const styles = StyleSheet.create({
  dayCircle: {
    width: isSmallPhone ? 56 : 64,
    height: isSmallPhone ? 56 : 64,
  },
});
```

### RTL text rendering
**Problem:** Hebrew text not displaying right-to-left
**Solution:** Ensure proper text alignment

```tsx
const styles = StyleSheet.create({
  text: {
    textAlign: 'right',  // Always use right for Hebrew
    writingDirection: 'rtl',
  },
});
```

## Performance Tips

1. **Lazy load exercises:** Only load when modal opens
2. **Memoize calculations:** Use `useMemo` for expensive operations
3. **Optimize images:** Use appropriate sizes for thumbnails
4. **Limit re-renders:** Use `React.memo` for components
5. **Virtual scrolling:** Consider FlatList for very long lists

## Accessibility Checklist

- [x] All interactive elements have accessible labels
- [x] Touch targets minimum 44x44 points
- [x] High contrast colors (4.5:1 ratio)
- [x] Screen reader support
- [x] Keyboard navigation
- [x] Descriptive error messages
- [x] Status announcements
- [x] Focus management

## Next Steps

1. **Add animations:** Enhance with more engaging animations
2. **Add sound effects:** Play sounds on day completion
3. **Add achievements:** Badge system for milestones
4. **Add statistics:** Show detailed progress charts
5. **Add sharing:** Let kids share progress with parents

## Support

For issues or questions:
- Check the README_PROGRESS_PAGE.md documentation
- Review mock data examples in mockProgressData.ts
- Test with provided mock data first
- Enable debug logging to troubleshoot
