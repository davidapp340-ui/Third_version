import { View, Text, StyleSheet } from 'react-native';
import { useScreenTexts } from '@/hooks/useTexts';

export default function InfoScreen() {
  const { getText } = useScreenTexts('info');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getText('info.title', 'מידע ולמידה')}</Text>
      <Text style={styles.description}>{getText('info.description', 'דפי מידע חינוכיים')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666666',
  },
});
