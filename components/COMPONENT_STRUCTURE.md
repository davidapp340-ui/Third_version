# Progress Page Component Structure

## Visual Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      app/(tabs)/progress.tsx                     │
│                      (Main Progress Screen)                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │             LinearGradient Header                       │   │
│  │  • Title: "מסע האימון שלך"                            │   │
│  │  • Subtitle: "יום X מתוך 30"                          │   │
│  │  • Progress Bar (visual indicator)                     │   │
│  │  • Days completed count                                │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                   ScrollView                            │   │
│  │                                                         │   │
│  │   ┌──────────────────────────────────────────────┐    │   │
│  │   │         Track Container (White Card)          │    │   │
│  │   │                                               │    │   │
│  │   │  Track Title: "מסלול אימון ראייה ל-30 יום"   │    │   │
│  │   │  Track Description                            │    │   │
│  │   │                                               │    │   │
│  │   │  ┌──────────────────────────────────────┐   │    │   │
│  │   │  │      Journey Map (Winding Path)       │   │    │   │
│  │   │  │                                        │   │    │   │
│  │   │  │   ┌─────┐  Day 1                      │   │    │   │
│  │   │  │   │  1  │  ✓ הושלם                    │   │    │   │
│  │   │  │   └─────┘                              │   │    │   │
│  │   │  │      │                                 │   │    │   │
│  │   │  │      │ (connecting line)               │   │    │   │
│  │   │  │      │                                 │   │    │   │
│  │   │  │              ┌─────┐  Day 2            │   │    │   │
│  │   │  │              │  2  │  ✓ הושלם          │   │    │   │
│  │   │  │              └─────┘                   │   │    │   │
│  │   │  │                 │                      │   │    │   │
│  │   │  │                 │                      │   │    │   │
│  │   │  │   ┌─────┐  Day 3                      │   │    │   │
│  │   │  │   │  3  │  ✓ הושלם                    │   │    │   │
│  │   │  │   └─────┘                              │   │    │   │
│  │   │  │      │                                 │   │    │   │
│  │   │  │      │                                 │   │    │   │
│  │   │  │              ┌─────┐  Day 4            │   │    │   │
│  │   │  │              │  4  │  ✓ הושלם          │   │    │   │
│  │   │  │              └─────┘                   │   │    │   │
│  │   │  │                 │                      │   │    │   │
│  │   │  │                 │                      │   │    │   │
│  │   │  │   ┌─────┐  Day 5  👤 (character)      │   │    │   │
│  │   │  │   │  5  │← האימון של היום ⭐          │   │    │   │
│  │   │  │   └─────┘  (glowing green)             │   │    │   │
│  │   │  │      │                                 │   │    │   │
│  │   │  │      │                                 │   │    │   │
│  │   │  │              ┌─────┐  Day 6            │   │    │   │
│  │   │  │              │ 🔒 │  (locked)          │   │    │   │
│  │   │  │              └─────┘                   │   │    │   │
│  │   │  │                                        │   │    │   │
│  │   │  │            ... (continues to day 30)   │   │    │   │
│  │   │  │                                        │   │    │   │
│  │   │  │              ┌─────┐  Day 30           │   │    │   │
│  │   │  │              │ 🏆 │  Final Day         │   │    │   │
│  │   │  │              └─────┘                   │   │    │   │
│  │   │  └──────────────────────────────────────┘   │    │   │
│  │   │                                               │    │   │
│  │   │  [Completion Card - If completed]             │    │   │
│  │   │  🏆 כל הכבוד!                                 │    │   │
│  │   │  השלמת את המסלול!                             │    │   │
│  │   └───────────────────────────────────────────────┘    │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ On Day Tap
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              components/DayDetailModal.tsx                       │
│              (Slide-up Modal - 90% screen height)                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │           LinearGradient Modal Header                   │   │
│  │                                                         │   │
│  │  [X] Close Button          יום 5 מתוך 30              │   │
│  │                                                         │   │
│  │  שלום שרה, במה נתאמן היום?                            │   │
│  │  (Personalized Greeting)                               │   │
│  │                                                         │   │
│  │  Day Theme: "אימון יום 5"                             │   │
│  │  Day Description                                       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              תרגילי היום (Exercises Section)            │   │
│  │                                                         │   │
│  │  ← Horizontal ScrollView (Snap to card) →             │   │
│  │                                                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│   │
│  │  │ Exercise 1   │  │ Exercise 2   │  │ Exercise 3   ││   │
│  │  │              │  │              │  │              ││   │
│  │  │  ┌────┐      │  │  ┌────┐      │  │  ┌────┐      ││   │
│  │  │  │ 1  │   ✓  │  │  │ 2  │   ✓  │  │  │ 3  │      ││   │
│  │  │  └────┘      │  │  └────┘      │  │  └────┘      ││   │
│  │  │              │  │              │  │              ││   │
│  │  │ Circular Eye │  │ Peripheral   │  │ Blink &     ││   │
│  │  │ Movement     │  │ Vision       │  │ Refresh     ││   │
│  │  │              │  │              │  │              ││   │
│  │  │ Description  │  │ Description  │  │ Description ││   │
│  │  │ text...      │  │ text...      │  │ text...     ││   │
│  │  │              │  │              │  │              ││   │
│  │  │ ┌──────┐  ▶ │  │ ┌──────┐  ▶ │  │ ┌──────┐  ▶ ││   │
│  │  │ │⏱ 4m │    │  │ │⏱ 5m │    │  │ │⏱ 3m │    ││   │
│  │  │ └──────┘    │  │ └──────┘    │  │ └──────┘    ││   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘│   │
│  │       70% width      70% width      70% width      │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                 Modal Footer                            │   │
│  │                                                         │   │
│  │        ┌────────────────────────────────┐              │   │
│  │        │  התחל תרגול  ▶                │              │   │
│  │        │  (Start Training Button)       │              │   │
│  │        └────────────────────────────────┘              │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Main Progress Screen Components

