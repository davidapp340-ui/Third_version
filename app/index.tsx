import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { checkAuthState } from '@/lib/authService';

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const authState = await checkAuthState();
      
      if (authState.loading) return;

      if (authState.isAuthenticated) {
        if (authState.userType === 'parent') {
          router.replace('/(tabs)'); // או למסך בחירת ילד אם קיים
        } else {
          // ילד (מקושר או עצמאי) הולך ישר ל-Progress
          router.replace('/(tabs)/progress');
        }
      } else {
        // לא מחובר -> מסך בחירת סוג כניסה
        router.replace('/user-type');
      }
      setLoading(false);
    }

    init();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#4FFFB0" />
    </View>
  );
}