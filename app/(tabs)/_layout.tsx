import { Tabs } from 'expo-router';
import { Home, GalleryVertical, Settings, BookOpen, User, TrendingUp } from 'lucide-react-native';
import { useTexts } from '@/hooks/useTexts';
import { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getCurrentUser } from '@/lib/authService';

export default function TabLayout() {
  const { getText } = useTexts();
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserType();
  }, []);

  const loadUserType = async () => {
    try {
      const user = await getCurrentUser();
      if (user?.user_metadata?.user_type) {
        setUserType(user.user_metadata.user_type);
      } else {
        setUserType('parent');
      }
    } catch (error) {
      console.error('Error loading user type:', error);
      setUserType('parent');
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4FFFB0',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: getText('navigation.home', 'בית'),
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: getText('navigation.exercises', 'תרגילים'),
          tabBarIcon: ({ size, color }) => (
            <GalleryVertical size={size} color={color} />
          ),
          href: isChild ? '/gallery' : null,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: getText('navigation.progress', 'התקדמות'),
          tabBarIcon: ({ size, color }) => (
            <TrendingUp size={size} color={color} />
          ),
          href: isChild ? '/progress' : null,
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: getText('navigation.info', 'מידע'),
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} />
          ),
          href: isChild ? null : '/info',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: isChild ? getText('navigation.profile', 'פרופיל') : getText('navigation.settings', 'הגדרות'),
          tabBarIcon: ({ size, color }) => (
            isChild ? <User size={size} color={color} /> : <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});
