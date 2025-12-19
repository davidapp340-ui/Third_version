import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { signUpChildIndependent, signInChildIndependent, signInWithGoogle, signInWithFacebook } from '@/lib/authService';

export default function ChildIndependentScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dataCollectionAccepted, setDataCollectionAccepted] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות');
      return;
    }

    setLoading(true);
    try {
      await signInChildIndependent({ email: loginEmail, password: loginPassword });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('שגיאה', error.message || 'התחברות נכשלה');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !age.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 17) {
      Alert.alert('שגיאה', 'גיל לא תקין');
      return;
    }

    if (registerPassword !== confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות אינן זהות');
      return;
    }

    if (!termsAccepted || !dataCollectionAccepted) {
      Alert.alert('שגיאה', 'יש לאשר את התנאים וההסכמות');
      return;
    }

    setLoading(true);
    try {
      await signUpChildIndependent({
        email: registerEmail,
        password: registerPassword,
        firstName,
        age: ageNum,
      });
      router.replace('/auth/child-onboarding');
    } catch (error: any) {
      Alert.alert('שגיאה', error.message || 'הרשמה נכשלה');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await signInWithGoogle('child_independent');
    } catch (error: any) {
      Alert.alert('שגיאה', error.message || 'שגיאה בהתחברות עם Google');
      setLoading(false);
    }
  };

  const handleFacebookAuth = async () => {
    setLoading(true);
    try {
      await signInWithFacebook('child_independent');
    } catch (error: any) {
      Alert.alert('שגיאה', error.message || 'שגיאה בהתחברות עם Facebook');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B4FF39', '#4FFFB0', '#4DD9D9']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            {mode === 'login' ? 'התחברות ילד - משתמש עצמאי' : 'הרשמת ילד'}
          </Text>

          {mode === 'login' ? (
            <View style={styles.form}>
              <Text style={styles.label}>אימייל</Text>
              <TextInput
                style={styles.input}
                value={loginEmail}
                onChangeText={setLoginEmail}
                placeholder="name@example.com"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />

              <Text style={styles.label}>סיסמה</Text>
              <TextInput
                style={styles.input}
                value={loginPassword}
                onChangeText={setLoginPassword}
                placeholder="הקלד סיסמה"
                placeholderTextColor="#666"
                secureTextEntry
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.mainButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.mainButtonText}>
                  {loading ? 'מתחבר...' : 'התחבר'}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>או</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleAuth}
                disabled={loading}
              >
                <Text style={styles.socialButtonText}>המשך עם Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.facebookButton]}
                onPress={handleFacebookAuth}
                disabled={loading}
              >
                <Text style={styles.socialButtonText}>המשך עם Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMode('register')} disabled={loading}>
                <Text style={styles.linkText}>אין לך חשבון? צור חשבון חדש</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>שם פרטי</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="הקלד שם פרטי"
                placeholderTextColor="#666"
                editable={!loading}
              />

              <Text style={styles.label}>גיל</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="הקלד גיל"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                editable={!loading}
              />

              <Text style={styles.label}>אימייל</Text>
              <TextInput
                style={styles.input}
                value={registerEmail}
                onChangeText={setRegisterEmail}
                placeholder="name@example.com"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />

              <Text style={styles.label}>סיסמה</Text>
              <TextInput
                style={styles.input}
                value={registerPassword}
                onChangeText={setRegisterPassword}
                placeholder="הקלד סיסמה"
                placeholderTextColor="#666"
                secureTextEntry
                editable={!loading}
              />

              <Text style={styles.label}>אימות סיסמה</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="הקלד סיסמה שנית"
                placeholderTextColor="#666"
                secureTextEntry
                editable={!loading}
              />

              <View style={styles.checkboxContainer}>
                <View style={styles.checkbox}>
                  <TouchableOpacity
                    style={[styles.checkboxBox, termsAccepted && styles.checkboxChecked]}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    disabled={loading}
                  >
                    {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/consent-policy?type=terms_of_use')}
                    disabled={loading}
                    style={styles.checkboxTextContainer}
                  >
                    <Text style={styles.checkboxLabel}>אני מסכים לתנאי השימוש</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.checkbox}>
                  <TouchableOpacity
                    style={[styles.checkboxBox, dataCollectionAccepted && styles.checkboxChecked]}
                    onPress={() => setDataCollectionAccepted(!dataCollectionAccepted)}
                    disabled={loading}
                  >
                    {dataCollectionAccepted && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/consent-policy?type=data_collection')}
                    disabled={loading}
                    style={styles.checkboxTextContainer}
                  >
                    <Text style={styles.checkboxLabel}>אני מסכים לאיסוף נתונים למחקר</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.mainButton, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.mainButtonText}>
                  {loading ? 'נרשם...' : 'צור חשבון'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMode('login')} disabled={loading}>
                <Text style={styles.linkText}>כבר יש לך חשבון? התחבר</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'right',
  },
  mainButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkText: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.3)',
  },
  dividerText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginHorizontal: 12,
  },
  socialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.2)',
  },
  facebookButton: {
    backgroundColor: 'rgba(66, 103, 178, 0.15)',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  checkboxContainer: {
    marginVertical: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1A1A1A',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: '#1A1A1A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'right',
    textDecorationLine: 'underline',
  },
});
