import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DayDetailModal } from './DayDetailModal';
import { mockData, getMockExercisesForDay } from '@/lib/mockProgressData';
import type { TrackDay } from '@/lib/trackService';

export function ProgressExamples() {
  const [activeExample, setActiveExample] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<TrackDay | null>(null);

  const examples = [
    {
      id: 'example-1',
      title: 'Day 1 - First Day',
      description: 'Shows the first day with 3 exercises',
      day: mockData.trackDays[0],
      childName: 'שרה',
      exercises: getMockExercisesForDay(1),
    },
    {
      id: 'example-2',
      title: 'Day 5 - Current Day',
      description: 'Active day with 4 exercises',
      day: mockData.trackDays[4],
      childName: 'דוד',
      exercises: getMockExercisesForDay(5),
    },
    {
      id: 'example-3',
      title: 'Day 15 - Mid Journey',
      description: 'Halfway through the journey',
      day: mockData.trackDays[14],
      childName: 'מיכל',
      exercises: getMockExercisesForDay(15),
    },
    {
      id: 'example-4',
      title: 'Day 30 - Final Day',
      description: 'Completion day with trophy',
      day: mockData.trackDays[29],
      childName: 'יוסי',
      exercises: getMockExercisesForDay(30),
    },
  ];

  const handleOpenExample = (example: typeof examples[0]) => {
    setSelectedDay(example.day);
    setActiveExample(example.id);
  };

  const handleCloseModal = () => {
    setActiveExample(null);
    setSelectedDay(null);
  };

  const currentExample = examples.find((ex) => ex.id === activeExample);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress Page Examples</Text>
        <Text style={styles.subtitle}>
          Interactive examples showing different states and configurations
        </Text>
      </View>

      <View style={styles.examplesGrid}>
        {examples.map((example) => (
          <TouchableOpacity
            key={example.id}
            style={styles.exampleCard}
            onPress={() => handleOpenExample(example)}
            activeOpacity={0.7}
          >
            <View style={styles.exampleHeader}>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>{example.day.day_number}</Text>
              </View>
              <Text style={styles.exampleTitle}>{example.title}</Text>
            </View>
            <Text style={styles.exampleDescription}>{example.description}</Text>
            <View style={styles.exampleFooter}>
              <Text style={styles.exerciseCount}>
                {example.exercises.length} תרגילים
              </Text>
              <Text style={styles.tapText}>לחץ לצפייה →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Configurations</Text>

        <View style={styles.configCard}>
          <Text style={styles.configTitle}>Single Exercise Day</Text>
          <Text style={styles.configDescription}>
            Example with just one exercise - minimal setup
          </Text>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => {
              setSelectedDay(mockData.trackDays[9]);
              setActiveExample('config-1');
            }}
          >
            <Text style={styles.viewButtonText}>View Example</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.configCard}>
          <Text style={styles.configTitle}>Long Description Day</Text>
          <Text style={styles.configDescription}>
            Example with detailed day description and instructions
          </Text>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => {
              const customDay = {
                ...mockData.trackDays[19],
                description_he:
                  'היום נתמקד בתרגילים מתקדמים לשיפור תיאום עיניים. תרגילים אלה מיועדים לחזק את שרירי העיניים ולשפר את היכולת לעקוב אחר עצמים בתנועה. וודא שאתה יושב במקום נוח ומואר היטב.',
              };
              setSelectedDay(customDay);
              setActiveExample('config-2');
            }}
          >
            <Text style={styles.viewButtonText}>View Example</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.configCard}>
          <Text style={styles.configTitle}>Mixed Media Exercises</Text>
          <Text style={styles.configDescription}>
            Day with video, audio, and interactive exercises
          </Text>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => {
              setSelectedDay(mockData.trackDays[24]);
              setActiveExample('config-3');
            }}
          >
            <Text style={styles.viewButtonText}>View Example</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer Notes</Text>
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Modal Behavior</Text>
          <Text style={styles.noteText}>
            • Modal slides up from bottom{'\n'}
            • Tap outside or X button to close{'\n'}
            • Horizontal scroll with snap behavior{'\n'}
            • Smooth animations at 60fps
          </Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Customization Points</Text>
          <Text style={styles.noteText}>
            • Exercise card width: EXERCISE_CARD_WIDTH{'\n'}
            • Colors: dayCircleCompleted, dayCircleCurrent{'\n'}
            • Animation speed: Modal animationType{'\n'}
            • Layout: isLeftSide logic in progress.tsx
          </Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Data Integration</Text>
          <Text style={styles.noteText}>
            • Uses Supabase for data persistence{'\n'}
            • Mock data available in mockProgressData.ts{'\n'}
            • Type-safe with TypeScript interfaces{'\n'}
            • Real-time progress tracking support
          </Text>
        </View>
      </View>

      {currentExample && selectedDay && (
        <DayDetailModal
          visible={activeExample !== null}
          onClose={handleCloseModal}
          day={selectedDay}
          dayNumber={selectedDay.day_number}
          childName={currentExample.childName}
          exercises={
            activeExample === 'config-1'
              ? [getMockExercisesForDay(10)[0]]
              : activeExample === 'config-2'
              ? getMockExercisesForDay(20)
              : activeExample === 'config-3'
              ? getMockExercisesForDay(25)
              : currentExample.exercises
          }
          onExercisePress={(id) => {
            console.log('Exercise pressed:', id);
            handleCloseModal();
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  examplesGrid: {
    gap: 16,
    marginBottom: 32,
  },
  exampleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4FFFB0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  exampleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  exampleDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  exampleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseCount: {
    fontSize: 14,
    color: '#4FFFB0',
    fontWeight: '600',
  },
  tapText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  configCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  configDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  viewButton: {
    backgroundColor: '#B4FF39',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  noteCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4FFFB0',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});

export function MinimalProgressExample() {
  const [visible, setVisible] = useState(false);
  const day = mockData.trackDays[0];
  const exercises = getMockExercisesForDay(1);

  return (
    <View style={minimalStyles.container}>
      <TouchableOpacity
        style={minimalStyles.openButton}
        onPress={() => setVisible(true)}
      >
        <Text style={minimalStyles.openButtonText}>Open Day Modal</Text>
      </TouchableOpacity>

      <DayDetailModal
        visible={visible}
        onClose={() => setVisible(false)}
        day={day}
        dayNumber={1}
        childName="שרה"
        exercises={exercises}
        onExercisePress={(id) => console.log('Exercise:', id)}
      />
    </View>
  );
}

const minimalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  openButton: {
    backgroundColor: '#4FFFB0',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  openButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
});
