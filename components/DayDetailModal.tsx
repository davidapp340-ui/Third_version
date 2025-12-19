import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { X, Play, Clock, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { TrackDay } from '@/lib/trackService';

interface Exercise {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  description: string;
}

interface DayDetailModalProps {
  visible: boolean;
  onClose: () => void;
  day: TrackDay | null;
  dayNumber: number;
  childName: string;
  exercises: Exercise[];
  onExercisePress: (exerciseId: string) => void;
}

const { width } = Dimensions.get('window');
const EXERCISE_CARD_WIDTH = width * 0.7;

export function DayDetailModal({
  visible,
  onClose,
  day,
  dayNumber,
  childName,
  exercises,
  onExercisePress,
}: DayDetailModalProps) {
  if (!day) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={['#B4FF39', '#4FFFB0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityLabel="Close modal"
                accessibilityRole="button"
              >
                <X size={28} color="#1A1A1A" />
              </TouchableOpacity>
              <Text style={styles.dayTitle}>יום {dayNumber} מתוך 30</Text>
            </View>

            <Text style={styles.greeting}>
              שלום {childName}, במה נתאמן היום?
            </Text>

            {day.title_he && (
              <Text style={styles.dayTheme}>{day.title_he}</Text>
            )}

            {day.description_he && (
              <Text style={styles.dayDescription}>{day.description_he}</Text>
            )}
          </LinearGradient>

          <View style={styles.exercisesSection}>
            <Text style={styles.sectionTitle}>תרגילי היום</Text>

            {exercises.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>טוען תרגילים...</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.exercisesScrollContent}
                snapToInterval={EXERCISE_CARD_WIDTH + 16}
                decelerationRate="fast"
              >
                {exercises.map((exercise, index) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={[
                      styles.exerciseCard,
                      { width: EXERCISE_CARD_WIDTH },
                    ]}
                    onPress={() => onExercisePress(exercise.id)}
                    activeOpacity={0.8}
                    accessibilityLabel={`Exercise ${index + 1}: ${exercise.title}`}
                    accessibilityRole="button"
                  >
                    <View style={styles.exerciseCardHeader}>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                      </View>

                      {exercise.isCompleted && (
                        <View style={styles.completedBadge}>
                          <CheckCircle size={20} color="#4FFFB0" fill="#4FFFB0" />
                        </View>
                      )}
                    </View>

                    <Text style={styles.exerciseTitle} numberOfLines={2}>
                      {exercise.title}
                    </Text>

                    {exercise.description && (
                      <Text style={styles.exerciseDescription} numberOfLines={3}>
                        {exercise.description}
                      </Text>
                    )}

                    <View style={styles.exerciseFooter}>
                      <View style={styles.durationBadge}>
                        <Clock size={16} color="#666" />
                        <Text style={styles.durationText}>{exercise.duration}</Text>
                      </View>

                      <View style={styles.playButton}>
                        <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                if (exercises.length > 0) {
                  onExercisePress(exercises[0].id);
                }
              }}
              accessibilityLabel="Start exercises"
              accessibilityRole="button"
            >
              <Text style={styles.startButtonText}>התחל תרגול</Text>
              <Play size={20} color="#1A1A1A" fill="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'right',
  },
  dayTheme: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'right',
  },
  dayDescription: {
    fontSize: 14,
    color: '#1A1A1A',
    opacity: 0.8,
    textAlign: 'right',
    lineHeight: 20,
  },
  exercisesSection: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    paddingHorizontal: 20,
    textAlign: 'right',
  },
  exercisesScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 16,
  },
  exerciseCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4FFFB0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  completedBadge: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'right',
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'right',
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4FFFB0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#B4FF39',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#B4FF39',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
});
