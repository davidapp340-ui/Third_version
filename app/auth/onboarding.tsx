import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useScreenTexts } from '@/hooks/useTexts';

const { width } = Dimensions.get('window');

interface Slide {
  titleKey: string;
  textKey: string;
  titleFallback: string;
  textFallback: string;
}

const slides: Slide[] = [
  {
    titleKey: 'onboarding.welcome_title',
    textKey: 'onboarding.welcome_text',
    titleFallback: 'ברוכים הבאים ל-Zoomi',
    textFallback: 'האפליקציה היא לא רק לאימון העיניים. יחד איתך – אנחנו ממומנים מחקר לפיתוח משקפי תלת-ממד שיכולים לשנות את האופן שבו ילדים רואים את העולם.',
  },
  {
    titleKey: 'onboarding.vision_title',
    textKey: 'onboarding.vision_text',
    titleFallback: 'עתיד הראייה מתחיל כאן',
    textFallback: 'אנחנו מאמינים בפתרון לא פולשני לבעיות ראייה בילדים. כל תרגול שאתם עושים עוזר לנו במחקר ובפיתוח משקפי תלת-ממד מהפכניים.',
  },
  {
    titleKey: 'onboarding.patience_title',
    textKey: 'onboarding.patience_text',
    titleFallback: 'השיפור לוקח זמן',
    textFallback: 'כמו בחדר כושר, ההתמדה היא המפתח כאן. אחרי מספר שבועות, תרגישו פחות עייפות בעיניים, והראייה תשתפר עם הזמן.',
  },
  {
    titleKey: 'onboarding.research_title',
    textKey: 'onboarding.research_text',
    titleFallback: 'הילד שלך הוא שותף במחקר',
    textFallback: 'כל תרגול שהילד שלך עושה עוזר לו, וגם מקדם את המדע ועתיד של ילדים אחרים ברחבי העולם.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { getText, loading } = useScreenTexts('onboarding');
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
    } else {
      handleStart();
    }
  };

  const handleSkip = () => {
    scrollViewRef.current?.scrollTo({
      x: width * (slides.length - 1),
      animated: true,
    });
  };

  const handleStart = () => {
    router.replace('/(tabs)');
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

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B4FF39', '#4FFFB0', '#4DD9D9']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {slides.map((slide, index) => (
            <View key={index} style={styles.slide}>
              <View style={styles.slideContent}>
                <Text style={styles.slideTitle}>
                  {getText(slide.titleKey, slide.titleFallback)}
                </Text>
                <Text style={styles.slideText}>
                  {getText(slide.textKey, slide.textFallback)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.buttons}>
            {!isLastSlide && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
              >
                <Text style={styles.skipButtonText}>
                  {getText('onboarding.skip_button', 'דלג')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.nextButton}
              onPress={isLastSlide ? handleStart : handleNext}
            >
              <Text style={styles.nextButtonText}>
                {isLastSlide
                  ? getText('onboarding.start_button', 'התחל להשתמש')
                  : getText('onboarding.next_button', 'הבא')}
              </Text>
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
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  slideContent: {
    maxWidth: 500,
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 24,
  },
  slideText: {
    fontSize: 18,
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 28,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(26, 26, 26, 0.3)',
  },
  paginationDotActive: {
    backgroundColor: '#1A1A1A',
    width: 24,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    padding: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 150,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
});