#### Header Section
```tsx
<LinearGradient colors={['#B4FF39', '#4FFFB0']}>
  <Text>מסע האימון שלך</Text>
  <Text>יום {dayOfMonth} מתוך 30</Text>
  <ProgressBar /> // Visual bar showing completion
</LinearGradient>
```

#### Journey Map
```tsx
<View style={styles.journeyMap}>
  {trackDays.map((day) => (
    <DayButton
      day={day}
      status={getDayStatus(day.day_number)}
      onPress={() => handleDayPress(day)}
    />
  ))}
</View>
```

#### Day Button States
```tsx
// State 1: Completed
<View style={styles.dayCircleCompleted}>
  <CheckCircle size={32} color="#FFFFFF" fill="#4FFFB0" />
</View>

// State 2: Current (Active)
<View style={styles.dayCircleCurrent}>
  <Text>{dayNumber}</Text>
  <Star size={16} color="#FFD700" /> // Badge
</View>

// State 3: Locked
<View style={styles.dayCircleLocked}>
  <Lock size={24} color="#999999" />
</View>
```

### 2. Day Detail Modal Components

#### Modal Header
```tsx
<LinearGradient colors={['#B4FF39', '#4FFFB0']}>
  <TouchableOpacity onPress={onClose}>
    <X size={28} />
  </TouchableOpacity>
  <Text>יום {dayNumber} מתוך 30</Text>
  <Text>שלום {childName}, במה נתאמן היום?</Text>
  <Text>{day.title_he}</Text>
  <Text>{day.description_he}</Text>
</LinearGradient>
```

#### Exercise Cards
```tsx
<ScrollView horizontal snapToInterval={CARD_WIDTH + 16}>
  {exercises.map((exercise, index) => (
    <ExerciseCard
      key={exercise.id}
      exercise={exercise}
      index={index}
      onPress={() => onExercisePress(exercise.id)}
    />
  ))}
</ScrollView>
```

#### Single Exercise Card
```tsx
<View style={styles.exerciseCard}>
  {/* Header */}
  <View>
    <View style={styles.exerciseNumber}>
      <Text>{index + 1}</Text>
    </View>
    {isCompleted && <CheckCircle />}
  </View>

  {/* Content */}
  <Text>{exercise.title}</Text>
  <Text>{exercise.description}</Text>

  {/* Footer */}
  <View>
    <View style={styles.durationBadge}>
      <Clock size={16} />
      <Text>{exercise.duration}</Text>
    </View>
    <View style={styles.playButton}>
      <Play size={20} />
    </View>
  </View>
</View>
```

## State Management

### Main Progress Screen State

```tsx
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [childId, setChildId] = useState<string | null>(null);
const [childName, setChildName] = useState<string>('');
const [progress, setProgress] = useState<UserProgressWithTrack | null>(null);
const [trackWithDays, setTrackWithDays] = useState<TrackWithDays | null>(null);
const [modalVisible, setModalVisible] = useState(false);
const [selectedDay, setSelectedDay] = useState<TrackDay | null>(null);
const [dayExercises, setDayExercises] = useState<Exercise[]>([]);
```

### State Transitions

```
Initial Load
    ↓
checkUserAccess() → Verify user type (child only)
    ↓
loadData() → Fetch child, progress, track
    ↓
Render 30-day path with proper states
    ↓
User taps accessible day
    ↓
handleDayPress(day) → Validate access
    ↓
loadDayExercises(dayId) → Fetch exercises
    ↓
setModalVisible(true) → Show modal
    ↓
User scrolls and views exercises
    ↓
User taps exercise
    ↓
onExercisePress(id) → Navigate to exercise
    ↓
Modal closes automatically
```

## Data Flow Diagram

