import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Play, Headphones, ExternalLink, CircleCheck as CheckCircle } from 'lucide-react-native';
import { getExerciseById, type Exercise } from '@/lib/exercisesService';
import { getCurrentUser } from '@/lib/authService';
import { getChildByUserId } from '@/lib/familyService';
import { awardGalleryWorkoutPoint } from '@/lib/pointsService';

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadExercise();
  }, [id]);

  const loadExercise = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        setError('מזהה תרגיל לא חוקי');
        setLoading(false);
        return;
      }

      const exerciseData = await getExerciseById(id);

      if (!exerciseData) {
        setError('לא נמצא תרגיל זה');
      } else {
        setExercise(exerciseData);
      }
    } catch (error) {
      console.error('Error loading exercise details:', error);
      setError('אירעה שגיאה בטעינת פרטי התרגיל');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleCompleteExercise = async () => {
    if (completed || !id) return;

    setCompleting(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('שגיאה', 'יש להתחבר מחדש');
        return;
      }

      const child = await getChildByUserId(user.id);
      if (!child) {
        Alert.alert('שגיאה', 'לא נמצא פרופיל ילד');
        return;
      }

      await awardGalleryWorkoutPoint(child.id, id);
      setCompleted(true);
      Alert.alert(
        'כל הכבוד!',
        'קיבלת נקודה על השלמת התרגיל 🎉',
        [{ text: 'אישור' }]
      );
    } catch (error) {
      console.error('Error completing exercise:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לשמור את ההשלמה. נסה שוב.');
    } finally {
      setCompleting(false);
    }
  };

  const openMediaLink = async (url: string, mediaType: string) => {
    if (!url || url === 'FALSE') {
      alert(`לינק ה${mediaType === 'Video' ? 'וידאו' : 'אודיו'} לא זמין כרגע`);
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        alert('לא ניתן לפתוח את הלינק');
      }
    } catch (error) {
      console.error('Error opening media link:', error);
      alert('אירעה שגיאה בפתיחת הלינק');
    }
  };

  const getMediaIcon = (mediaType: string) => {
    const lowerMediaType = mediaType.toLowerCase();
    if (lowerMediaType === 'video') {
      return <Play size={32} color="#FFFFFF" fill="#FFFFFF" />;
    }
    if (lowerMediaType === 'audio') {
      return <Headphones size={32} color="#FFFFFF" />;
    }
    return <Play size={32} color="#FFFFFF" fill="#FFFFFF" />;
  };

  const getGradientColors = (mediaType: string): readonly [string, string] => {
    const lowerMediaType = mediaType.toLowerCase();
    if (lowerMediaType === 'video') {
      return ['#FF6B6B', '#FF8E53'] as const;
    }
    if (lowerMediaType === 'audio') {
      return ['#4ECDC4', '#44A3A3'] as const;
    }
    return ['#B4FF39', '#4FFFB0'] as const;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4FFFB0" />
      </View>
    );
  }

  if (error || !exercise) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#B4FF39', '#4FFFB0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowRight size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>פרטי תרגיל</Text>
        </LinearGradient>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'אירעה שגיאה'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadExercise}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>נסה שוב</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const hasVideoLink = exercise.video_link && exercise.video_link !== 'FALSE';
  const hasAudioLink = exercise.audio_link && exercise.audio_link !== 'FALSE';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradientColors(exercise.media_type)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowRight size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{exercise.exercise_name}</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mediaTypeCard}>
          <View style={styles.mediaIconContainer}>
            {getMediaIcon(exercise.media_type)}
          </View>
          <View style={styles.mediaTypeInfo}>
            <Text style={styles.mediaTypeLabel}>סוג התרגיל</Text>
            <Text style={styles.mediaTypeText}>
              {exercise.media_type === 'Video' ? 'תרגיל וידאו' : 'תרגיל אודיו'}
            </Text>
          </View>
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>הוראות</Text>
          <Text style={styles.descriptionText}>{exercise.description}</Text>
        </View>

        <View style={styles.mediaLinksContainer}>
          <Text style={styles.sectionTitle}>תוכן התרגיל</Text>

          {hasVideoLink && (
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => openMediaLink(exercise.video_link, 'Video')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mediaButtonGradient}
              >
                <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.mediaButtonText}>פתח וידאו</Text>
                <ExternalLink size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {hasAudioLink && (
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => openMediaLink(exercise.audio_link, 'Audio')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A3A3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mediaButtonGradient}
              >
                <Headphones size={24} color="#FFFFFF" />
                <Text style={styles.mediaButtonText}>פתח אודיו</Text>
                <ExternalLink size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {!hasVideoLink && !hasAudioLink && (
            <View style={styles.noMediaCard}>
              <Text style={styles.noMediaText}>
                תוכן המדיה יתעדכן בקרוב
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>טיפים לתרגול</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>🎯</Text>
            <Text style={styles.tipText}>תרגל במקום שקט ונוח</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>⏰</Text>
            <Text style={styles.tipText}>תרגל באותה שעה כל יום</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>💪</Text>
            <Text style={styles.tipText}>עקביות היא המפתח להצלחה</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>😊</Text>
            <Text style={styles.tipText}>תהנה מהתהליך!</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.completeButton, completed && styles.completeButtonCompleted]}
          onPress={handleCompleteExercise}
          disabled={completing || completed}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={completed ? ['#4FFFB0', '#4FFFB0'] : ['#B4FF39', '#4FFFB0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.completeButtonGradient}
          >
            {completing ? (
              <ActivityIndicator size="small" color="#1A1A1A" />
            ) : (
              <>
                <CheckCircle size={24} color="#1A1A1A" />
                <Text style={styles.completeButtonText}>
                  {completed ? 'התרגיל הושלם ✓' : 'סיימתי את התרגיל'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleBack}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#4DD9D9', '#4FFFB0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.doneButtonGradient}
          >
            <Text style={styles.doneButtonText}>חזור לספריה</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'right',
    lineHeight: 36,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#D32F2F',
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4FFFB0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaTypeInfo: {
    flex: 1,
    gap: 4,
  },
  mediaTypeLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  mediaTypeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'right',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1A1A1A',
    textAlign: 'right',
  },
  mediaLinksContainer: {
    gap: 12,
  },
  mediaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mediaButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  mediaButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  noMediaCard: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  noMediaText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'right',
    marginBottom: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'flex-end',
  },
  tipBullet: {
    fontSize: 24,
  },
  tipText: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'right',
    flex: 1,
  },
  completeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 8,
  },
  completeButtonCompleted: {
    opacity: 0.8,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  completeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  doneButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  doneButtonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
});
