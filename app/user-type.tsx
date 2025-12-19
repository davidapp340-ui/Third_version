import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useScreenTexts } from '@/hooks/useTexts';

const { width } = Dimensions.get('window');

export default function UserTypeScreen() {
  const router = useRouter();
  const { getText, loading } = useScreenTexts('user_type');

  const handleParentPress = () => {
    router.push('/auth/parent-login');
  };

  const handleChildPress = () => {
    router.push('/auth/child-login');
  };

  if (loading) {
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
          <TouchableOpacity
            style={styles.button}
            onPress={handleParentPress}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {getText('user_type.parent_button', 'הורה')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleChildPress}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {getText('user_type.child_button', 'ילד/ה')}
            </Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: 40,
    gap: 80,
    alignItems: 'center',
  },
  button: {
    width: Math.min(width - 80, 400),
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
});
