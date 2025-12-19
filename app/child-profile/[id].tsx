import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  Eye,
  Target,
  Send,
  Calendar,
  Clock,
  Award,
  Edit,
  Check,
  X,
  Bell,
} from 'lucide-react-native';
import { getCurrentUser } from '@/lib/authService';
import { getChildren, getFamily, getChildAccessCode, updateChildProgress, type Child } from '@/lib/familyService';
import {
  getChildVisualAcuityLogs,
  getChildEyeFatigueLogs,
  getChildPracticeMetrics,
  getChildGoals,
  setChildGoal,
  sendEncouragement,
  type VisualAcuityLog,
  type EyeFatigueLog,
  type PracticeMetrics,
  type ChildGoal,
} from '@/lib/childMetricsService';
import { getChildPoints, type ChildPoints } from '@/lib/pointsService';
import { getParentNotifications, markParentNotificationAsRead, type ParentNotification } from '@/lib/notificationService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 80;

export default function ChildProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [child, setChild] = useState<Child | null>(null);
  const [visualAcuityLogs, setVisualAcuityLogs] = useState<VisualAcuityLog[]>([]);
  const [eyeFatigueLogs, setEyeFatigueLogs] = useState<EyeFatigueLog[]>([]);
  const [practiceMetrics, setPracticeMetrics] = useState<PracticeMetrics | null>(null);
  const [goals, setGoals] = useState<ChildGoal[]>([]);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEncouragementModal, setShowEncouragementModal] = useState(false);
  const [goalType, setGoalType] = useState<'daily' | 'weekly'>('daily');
  const [targetExercises, setTargetExercises] = useState('');
  const [targetMinutes, setTargetMinutes] = useState('');
  const [encouragementMessage, setEncouragementMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [dailyAccessCode, setDailyAccessCode] = useState<string | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');

  const [points, setPoints] = useState<ChildPoints | null>(null);
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.log('No user found');
        router.replace('/auth/parent-login');
        return;
      }

      const family = await getFamily(user.id);
      if (!family) {
        console.log('No family found for user:', user.id);
        router.back();
        return;
      }

      const childrenData = await getChildren(family.id);
      console.log('Children data:', childrenData);
      const currentChild = childrenData.find((c) => c.id === id);
      if (!currentChild) {
        console.log('Child not found with id:', id);
        router.back();
        return;
      }
      setChild(currentChild);
      setEditName(currentChild.name);
      setEditAge(currentChild.age.toString());

      const accessCodeData = await getChildAccessCode(id);
      setDailyAccessCode(accessCodeData.code);

      try {
        const [acuityLogs, fatigueLogs, metrics, childGoals, childPoints, parentNotifs] = await Promise.all([
          getChildVisualAcuityLogs(id, 30),
          getChildEyeFatigueLogs(id, 30),
          getChildPracticeMetrics(id),
          getChildGoals(id),
          getChildPoints(id),
          getParentNotifications(user.id),
        ]);

        setVisualAcuityLogs(acuityLogs);
        setEyeFatigueLogs(fatigueLogs);
        setPracticeMetrics(metrics);
        setGoals(childGoals);
        setPoints(childPoints);
        setNotifications(parentNotifs.filter(n => n.child_id === id).slice(0, 10));
      } catch (metricsError) {
        console.log('Error loading metrics (non-critical):', metricsError);
      }
    } catch (error) {
      console.error('Error loading child profile:', error);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [id]);

  const handleSetGoal = async () => {
    if (!child) return;

    const exercises = parseInt(targetExercises) || 0;
    const minutes = parseInt(targetMinutes) || 0;

    if (exercises === 0 && minutes === 0) {
      return;
    }

    setSending(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      await setChildGoal(child.id, user.id, goalType, exercises, minutes);
      await loadData();
      setShowGoalModal(false);
      setTargetExercises('');
      setTargetMinutes('');
    } catch (error) {
      console.error('Error setting goal:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSendEncouragement = async () => {
    if (!child || !encouragementMessage.trim()) return;

    setSending(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      await sendEncouragement(child.id, user.id, encouragementMessage.trim());
      setShowEncouragementModal(false);
      setEncouragementMessage('');
    } catch (error) {
      console.error('Error sending encouragement:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSaveChildDetails = async () => {
    if (!child || !editName.trim() || !editAge.trim()) return;

    const age = parseInt(editAge);
    if (isNaN(age) || age < 1 || age > 17) {
      return;
    }

    setSending(true);
    try {
      await updateChildProgress(child.id, {
        name: editName.trim(),
        age: age,
      });
      await loadData();
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating child details:', error);
    } finally {
      setSending(false);
    }
  };

  const handleCancelEdit = () => {
    if (child) {
      setEditName(child.name);
      setEditAge(child.age.toString());
    }
    setIsEditMode(false);
  };

  const handleNotificationPress = async (notification: ParentNotification) => {
    if (!notification.is_read) {
      try {
        await markParentNotificationAsRead(notification.id);
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

  if (!child) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B4FF39', '#4FFFB0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#1A1A1A" />
          </TouchableOpacity>

          {!isEditMode ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditMode(true)}
              activeOpacity={0.7}
            >
              <Edit size={20} color="#1A1A1A" />
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleCancelEdit}
                activeOpacity={0.7}
              >
                <X size={20} color="#FF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, styles.saveButton]}
                onPress={handleSaveChildDetails}
                disabled={sending}
                activeOpacity={0.7}
              >
                <Check size={20} color="#4FFFB0" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.headerContent}>
          <View style={styles.childAvatar}>
            <Text style={styles.childAvatarText}>
              {child.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          {!isEditMode ? (
            <>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childAge}>{child.age} שנים</Text>
            </>
          ) : (
            <View style={styles.editForm}>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="שם הילד"
                placeholderTextColor="#666"
                editable={!sending}
              />
              <TextInput
                style={styles.editInput}
                value={editAge}
                onChangeText={setEditAge}
                placeholder="גיל"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={2}
                editable={!sending}
              />
            </View>
          )}

          {dailyAccessCode && (
            <View style={styles.accessCodeBox}>
              <Text style={styles.accessCodeLabel}>קוד התחברות</Text>
              <Text style={styles.accessCodeValue}>{dailyAccessCode}</Text>
              <Text style={styles.accessCodeHint}>מתעדכן כל יום</Text>
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
        <View style={styles.section}>
          <View style={styles.pointsCard}>
            <View style={styles.pointsHeader}>
              <Award size={28} color="#FFD700" fill="#FFD700" />
              <Text style={styles.sectionTitle}>ניקוד {child?.name}</Text>
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
              <View style={styles.pointsDivider} />
              <View style={styles.pointsItem}>
                <Text style={styles.pointsValue}>{points?.total_points_earned || 0}</Text>
                <Text style={styles.pointsLabel}>סה"כ נצברו</Text>
              </View>
            </View>
          </View>
        </View>

        {notifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.notificationsHeader}>
              <Bell size={24} color="#4FFFB0" />
              <Text style={styles.sectionTitle}>עדכונים מ{child?.name}</Text>
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
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    {!notification.is_read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  {notification.notification_type === 'track_completed' && (
                    <Text style={styles.notificationAction}>לחץ לשליחת תגובה</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>מדדי תרגול</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Calendar size={24} color="#4FFFB0" />
              <Text style={styles.metricValue}>
                {practiceMetrics?.consecutiveDays || 0}
              </Text>
              <Text style={styles.metricLabel}>ימים רצופים</Text>
            </View>
            <View style={styles.metricCard}>
              <Award size={24} color="#4FFFB0" />
              <Text style={styles.metricValue}>
                {practiceMetrics?.exercisesThisWeek || 0}
              </Text>
              <Text style={styles.metricLabel}>תרגילים השבוע</Text>
            </View>
            <View style={styles.metricCard}>
              <Clock size={24} color="#4FFFB0" />
              <Text style={styles.metricValue}>
                {practiceMetrics?.totalMinutesThisWeek || 0}
              </Text>
              <Text style={styles.metricLabel}>דקות השבוע</Text>
            </View>
          </View>
        </View>

        {visualAcuityLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>שיפור בחדות ראייה</Text>
            <View style={styles.chartContainer}>
              <SimpleLineChart
                data={visualAcuityLogs.map((log) => ({
                  date: new Date(log.logged_at),
                  value: log.rating,
                }))}
                color="#4FFFB0"
                minValue={1}
                maxValue={5}
              />
            </View>
            <View style={styles.chartLegend}>
              <Text style={styles.legendText}>1 = גרוע יותר</Text>
              <Text style={styles.legendText}>5 = טוב הרבה יותר</Text>
            </View>
          </View>
        )}

        {eyeFatigueLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>רמת עייפות עיניים</Text>
            <View style={styles.chartContainer}>
              <SimpleLineChart
                data={eyeFatigueLogs.map((log) => ({
                  date: new Date(log.logged_at),
                  value: log.fatigue_level,
                }))}
                color="#FFB84D"
                minValue={1}
                maxValue={5}
              />
            </View>
            <View style={styles.chartLegend}>
              <Text style={styles.legendText}>1 = לא עייף</Text>
              <Text style={styles.legendText}>5 = עייף מאוד</Text>
            </View>
          </View>
        )}

        {practiceMetrics && practiceMetrics.recentCompletions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>תרגילים אחרונים</Text>
            {practiceMetrics.recentCompletions.slice(0, 5).map((completion, index) => (
              <View key={index} style={styles.completionCard}>
                <Text style={styles.completionDate}>
                  {new Date(completion.date).toLocaleDateString('he-IL', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
                <View style={styles.completionDetails}>
                  <Text style={styles.completionText}>
                    {completion.exercises_completed} תרגילים
                  </Text>
                  <Text style={styles.completionText}>
                    {Math.floor(completion.total_duration_seconds / 60)} דקות
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>יעדים נוכחיים</Text>
            {goals.map((goal) => (
              <View key={goal.id} style={styles.goalCard}>
                <Target size={20} color="#4FFFB0" />
                <View style={styles.goalContent}>
                  <Text style={styles.goalType}>
                    יעד {goal.goal_type === 'daily' ? 'יומי' : 'שבועי'}
                  </Text>
                  <Text style={styles.goalText}>
                    {goal.target_exercises > 0 && `${goal.target_exercises} תרגילים`}
                    {goal.target_exercises > 0 && goal.target_minutes > 0 && ' • '}
                    {goal.target_minutes > 0 && `${goal.target_minutes} דקות`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowEncouragementModal(true)}
            activeOpacity={0.8}
          >
            <Send size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>שלח עידוד</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => setShowGoalModal(true)}
            activeOpacity={0.8}
          >
            <Target size={20} color="#1A1A1A" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              הגדר יעד
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>הגדר יעד חדש</Text>

            <View style={styles.goalTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.goalTypeButton,
                  goalType === 'daily' && styles.goalTypeButtonActive,
                ]}
                onPress={() => setGoalType('daily')}
              >
                <Text
                  style={[
                    styles.goalTypeText,
                    goalType === 'daily' && styles.goalTypeTextActive,
                  ]}
                >
                  יומי
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.goalTypeButton,
                  goalType === 'weekly' && styles.goalTypeButtonActive,
                ]}
                onPress={() => setGoalType('weekly')}
              >
                <Text
                  style={[
                    styles.goalTypeText,
                    goalType === 'weekly' && styles.goalTypeTextActive,
                  ]}
                >
                  שבועי
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="מספר תרגילים"
              value={targetExercises}
              onChangeText={setTargetExercises}
              keyboardType="number-pad"
              placeholderTextColor="#999"
              textAlign="right"
            />

            <TextInput
              style={styles.input}
              placeholder="דקות תרגול"
              value={targetMinutes}
              onChangeText={setTargetMinutes}
              keyboardType="number-pad"
              placeholderTextColor="#999"
              textAlign="right"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSetGoal}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <Text style={styles.modalButtonText}>שמור</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEncouragementModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEncouragementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>שלח הודעת עידוד</Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="כתוב הודעה..."
              value={encouragementMessage}
              onChangeText={setEncouragementMessage}
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
              textAlign="right"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSendEncouragement}
                disabled={sending || !encouragementMessage.trim()}
              >
                {sending ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <Text style={styles.modalButtonText}>שלח</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowEncouragementModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SimpleLineChart({
  data,
  color,
  minValue,
  maxValue,
}: {
  data: { date: Date; value: number }[];
  color: string;
  minValue: number;
  maxValue: number;
}) {
  if (data.length === 0) return null;

  const chartHeight = 150;
  const chartPadding = 20;
  const pointRadius = 4;

  const xStep = CHART_WIDTH / (data.length - 1 || 1);
  const yRange = maxValue - minValue;

  return (
    <View style={[styles.chart, { height: chartHeight }]}>
      {data.map((point, index) => {
        const x = index * xStep;
        const y =
          chartHeight -
          chartPadding -
          ((point.value - minValue) / yRange) * (chartHeight - 2 * chartPadding);

        const nextPoint = data[index + 1];
        const showLine = nextPoint !== undefined;

        return (
          <View key={index}>
            {showLine && (
              <View
                style={[
                  styles.chartLine,
                  {
                    left: x + pointRadius,
                    top: y + pointRadius,
                    width: Math.sqrt(
                      Math.pow(xStep, 2) +
                        Math.pow(
                          chartHeight -
                            chartPadding -
                            ((nextPoint.value - minValue) / yRange) *
                              (chartHeight - 2 * chartPadding) -
                            y,
                          2
                        )
                    ),
                    transform: [
                      {
                        rotate: `${Math.atan2(
                          chartHeight -
                            chartPadding -
                            ((nextPoint.value - minValue) / yRange) *
                              (chartHeight - 2 * chartPadding) -
                            y,
                          xStep
                        )}rad`,
                      },
                    ],
                    backgroundColor: color,
                  },
                ]}
              />
            )}
            <View
              style={[
                styles.chartPoint,
                {
                  left: x,
                  top: y,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
        );
      })}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
  },
  headerContent: {
    alignItems: 'center',
    gap: 8,
  },
  accessCodeBox: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  accessCodeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  accessCodeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 8,
  },
  accessCodeHint: {
    fontSize: 12,
    color: '#999',
  },
  editForm: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
    marginTop: 8,
  },
  editInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  childAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  childName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  childAge: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  chartContainer: {
    marginVertical: 8,
  },
  chart: {
    width: CHART_WIDTH,
    position: 'relative',
  },
  chartPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
  chartLine: {
    height: 2,
    position: 'absolute',
    transformOrigin: 'left center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666666',
  },
  completionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  completionDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  completionDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  completionText: {
    fontSize: 14,
    color: '#666666',
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  goalContent: {
    flex: 1,
    gap: 4,
  },
  goalType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4FFFB0',
    textAlign: 'right',
  },
  goalText: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'right',
  },
  actionButtons: {
    gap: 12,
    paddingBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4FFFB0',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4FFFB0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#1A1A1A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  goalTypeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  goalTypeButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  goalTypeButtonActive: {
    backgroundColor: '#4FFFB0',
  },
  goalTypeText: {
    fontSize: 16,
    color: '#666666',
  },
  goalTypeTextActive: {
    color: '#1A1A1A',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#4FFFB0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F5F5F5',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: '#666666',
  },
  pointsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4FFFB0',
  },
  pointsLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  pointsDivider: {
    width: 2,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  notificationItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationItemUnread: {
    backgroundColor: '#E8FFF5',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'right',
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    lineHeight: 20,
  },
  notificationAction: {
    fontSize: 13,
    color: '#4FFFB0',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'right',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4FFFB0',
  },
});
