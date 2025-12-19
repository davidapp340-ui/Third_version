import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Star, TrendingUp, Target, Info, Award, Bell, Heart, ThumbsUp, Smile } from 'lucide-react-native';
import { getCurrentUser } from '@/lib/authService';
import { getChildByUserId } from '@/lib/familyService';
import type { Child } from '@/lib/familyService';
import { getChildPoints, type ChildPoints } from '@/lib/pointsService';
import { getChildNotifications, markChildNotificationAsRead, type ChildNotification } from '@/lib/notificationService';

export default function ChildHomeScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [childName, setChildName] = useState('');
  const [childData, setChildData] = useState<Child | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [dailyMessage, setDailyMessage] = useState('');
  const [points, setPoints] = useState<ChildPoints | null>(null);
  const [notifications, setNotifications] = useState<ChildNotification[]>([]);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/auth/child-login');
        return;
      }

      const firstName = user.user_metadata?.first_name || 'ידידי';
      setChildName(firstName);

      const child = await getChildByUserId(user.id);
      if (child) {
        setChildData(child);
        setIsLinked(child.is_linked);
        generateDailyMessage(child);

        try {
          const childPoints = await getChildPoints(child.id);
          setPoints(childPoints);
        } catch (error) {
          console.error('Error loading points:', error);
        }

        try {
          const childNotifications = await getChildNotifications(child.id);
          setNotifications(childNotifications.slice(0, 5));
        } catch (error) {
          console.error('Error loading notifications:', error);
        }
      }
    } catch (error) {
      console.error('Error loading child home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDailyMessage = (child: Child) => {
    const messages = [
      'כל הכבוד! השלמת את כל התרגילים אתמול!',
      'אל תשכח להתאמן היום!',
      'אתה עושה עבודה מצוינת!',
      'כבר תרגלת היום? בוא נמשיך!',
    ];

    if (child.last_practice_date) {
      const today = new Date().toDateString();
      const lastPractice = new Date(child.last_practice_date).toDateString();
      if (today === lastPractice) {
        setDailyMessage('כל הכבוד! השלמת את התרגיל היומי! 🎉');
        return;
      }
    }

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setDailyMessage(randomMessage);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleStartPractice = () => {
    router.push('/(tabs)/progress');
  };

  const handleViewProgress = () => {
    router.push('/(tabs)/progress');
  };

  const calculateWeeklyProgress = () => {
    if (!childData) return 0;
    return Math.min(childData.consecutive_days, 7);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'parent_reaction':
        return <Heart size={20} color="#FF6B9D" fill="#FF6B9D" />;
      case 'free_day_available':
        return <Award size={20} color="#FFD700" fill="#FFD700" />;
      default:
        return <Bell size={20} color="#4FFFB0" />;
    }
  };

  const handleNotificationPress = async (notification: ChildNotification) => {
    if (!notification.is_read) {
      try {
        await markChildNotificationAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
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
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>שלום, {childName}! 👋</Text>
          <Text style={styles.subGreeting}>איך אתה היום?</Text>
          {isLinked && (
            <Text style={styles.parentNote}>אמא/אבא רואים את ההתקדמות שלך</Text>
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
        {dailyMessage && (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{dailyMessage}</Text>
          </View>
        )}

        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <Award size={28} color="#FFD700" fill="#FFD700" />
            <Text style={styles.pointsTitle}>הניקוד שלי</Text>
          </View>
          <View style={styles.pointsContent}>
            <View style={styles.pointsItem}>
              <Text style={styles.pointsValue}>{points?.points_balance || 0}</Text>
              <Text style={styles.pointsLabel}>נקודות</Text>
            </View>
            <View style={styles.pointsDivider} />
            <View style={styles.pointsItem}>
              <Text style={styles.pointsValue}>{points?.free_days_available || 0}</Text>
              <Text style={styles.pointsLabel}>ימי חופש</Text>
            </View>
          </View>
          {points && points.points_balance >= 70 && points.free_days_available === 0 && (
            <View style={styles.pointsNote}>
              <Text style={styles.pointsNoteText}>
                🎉 יש לך מספיק נקודות ליום חופש! עבור לעמוד ההתקדמות כדי לממש
              </Text>
            </View>
          )}
        </View>

        {notifications.length > 0 && (
          <View style={styles.notificationsCard}>
            <View style={styles.notificationsHeader}>
              <Bell size={24} color="#4FFFB0" />
              <Text style={styles.notificationsTitle}>התראות</Text>
            </View>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.is_read && styles.notificationItemUnread,
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationIcon}>
                  {getNotificationIcon(notification.notification_type)}
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                </View>
                {!notification.is_read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleStartPractice}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#4DD9D9', '#4FFFB0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainButtonGradient}
          >
            <Target size={32} color="#1A1A1A" />
            <Text style={styles.mainButtonText}>התחל תרגול יומי</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>ההתקדמות שלך השבוע</Text>

          <View style={styles.weekProgress}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <View
                key={day}
                style={[
                  styles.dayCircle,
                  day <= calculateWeeklyProgress() && styles.dayCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    day <= calculateWeeklyProgress() && styles.dayTextActive,
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.progressText}>
            תרגלת {calculateWeeklyProgress()} מתוך 7 ימים השבוע
          </Text>

          {childData && (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Star size={24} color="#FFD700" fill="#FFD700" />
                <Text style={styles.statNumber}>{childData.current_step}</Text>
                <Text style={styles.statLabel}>שלב נוכחי</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>🔥</Text>
                <Text style={styles.statNumber}>{childData.consecutive_days}</Text>
                <Text style={styles.statLabel}>ימים רצופים</Text>
              </View>
            </View>
          )}

          {isLinked && (
            <View style={styles.parentBadge}>
              <Text style={styles.parentBadgeText}>ההורים שלך רואים את ההתקדמות 🚀</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.progressButton}
          onPress={handleViewProgress}
          activeOpacity={0.7}
        >
          <TrendingUp size={20} color="#4FFFB0" />
          <Text style={styles.progressButtonText}>ההתקדמות שלי 📊</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.visionButton}
          onPress={() => setShowVisionModal(true)}
          activeOpacity={0.7}
        >
          <Info size={16} color="#666" />
          <Text style={styles.visionButtonText}>על המחקר שלנו</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showVisionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVisionModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#B4FF39', '#4FFFB0', '#4DD9D9']}
            locations={[0, 0.5, 1]}
            style={styles.modalGradient}
          >
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>החזון שלנו</Text>

              <Text style={styles.modalText}>
                אנחנו חברה שמתמקדת במחקר ופיתוח של טכנולוגיה חדשנית לשיפור הראייה אצל ילדים.
              </Text>

              <Text style={styles.modalText}>
                המטרה שלנו היא ליצור פתרונות ללא צורך בניתוחים או משקפיים, באמצעות תרגילים ממוקדים שמשפרים את יכולת העיניים באופן טבעי.
              </Text>

              <Text style={styles.modalText}>
                כל תרגיל שאתה עושה עוזר לנו ללמוד ולשפר את הטכנולוגיה, ובכך לעזור לילדים נוספים בכל העולם!
              </Text>

              <Text style={styles.modalHighlight}>
                אתה חלק ממשהו גדול! 🌟
              </Text>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowVisionModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>סגור</Text>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
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
    gap: 4,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  subGreeting: {
    fontSize: 18,
    color: '#1A1A1A',
    textAlign: 'right',
  },
  parentNote: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'right',
    marginTop: 4,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '500',
  },
  mainButton: {
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mainButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
    borderRadius: 20,
  },
  mainButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  progressSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    marginBottom: 16,
    textAlign: 'right',
  },
  weekProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleActive: {
    backgroundColor: '#4FFFB0',
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
  dayTextActive: {
    color: '#1A1A1A',
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statEmoji: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  parentBadge: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  parentBadgeText: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '500',
  },
  progressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  visionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  visionButtonText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 32,
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'right',
  },
  modalHighlight: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  modalCloseButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  pointsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  pointsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  pointsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  pointsItem: {
    alignItems: 'center',
    flex: 1,
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4FFFB0',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  pointsDivider: {
    width: 2,
    height: 50,
    backgroundColor: '#E0E0E0',
  },
  pointsNote: {
    marginTop: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 12,
  },
  pointsNoteText: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  notificationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  notificationsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    marginBottom: 8,
  },
  notificationItemUnread: {
    backgroundColor: '#E8FFF5',
  },
  notificationIcon: {
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'right',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4FFFB0',
    marginTop: 6,
  },
});
