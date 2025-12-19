import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './context/AuthContext';

export default function Index() {
  const router = useRouter();
  const { session, userProfile, activeChild, isLoading, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (session && userProfile) {
      if (userProfile.role === 'parent') {
        router.replace('/(tabs)');
      } else {
        router.replace('/(tabs)/progress');
      }
    } else if (activeChild?.is_linked_device) {
      router.replace('/(tabs)/progress');
    } else {
      router.replace('/user-type');
    }
  }, [isInitialized, isLoading, session, userProfile, activeChild]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A1628' }}>
      <ActivityIndicator size="large" color="#4FFFB0" />
    </View>
  );
}