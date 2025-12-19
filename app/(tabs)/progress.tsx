import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CheckCircle, Lock, Star, Trophy } from 'lucide-react-native';
import { getCurrentUser } from '@/lib/authService';
import { getChildByUserId, createIndependentChildRecord } from '@/lib/familyService';
import {
  getUserActiveTrackProgress,
  getTrackWithDays,
  getTrackDayExercises,
  getActiveTrainingTracks,
  startTrack,
  type UserProgressWithTrack,
  type TrackWithDays,
  type TrackDay,
} from '@/lib/trackService';
import { DayDetailModal } from '@/components/DayDetailModal';
import { getExerciseById } from '@/lib/exercisesService';

export default function ProgressScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [childId, setChildId] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>('');
  const [progress, setProgress] = useState<UserProgressWithTrack | null>(null);
  const [trackWithDays, setTrackWithDays] = useState<TrackWithDays | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<TrackDay | null>(null);
  const [dayExercises, setDayExercises] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      const user = await getCurrentUser();
      const userType = user?.user_metadata?.user_type;

      if (userType === 'parent') {
        router.replace('/(tabs)');
        return;
      }

      loadData();
    } catch (error) {
      console.error('Error checking user access:', error);
      router.replace('/(tabs)');
    }
  };

  const loadData = async () => {
    try {
      setError(null);
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/auth/child-login');
        return;
      }

      let child = await getChildByUserId(user.id);

      if (!child) {
        const userType = user.user_metadata?.user_type;
        if (userType === 'child_independent') {
          const firstName = user.user_metadata?.first_name || 'ילד';
          const age = user.user_metadata?.age || 10;
          try {
            child = await createIndependentChildRecord(user.id, firstName, age);
          } catch (createError) {
            console.error('Error creating child record:', createError);
          }
        }
      }

      if (child) {
        setChildId(child.id);
        setChildName(child.name);

        let userProgress = await getUserActiveTrackProgress(child.id);

        if (!userProgress) {
          try {
            const availableTracks = await getActiveTrainingTracks();
            if (availableTracks.length > 0) {
              await startTrack(child.id, availableTracks[0].id);
              userProgress = await getUserActiveTrackProgress(child.id);
            }
          } catch (startError) {
            console.error('Error auto-starting track:', startError);
          }
        }

        setProgress(userProgress);

        if (userProgress) {
          const track = await getTrackWithDays(userProgress.track_id);
          setTrackWithDays(track);
        }
      }
    } catch (err) {
      console.error('Error loading progress:', err);
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrack = async () => {
    setStarting(true);
    setError(null);

    try {
      let currentChildId = childId;

      if (!currentChildId) {
        const user = await getCurrentUser();
        if (!user) {
          setError('יש להתחבר מחדש');
          return;
        }

        let child = await getChildByUserId(user.id);

        if (!child) {
          const userType = user.user_metadata?.user_type;
          if (userType === 'child_independent') {
            const firstName = user.user_metadata?.first_name || 'ילד';
            const age = user.user_metadata?.age || 10;
            try {
              child = await createIndependentChildRecord(user.id, firstName, age);
            } catch (createError) {
              console.error('Error creating child record:', createError);
              setError('שגיאה ביצירת פרופיל. נסה שוב.');
              return;
            }
          } else {
            setError('לא נמצא פרופיל ילד. אנא צור קשר עם התמיכה.');
            return;
          }
        }

        currentChildId = child.id;
        setChildId(child.id);
        setChildName(child.name);
      }

      if (!currentChildId) {
        setError('לא נמצא פרופיל ילד');
        return;
      }

      const availableTracks = await getActiveTrainingTracks();
      if (availableTracks.length === 0) {
        setError('אין מסלולים זמינים כרגע');
        return;
      }

      await startTrack(currentChildId, availableTracks[0].id);
      const userProgress = await getUserActiveTrackProgress(currentChildId);
      setProgress(userProgress);

      if (userProgress) {
        const track = await getTrackWithDays(userProgress.track_id);
        setTrackWithDays(track);
      } else {
        setError('שגיאה בטעינת המסלול. נסה שוב.');
      }
    } catch (err) {
      console.error('Error starting track:', err);
      setError('שגיאה בהתחלת המסלול. נסה שוב.');
    } finally {
      setStarting(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleDayPress = async (day: TrackDay) => {
    if (!progress || !childId) return;

    // Check if day is accessible
    const isCompleted = progress.days_completed.includes(day.day_number);
    const isCurrentDay = day.day_number === progress.current_day;
    const isPreviousCompleted = day.day_number === 1 || progress.days_completed.includes(day.day_number - 1);

    if (isCompleted || (isCurrentDay && isPreviousCompleted)) {
      setSelectedDay(day);
      await loadDayExercises(day.id);
      setModalVisible(true);
    }
  };

  const loadDayExercises = async (trackDayId: string) => {
    try {
      const assignments = await getTrackDayExercises(trackDayId);

      const exercisesWithDetails = await Promise.all(
        assignments.map(async (assignment) => {
          const exercise = await getExerciseById(assignment.exercise_id_text);
          return {
            id: assignment.exercise_id_text,
            title: exercise?.exercise_name || 'תרגיל',
            duration: assignment.duration_override
              ? `${Math.floor(assignment.duration_override / 60)} דקות`
              : '5 דקות',
            isCompleted: false,
            description: exercise?.description || '',
            videoUrl: exercise?.video_link,
            audioUrl: exercise?.audio_link,
            mediaType: exercise?.media_type || 'video',
          };
        })
      );

      setDayExercises(exercisesWithDetails);
    } catch (error) {
      console.error('Error loading day exercises:', error);
      setDayExercises([]);
    }
  };

  const handleExercisePress = (exerciseId: string) => {
    setModalVisible(false);
    router.push({
      pathname: '/exercise/[id]',
      params: { id: exerciseId },
    });
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedDay(null);
    setDayExercises([]);
  };

  const getDayStatus = (dayNumber: number) => {
    if (!progress) return 'locked';
    if (progress.days_completed.includes(dayNumber)) return 'completed';
    if (dayNumber === progress.current_day && (dayNumber === 1 || progress.days_completed.includes(dayNumber - 1))) {
      return 'current';
    }
    return 'locked';
  };

  const calculateMonthProgress = () => {
    if (!progress) return 0;
    const today = new Date();
    const dayOfMonth = today.getDate();
    return Math.min(progress.days_completed.length, dayOfMonth);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4FFFB0" />
      </View>
    );
  }

  if (!progress || !trackWithDays) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#B4FF39', '#4FFFB0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>מסע האימון שלך</Text>
        </LinearGradient>

        <View style={styles.emptyState}>
          <Trophy size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>טרם התחלת מסלול אימון</Text>
          <Text style={styles.emptyDescription}>
            לחץ על הכפתור כדי להתחיל את מסע האימון שלך
          </Text>
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          <TouchableOpacity
            style={[styles.startButton, starting && styles.startButtonDisabled]}
            onPress={handleStartTrack}
            disabled={starting}
          >
            {starting ? (
              <ActivityIndicator size="small" color="#1A1A1A" />
            ) : (
              <Text style={styles.startButtonText}>התחל מסלול אימון</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysCompleted = progress.days_completed.length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B4FF39', '#4FFFB0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>מסע האימון שלך</Text>
          <Text style={styles.headerSubtitle}>
            יום {dayOfMonth} מתוך 30
          </Text>
          <View style={styles.progressBar}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(daysCompleted / 30) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {daysCompleted}/30 ימים הושלמו החודש
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.trackContainer}>
          <Text style={styles.trackTitle}>{trackWithDays.name_he}</Text>
          <Text style={styles.trackDescription}>{trackWithDays.description_he}</Text>

          <View style={styles.journeyMap}>
            {trackWithDays.track_days
              .sort((a, b) => a.day_number - b.day_number)
              .map((day, index) => {
                const status = getDayStatus(day.day_number);
                const isLeftSide = index % 2 === 0;

                return (
                  <View key={day.id} style={styles.dayRow}>
                    {/* Connecting line */}
                    {index > 0 && (
                      <View style={[styles.connectingLine, { alignSelf: isLeftSide ? 'flex-end' : 'flex-start' }]} />
                    )}

                    <TouchableOpacity
                      style={[
                        styles.dayStation,
                        isLeftSide ? styles.dayStationLeft : styles.dayStationRight,
                      ]}
                      onPress={() => handleDayPress(day)}
                      disabled={status === 'locked'}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.dayCircle,
                        status === 'completed' && styles.dayCircleCompleted,
                        status === 'current' && styles.dayCircleCurrent,
                        status === 'locked' && styles.dayCircleLocked,
                      ]}>
                        {status === 'completed' ? (
                          <CheckCircle size={32} color="#FFFFFF" fill="#4FFFB0" />
                        ) : status === 'locked' ? (
                          <Lock size={24} color="#999999" />
                        ) : (
                          <>
                            <Text style={styles.dayNumber}>{day.day_number}</Text>
                            {status === 'current' && (
                              <View style={styles.currentBadge}>
                                <Star size={16} color="#FFD700" fill="#FFD700" />
                              </View>
                            )}
                          </>
                        )}
                      </View>

                      <View style={styles.dayInfo}>
                        <Text style={[
                          styles.dayTitle,
                          status === 'locked' && styles.dayTitleLocked,
                        ]}>
                          {day.title_he}
                        </Text>
                        {status === 'current' && (
                          <Text style={styles.currentLabel}>← האימון של היום</Text>
                        )}
                        {status === 'completed' && (
                          <Text style={styles.completedLabel}>✓ הושלם</Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Character position for current day */}
                    {status === 'current' && (
                      <View style={styles.characterContainer}>
                        <Image
                          source={require('@/assets/images/icon.png')}
                          style={styles.character}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
          </View>

          {daysCompleted >= 30 && (
            <View style={styles.completionCard}>
              <Trophy size={48} color="#FFD700" />
              <Text style={styles.completionTitle}>כל הכבוד!</Text>
              <Text style={styles.completionText}>
                השלמת את המסלול! אתה מדהים! 🎉
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <DayDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        day={selectedDay}
        dayNumber={selectedDay?.day_number || 0}
        childName={childName}
        exercises={dayExercises}
        onExercisePress={handleExercisePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#1A1A1A',
    textAlign: 'right',
  },
  progressBar: {
    marginTop: 12,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'right',
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  trackContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'right',
  },
  trackDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'right',
  },
  journeyMap: {
    paddingVertical: 20,
  },
  dayRow: {
    position: 'relative',
    marginBottom: 32,
  },
  connectingLine: {
    width: 3,
    height: 32,
    backgroundColor: '#E0E0E0',
    marginBottom: -32,
    marginTop: -32,
    zIndex: 0,
  },
  dayStation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 1,
  },
  dayStationLeft: {
    alignSelf: 'flex-start',
  },
  dayStationRight: {
    alignSelf: 'flex-end',
  },
  dayCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  dayCircleCompleted: {
    backgroundColor: '#4FFFB0',
    borderColor: '#4FFFB0',
  },
  dayCircleCurrent: {
    backgroundColor: '#B4FF39',
    borderColor: '#B4FF39',
    shadowColor: '#B4FF39',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  dayCircleLocked: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
  },
  dayNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  dayInfo: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  dayTitleLocked: {
    color: '#999999',
  },
  currentLabel: {
    fontSize: 14,
    color: '#4FFFB0',
    fontWeight: '600',
  },
  completedLabel: {
    fontSize: 14,
    color: '#4FFFB0',
  },
  characterContainer: {
    position: 'absolute',
    left: 0,
    top: -16,
    zIndex: 2,
  },
  character: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  completionCard: {
    backgroundColor: '#FFF4E6',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 8,
  },
  completionText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#4FFFB0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 8,
  },
});
