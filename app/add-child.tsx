import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Copy, Share2, CheckCircle } from 'lucide-react-native';
import { checkAuthState, generateCodeForChild } from '@/lib/authService';
import { createLinkedChild } from '@/lib/familyService';

export default function AddChildScreen() {
  const router = useRouter();
  
  // שלב 1: הזנת פרטים, שלב 2: הצגת קוד
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  
  // טופס
  const [name, setName] = useState('');
  
  // נתונים לאחר יצירה
  const [childId, setChildId] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  const handleCreateChild = async () => {
    if (!name.trim()) {
      Alert.alert('שגיאה', 'נא להזין שם לילד');
      return;
    }

    setLoading(true);
    try {
      const authState = await checkAuthState();
      if (!authState.isAuthenticated || !authState.parentProfile) {
        Alert.alert('שגיאה', 'עליך להתחבר כהורה כדי להוסיף ילד');
        return;
      }

      // 1. יצירת הילד בדאטה-בייס
      const newChild = await createLinkedChild(authState.parentProfile.family_id, name);
      setChildId(newChild.id);

      // 2. הפקת קוד צימוד ראשוני
      const code = await generateCodeForChild(newChild.id);
      
      if (code) {
        setPairingCode(code);
        setStep(2); // מעבר למסך הקוד
      } else {
        Alert.alert('שגיאה', 'הילד נוצר אך לא ניתן היה להפיק קוד. נסה שוב מאוחר יותר.');
        router.back();
      }

    } catch (error) {
      console.error('Error adding child:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה ביצירת הפרופיל');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!pairingCode) return;
    try {
      await Share.share({
        message: `היי ${name}, הנה קוד ההתחברות שלך לאפליקציית האימון: ${pairingCode}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDone = () => {
    router.replace('/(tabs)'); // חזרה לדשבורד ההורים
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#B4FF39', '#4FFFB0']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowRight color="#1A1A1A" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {step === 1 ? 'הוספת ילד חדש' : 'חיבור מכשיר'}
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 ? (
          // === שלב 1: טופס ===
          <View style={styles.form}>
            <Text style={styles.label}>איך קוראים לילד/ה?</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="לדוגמה: נועה"
              placeholderTextColor="#999"
              autoFocus
            />
            
            <Text style={styles.helperText}>
              לאחר היצירה תקבל קוד בן 6 ספרות אותו יש להזין במכשיר של הילד.
            </Text>

            <TouchableOpacity
              style={styles.mainButton}
              onPress={handleCreateChild}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Text style={styles.buttonText}>צור פרופיל וקבל קוד</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // === שלב 2: הצגת קוד ===
          <View style={styles.codeContainer}>
            <View style={styles.successIcon}>
              <CheckCircle size={64} color="#4FFFB0" />
            </View>
            
            <Text style={styles.codeTitle}>הפרופיל של {name} מוכן!</Text>
            <Text style={styles.codeSubtitle}>
              היכנס לאפליקציה במכשיר של הילד, בחר ב"כניסה עם קוד" והזן את המספרים הבאים:
            </Text>

            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{pairingCode}</Text>
            </View>
            <Text style={styles.expiryText}>הקוד תקף לשעה הקרובה</Text>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Share2 size={24} color="#1A1A1A" />
                <Text style={styles.actionText}>שתף קוד</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>סיימתי, חזור למסך הבית</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 24, paddingTop: 60, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  backButton: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'right' },
  content: { padding: 24 },
  
  // Form Styles
  form: { gap: 24, marginTop: 20 },
  label: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'right' },
  input: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, fontSize: 18,
    textAlign: 'right', borderWidth: 1, borderColor: '#E0E0E0'
  },
  helperText: { fontSize: 14, color: '#666', textAlign: 'right', lineHeight: 20 },
  mainButton: {
    backgroundColor: '#1A1A1A', padding: 18, borderRadius: 16,
    alignItems: 'center', marginTop: 12
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  // Code Styles
  codeContainer: { alignItems: 'center', gap: 16, marginTop: 20 },
  successIcon: { marginBottom: 8 },
  codeTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  codeSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  codeBox: {
    backgroundColor: '#FFF', paddingVertical: 24, paddingHorizontal: 48,
    borderRadius: 24, borderWidth: 2, borderColor: '#4FFFB0',
    marginVertical: 16, shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 10, elevation: 2
  },
  codeText: { fontSize: 42, fontWeight: 'bold', letterSpacing: 4, color: '#1A1A1A' },
  expiryText: { fontSize: 14, color: '#FF3B30', marginTop: -8 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 16 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E8F5E9', padding: 12, borderRadius: 12
  },
  actionText: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  doneButton: { marginTop: 32, padding: 16 },
  doneButtonText: { fontSize: 16, color: '#666', textDecorationLine: 'underline' }
});