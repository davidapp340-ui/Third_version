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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CheckCircle, Lock, Star, Trophy } from 'lucide-react-native';

// שימוש בשירות האימות החדש והמרוכז
import { checkAuthState } from '@/lib/authService';
import {
  getUserActiveTrackProgress,
  getTrackWithDays,
  getTrackDayExercises,
  type UserProgressWithTrack,
  type TrackWithDays,
  type TrackDay,
} from '@/lib/trackService';
import { getExerciseById } from '@/lib/exercisesService';
import { DayDetailModal } from '@/components/DayDetailModal';

export default function ProgressScreen() {
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [childName, setChildName] = useState<string>('');
  const [childId, setChildId] = useState<string | null>(null);
  
  // Data State
  const [progress, setProgress] = useState<UserProgressWithTrack | null>(null);
  const [trackWithDays, setTrackWithDays] = useState<TrackWithDays | null>(null);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<TrackDay | null>(null);
  const [dayExercises, setDayExercises] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. קבלת המצב הנוכחי משירות האימות (מטפל גם בהורה וגם בילד)
      const authState = await checkAuthState();
      
      if (!authState.isAuthenticated || !authState.activeChild) {
        // אם אין משתמש או לא נבחר ילד, מחזיר למסך הראשי
        router.replace('/');
        return;
      }

      const currentChild = authState.activeChild;
      setChildId(currentChild.id);
      setChildName(currentChild.name);

      // 2. שליפת ההתקדמות של הילד
      // הנחת עבודה: ה-Trigger בבסיס הנתונים כבר יצר את המסלול
      const userProgress = await getUserActiveTrackProgress(currentChild.id);

      if (userProgress) {
        setProgress(userProgress);
        
        // 3. שליפת פרטי המסלול המלאים
        const track = await getTrackWithDays(userProgress.track_id);
        setTrackWithDays(track);
      } else {
        console.log('No active track found for child ID:', currentChild.id);
        // במצב תקין זה לא אמור לקרות אם ה-DB Trigger עובד
      }
    } catch (err) {
      console.error('Error loading progress:', err);
      Alert.alert('שגיאה', 'לא ניתן לטעון את נתוני ההתקדמות');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleDayPress = async (day: TrackDay) => {
    if (!progress || !childId) return;

    // בדיקת הרשאות גישה ליום
    const isCompleted = progress.days_completed.includes(day.day_number);
    const isCurrentDay = day.day_number === progress.current_day;
    // יום קודם הושלם או שזה היום הראשון
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4FFFB0" />
      </View>
    );
  }

  // מצב שגיאה / אין מסלול (לא אמור לקרות ב-Happy Path)
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
          <Text style={styles.emptyTitle}>לא נמצא מסלול פעיל</Text>
          <Text style={styles.emptyDescription}>
            נראה שעדיין לא הוגדר עבורך מסלול אימון.
            אנא פנה להורה או לתמיכה.
          </Text>
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
             שלום {childName} • יום {dayOfMonth} מתוך 30
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
              {daysCompleted}/30 ימים הושלמו
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
});