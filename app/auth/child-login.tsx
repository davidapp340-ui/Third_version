import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { linkChildWithCode } from '@/lib/familyService';
import { useTexts } from '@/hooks/useTexts';

export default function ChildLoginScreen() {
  const [parentCode, setParentCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { texts, loading: textsLoading } = useTexts();

  const handleLoginWithCode = async () => {
    if (!parentCode.trim()) {
      Alert.alert('שגיאה', 'אנא הזן קוד');
      return;
    }

    console.log('[child-login] Starting login with code:', parentCode);
    setLoading(true);
    try {
      const childData = await linkChildWithCode(parentCode.toUpperCase());
      console.log('[child-login] Login successful, child data:', childData);

      if (childData.isFirstLogin) {
        console.log('[child-login] First login, redirecting to onboarding');
        router.replace('/auth/child-onboarding');
      } else {
        console.log('[child-login] Returning user, redirecting to tabs');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('[child-login] Error during login:', error);
      Alert.alert('שגיאה', error.message || 'קוד לא תקין');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithoutParent = () => {
    router.push('/auth/child-independent');
  };

  if (textsLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#B4FF39', '#4FFFB0', '#4DD9D9']}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B4FF39', '#4FFFB0', '#4DD9D9']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title}>התחברות ילד</Text>

          <View style={styles.form}>
            <Text style={styles.label}>הזן קוד</Text>
            <Text style={styles.hint}>קוד בן 6 תווים שמתעדכן כל יום</Text>
            <TextInput
              style={styles.input}
              value={parentCode}
              onChangeText={setParentCode}
              placeholder="הקלד קוד בן 6 תווים"
              placeholderTextColor="#666"
              autoCapitalize="characters"
              maxLength={6}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.mainButton, loading && styles.buttonDisabled]}
              onPress={handleLoginWithCode}
              disabled={loading}
            >
              <Text style={styles.mainButtonText}>
                {loading ? 'מתחבר...' : 'התחבר'}
              </Text>
            </TouchableOpacity>

            <View style={styles.separator}>
              <View style={styles.line} />
              <Text style={styles.separatorText}>או</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLoginWithoutParent}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>התחבר ללא הורה</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 48,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'right',
  },
  hint: {
    fontSize: 14,
    color: 'rgba(26, 26, 26, 0.7)',
    marginBottom: 12,
    textAlign: 'right',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#1A1A1A',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: '600',
  },
  mainButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.3)',
  },
  separatorText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginHorizontal: 16,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  secondaryButtonText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '600',
  },
});
