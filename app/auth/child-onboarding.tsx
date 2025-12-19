import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getCurrentUser } from '@/lib/authService';
import { useEffect, useState } from 'react';

export default function ChildOnboardingScreen() {
  const [childName, setChildName] = useState('');

  useEffect(() => {
    loadUserName();
  }, []);

  const loadUserName = async () => {
    try {
      const user = await getCurrentUser();
      const firstName = user?.user_metadata?.first_name || 'ידידי';
      setChildName(firstName);
    } catch (error) {
      setChildName('ידידי');
    }
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B4FF39', '#4FFFB0', '#4DD9D9']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title}>שלום {childName}!</Text>

          <View style={styles.messageContainer}>
            <Text style={styles.message}>
              עם התרגילים שאתה עושה כאן, אתה לא רק מחזק את העיניים שלך – אתה חלק ממשהו גדול יותר!
            </Text>

            <Text style={styles.message}>
              אנחנו חוקרים טכנולוגיה חדשה שיכולה לעזור לילדים בכל העולם לראות טוב יותר בלי ניתוחים.
            </Text>

            <Text style={styles.emphasis}>
              כל תרגיל שאתה עושה עוזר למדענים ללמוד ולשפר!
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>יאללה, בואו נתחיל!</Text>
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 48,
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 32,
    marginBottom: 48,
  },
  message: {
    fontSize: 20,
    lineHeight: 32,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 24,
  },
  emphasis: {
    fontSize: 22,
    lineHeight: 34,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 48,
    minWidth: 280,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
});
