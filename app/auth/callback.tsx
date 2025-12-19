import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { handleOAuthCallback } from '@/lib/authService';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const userType = (params.type as 'parent' | 'child_independent') || 'parent';
      await handleOAuthCallback(userType);

      router.replace('/(tabs)');
    } catch (error) {
      console.error('OAuth callback error:', error);
      router.replace('/user-type');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4FFFB0" />
      <Text style={styles.text}>מתחבר...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    gap: 16,
  },
  text: {
    fontSize: 18,
    color: '#1A1A1A',
  },
});
