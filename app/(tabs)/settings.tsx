import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useScreenTexts } from '@/hooks/useTexts';
import { LogOut, Settings, Mail, User, HelpCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { signOut, getCurrentUser } from '@/lib/authService';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function SettingsScreen() {
  const { getText } = useScreenTexts('settings');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userType, setUserType] = useState<string>('');
  const [checkingUser, setCheckingUser] = useState(true);
  const hasNavigated = useRef(false);

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
      setCheckingUser(false);
    }
  };

  const navigationItems = [
    {
      id: 'personal-info',
      title: 'Personal Information',
      description: 'View and manage your personal details',
      icon: User,
      route: '/child-profile-independent/personal-info',
      color: '#4A90E2',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Customize your preferences',
      icon: Settings,
      route: '/child-profile-independent/settings',
      color: '#50C878',
    },
    {
      id: 'contact',
      title: 'Contact',
      description: 'Reach out for support or feedback',
      icon: Mail,
      route: '/child-profile-independent/contact',
      color: '#FFA500',
    },
    {
      id: 'qa',
      title: 'Questions & Answers',
      description: 'Find answers to common questions',
      icon: HelpCircle,
      route: '/child-profile-independent/qa',
      color: '#E74C3C',
    },
  ];

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    setLoading(true);
    try {
      await signOut();
      router.replace('/user-type');
    } catch (error) {
      console.error('Logout error:', error);
      alert('שגיאה: לא ניתן להתנתק. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const isParent = userType === 'parent';
  const isChild = userType === 'child' || userType === 'child_independent';
  const isChildIndependent = userType === 'child_independent';

  if (checkingUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4FFFB0" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{getText('settings.title', 'הגדרות')}</Text>
        <Text style={styles.description}>{getText('settings.description', 'נהל את ההעדפות שלך')}</Text>

        {isChildIndependent && (
          <View style={styles.menuContainer}>
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.7}>
                  <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                    <IconComponent size={24} color="#fff" />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuDescription}>{item.description}</Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
            activeOpacity={0.7}
          >
            <LogOut size={24} color="#DC2626" />
            <Text style={styles.logoutText}>התנתק מהמכשיר</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>התנתק מהחשבון</Text>
            <Text style={styles.modalMessage}>
              {isChild
                ? 'האם אתה בטוח שברצונך להתנתק?\nתצטרך להזין את הקוד שוב בפעם הבאה.'
                : 'האם אתה בטוח שברצונך להתנתק?\nתצטרך להתחבר שוב עם המייל והסיסמה שלך.'}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleLogoutConfirm}
              >
                <Text style={styles.confirmButtonText}>התנתק</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'right',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'right',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  logoutText: {
    fontSize: 18,
    color: '#DC2626',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuContainer: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#CCC',
    marginLeft: 8,
  },
});
