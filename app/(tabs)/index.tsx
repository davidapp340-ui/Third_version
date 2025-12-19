import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Home, Plus, TrendingUp } from 'lucide-react-native';
import { useScreenTexts } from '@/hooks/useTexts';
import { getCurrentUser } from '@/lib/authService';
import {
  getParentProfile,
  getFamily,
  getChildren,
  getResearchMessages,
  type Child,
} from '@/lib/familyService';
import ChildHomeScreen from '@/components/ChildHomeScreen';

export default function HomeScreen() {
  const [userType, setUserType] = useState<string>('parent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserType();
  }, []);

  const loadUserType = async () => {
    try {
      const user = await getCurrentUser();
      if (user?.user_metadata?.user_type) {
        setUserType(user.user_metadata.user_type);
      }
    } catch (error) {
      console.error('Error loading user type:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4FFFB0" />
      </View>
    );
  }

  const isChild = userType === 'child_independent' || userType === 'child';

  if (isChild) {
    return <ChildHomeScreen />;
  }

  return <ParentHomeScreen />;
}

function ParentHomeScreen() {
  const router = useRouter();
  const { getText, loading: textsLoading } = useScreenTexts('parent_home');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [parentName, setParentName] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [researchMessage, setResearchMessage] = useState('');

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/auth/parent-login');
        return;
      }

      const parent = await getParentProfile(user.id);
      if (parent) {
        setParentName(parent.first_name);

        const family = await getFamily(user.id);
        if (family) {
          const childrenData = await getChildren(family.id);
          setChildren(childrenData);
        }
      }

      const messages = await getResearchMessages();
      if (messages && messages.length > 0) {
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        setResearchMessage(randomMessage.message_key);
      }
    } catch (error) {
      console.error('Error loading parent home data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleAddChild = () => {
    router.push('/add-child');
  };

  const handleChildPress = (child: Child) => {
    router.push(`/child-profile/${child.id}`);
  };

  if (loading || textsLoading) {
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
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>
            {getText('parent_home.hello', 'שלום')}{' '}
            {parentName}!
          </Text>
          {researchMessage && (
            <View style={styles.researchMessageContainer}>
              <TrendingUp size={16} color="#1A1A1A" />
              <Text style={styles.researchMessage}>
                {getText(researchMessage, 'תודה על התרומה למחקר!')}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <Home size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>
              {getText('parent_home.no_children', 'עדיין לא הוספת ילדים')}
            </Text>
            <Text style={styles.emptyDescription}>
              {getText('parent_home.add_first_child', 'לחץ על + כדי להוסיף את הילד הראשון')}
            </Text>
          </View>
        ) : (
          <View style={styles.childrenGrid}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={styles.childCard}
                onPress={() => handleChildPress(child)}
                activeOpacity={0.7}
              >
                <View style={styles.childAvatar}>
                  <Text style={styles.childAvatarText}>
                    {child.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childAge}>{child.age} שנים</Text>
                <View style={styles.childStats}>
                  <Text style={styles.childProgress}>
                    שלב {child.current_step} מתוך {child.total_steps}
                  </Text>
                  {child.consecutive_days > 0 && (
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakText}>
                        🔥 {child.consecutive_days}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddChild}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#4FFFB0', '#4DD9D9']}
          style={styles.addButtonGradient}
        >
          <Plus size={32} color="#1A1A1A" strokeWidth={3} />
        </LinearGradient>
      </TouchableOpacity>
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
    gap: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  researchMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  researchMessage: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666666',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  childrenGrid: {
    gap: 16,
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4FFFB0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  childAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  childName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  childAge: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  childStats: {
    width: '100%',
    gap: 8,
  },
  childProgress: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  streakBadge: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
