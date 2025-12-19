import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { pairDeviceWithCode } from '@/lib/authService';
import { ArrowRight } from 'lucide-react-native';

export default function ChildLoginScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (code.length < 4) {
      Alert.alert('שגיאה', 'אנא הזן קוד תקין');
      return;
    }

    setLoading(true);
    const result = await pairDeviceWithCode(code);
    
    if (result.success) {
      // הצימוד הצליח! המידע נשמר ב-AsyncStorage
      // מנקים את היסטוריית הניווט ועוברים לאפליקציה
      router.replace('/(tabs)/progress');
    } else {
      Alert.alert('שגיאה', result.error || 'הקוד שגוי או פג תוקף');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#B4FF39', '#4FFFB0']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowRight color="#1A1A1A" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>כניסה עם קוד</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.label}>הזן את הקוד שקיבלת מההורה:</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          placeholder="XXXXXX"
          maxLength={6}
          autoCapitalize="characters"
          textAlign="center"
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleConnect}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1A1A1A" />
          ) : (
            <Text style={styles.buttonText}>התחבר</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 24, paddingTop: 60, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  backButton: { marginBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'right' },
  content: { padding: 24, marginTop: 40, alignItems: 'center' },
  label: { fontSize: 18, marginBottom: 16, color: '#666' },
  input: { 
    fontSize: 32, fontWeight: 'bold', letterSpacing: 4, 
    borderBottomWidth: 2, borderColor: '#4FFFB0', 
    width: '80%', padding: 10, marginBottom: 40 
  },
  button: { 
    backgroundColor: '#4FFFB0', paddingVertical: 16, paddingHorizontal: 40, 
    borderRadius: 30, minWidth: 200, alignItems: 'center' 
  },
  buttonText: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' }
});