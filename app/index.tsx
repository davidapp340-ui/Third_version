import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useScreenTexts } from '@/hooks/useTexts';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { getText, loading } = useScreenTexts('splash');
  const [isReady, setIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!loading) {
      checkSessionAndNavigate();
    }
  }, [loading]);

  const checkSessionAndNavigate = async () => {
    setIsReady(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const { checkAndRestoreSession } = await import('@/lib/sessionService');
    const hasSession = await checkAndRestoreSession();

    const timer = setTimeout(() => {
      if (hasSession) {
        router.replace('/(tabs)');
      } else {
        router.replace('/user-type');
      }
    }, 2500);

    return () => clearTimeout(timer);
  };

  if (!isReady) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#B4FF39', '#4FFFB0', '#4DD9D9']}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        >
          <ActivityIndicator size="large" color="#1A1A1A" />
        </LinearGradient>
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
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.appName}>{getText('splash.app_name', 'zoomi')}</Text>
        </Animated.View>

        <Animated.Image
          source={require('@/assets/images/A hawk character wearing glasses, designed in the style of Duolingo\'s owl, with a simpler design, no background, and a friendly expression copy.png')}
          style={[
            styles.hawkImage,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          resizeMode="contain"
        />
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
    position: 'absolute',
    top: '25%',
    alignItems: 'center',
  },
  appName: {
    fontSize: 72,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#1A1A1A',
    textAlign: 'center',
    letterSpacing: -2,
  },
  hawkImage: {
    position: 'absolute',
    bottom: -20,
    width: width * 0.9,
    height: height * 0.5,
    maxWidth: 500,
  },
});