```
┌──────────────┐
│   Supabase   │
│   Database   │
└──────┬───────┘
       │
       │ Query
       ▼
┌──────────────────┐
│  Service Layer   │
│                  │
│ • trackService   │
│ • exerciseService│
│ • familyService  │
└────────┬─────────┘
         │
         │ Return Data
         ▼
┌──────────────────────┐
│  React State         │
│                      │
│ • progress           │
│ • trackWithDays      │
│ • dayExercises       │
└──────────┬───────────┘
           │
           │ Props
           ▼
┌────────────────────────┐
│  UI Components         │
│                        │
│ • ProgressScreen       │
│ • DayDetailModal       │
│ • ExerciseCards        │
└────────────────────────┘
```

## Event Flow

### Opening Modal

```
User Action: Tap Day 5 Button
              ↓
handleDayPress(day5)
              ↓
Check if accessible:
  • Is completed? → YES, allow
  • Is current day? → Check previous completed
  • Is locked? → Block
              ↓
setSelectedDay(day5)
              ↓
loadDayExercises(day5.id)
              ↓
Query: getTrackDayExercises(day5.id)
              ↓
For each assignment:
  Query: getExerciseById(exerciseId)
              ↓
Map to UI format
              ↓
setDayExercises(exercises)
              ↓
setModalVisible(true)
              ↓
Modal slides up with animation
              ↓
Display:
  • Greeting with child name
  • Day details
  • Exercise cards
```

### Closing Modal

```
User Action: Tap X or Outside
              ↓
handleCloseModal()
              ↓
setModalVisible(false)
              ↓
setSelectedDay(null)
              ↓
setDayExercises([])
              ↓
Modal slides down with animation
              ↓
Return to Progress Screen
```

## Style System

### Color Variables
```typescript
const COLORS = {
  completed: '#4FFFB0',
  current: '#B4FF39',
  locked: '#E5E5EA',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  background: '#F5F5F5',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
};
```

### Spacing System (8px base)
```typescript
const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};
```

### Typography
```typescript
const TYPOGRAPHY = {
  title: { fontSize: 32, fontWeight: 'bold' },
  sectionTitle: { fontSize: 24, fontWeight: 'bold' },
  bodyLarge: { fontSize: 18 },
  body: { fontSize: 16 },
  bodySmall: { fontSize: 14 },
};
```

### Touch Targets
```typescript
const TOUCH_TARGETS = {
  minimum: 44, // iOS minimum
  dayButton: 64, // Extra large for children
  icon: 44,
};
```

## File Dependencies

```
app/(tabs)/progress.tsx
  ├─ imports: react, react-native
  ├─ imports: expo-linear-gradient
  ├─ imports: expo-router
  ├─ imports: lucide-react-native
  ├─ imports: @/lib/authService
  ├─ imports: @/lib/familyService
  ├─ imports: @/lib/trackService
  ├─ imports: @/lib/exercisesService
  └─ imports: @/components/DayDetailModal

components/DayDetailModal.tsx
  ├─ imports: react, react-native
  ├─ imports: expo-linear-gradient
  ├─ imports: expo-router
  ├─ imports: lucide-react-native
  └─ imports: @/lib/trackService (types)

types/progress.ts
  └─ exports: TypeScript interfaces

lib/mockProgressData.ts
  ├─ imports: @/lib/trackService (types)
  ├─ imports: @/types/progress
  └─ exports: Mock data and helper functions
```

## Accessibility Tree

```
ProgressScreen [role: screen]
├─ Header [role: header]
│  ├─ Title [accessible, screen reader]
│  ├─ Subtitle [accessible, screen reader]
│  └─ ProgressBar [role: progressbar, value: X%]
├─ ScrollView [role: scrollable]
│  └─ JourneyMap [role: list]
│     ├─ DayButton1 [role: button, label: "Day 1, completed"]
│     ├─ DayButton2 [role: button, label: "Day 2, completed"]
│     ├─ DayButton5 [role: button, label: "Day 5, current day"]
│     └─ DayButton6 [role: button, label: "Day 6, locked", disabled]
└─ DayDetailModal [role: dialog, modal: true]
   ├─ CloseButton [role: button, label: "Close modal"]
   ├─ Greeting [accessible, screen reader]
   ├─ ExercisesList [role: list]
   │  ├─ ExerciseCard1 [role: button, label: "Exercise 1: Title"]
   │  ├─ ExerciseCard2 [role: button, label: "Exercise 2: Title"]
   │  └─ ExerciseCard3 [role: button, label: "Exercise 3: Title"]
   └─ StartButton [role: button, label: "Start exercises"]
```

## Performance Considerations

### Initial Load
1. Load user authentication (cached)
2. Load child profile (single query)
3. Load active track progress (indexed query)
4. Load track with days (join query)

### On Day Tap
1. Validate access (in-memory check)
2. Load exercise assignments (indexed query)
3. Load exercise details (parallel queries)
4. Open modal (animated transition)

### Optimizations
- Memoize expensive calculations
- Lazy load exercise details
- Use FlatList for very long lists
- Optimize images
- Hardware-accelerated animations

---

This structure ensures a maintainable, performant, and accessible component system that provides an excellent user experience for children aged 6-12.
