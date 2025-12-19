import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Play, Headphones } from 'lucide-react-native';
import { getCurrentUser } from '@/lib/authService';
import {
  getExercisesByCategory,
  type CategoryGroup,
} from '@/lib/exercisesService';

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUserAccessAndLoadData();
  }, []);

  const checkUserAccessAndLoadData = async () => {
    try {
      const user = await getCurrentUser();
      const userType = user?.user_metadata?.user_type;

      if (userType === 'parent') {
        router.replace('/(tabs)');
        return;
      }

      await loadExercises();
    } catch (error) {
      console.error('Error checking user access:', error);
      setError('אירעה שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      setError(null);
      const categoryGroups = await getExercisesByCategory();
      setCategories(categoryGroups);
    } catch (error) {
      console.error('Error loading exercises:', error);
      setError('לא הצלחנו לטעון את התרגילים');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadExercises();
    setRefreshing(false);
  }, []);

  const handleExercisePress = (exerciseId: string) => {
    router.push(`/exercise/${exerciseId}`);
  };

  const getMediaIcon = (mediaType: string) => {
    const lowerMediaType = mediaType.toLowerCase();
    if (lowerMediaType === 'video') {
      return <Play size={24} color="#FFFFFF" fill="#FFFFFF" />;
    }
    if (lowerMediaType === 'audio') {
      return <Headphones size={24} color="#FFFFFF" />;
    }
    return <Play size={24} color="#FFFFFF" fill="#FFFFFF" />;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4FFFB0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B4FF39', '#4FFFB0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>ספריית תרגילים</Text>
        <Text style={styles.headerSubtitle}>בחר תרגיל להתחלה</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadExercises}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>נסה שוב</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && categories.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>ספריית תרגילים ריקה</Text>
            <Text style={styles.emptySubtext}>
              התרגילים יתעדכנו כשמוסיפים אותם למערכת
            </Text>
          </View>
        )}

        {!error && categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {categories.map((categoryGroup, categoryIndex) => (
              <View key={categoryIndex} style={styles.categorySection}>
                <View
                  style={[
                    styles.categoryHeader,
                    { backgroundColor: categoryGroup.color },
                  ]}
                >
                  <Text style={styles.categoryTitle}>
                    {categoryGroup.category}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {categoryGroup.exercises.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.exercisesGrid}>
                  {categoryGroup.exercises.map((exercise, exerciseIndex) => (
                    <TouchableOpacity
                      key={exerciseIndex}
                      style={styles.exerciseCard}
                      onPress={() => handleExercisePress(exercise.id)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.exerciseIconContainer,
                          { backgroundColor: categoryGroup.color },
                        ]}
                      >
                        {getMediaIcon(exercise.media_type || '')}
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName} numberOfLines={2}>
                          {exercise.exercise_name}
                        </Text>
                        <View style={styles.exerciseTypeContainer}>
                          <Text style={styles.exerciseType}>
                            {exercise.media_type === 'Video' ? '🎥 וידאו' : '🎧 אודיו'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'right',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  categoriesContainer: {
    gap: 24,
  },
  categorySection: {
    gap: 16,
  },
  categoryHeader: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    minWidth: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  categoryBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  exercisesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
    minWidth: '100%',
  },
  exerciseIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseInfo: {
    flex: 1,
    gap: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'right',
    lineHeight: 24,
  },
  exerciseTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  exerciseType: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
});
