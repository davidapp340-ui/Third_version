import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useScreenTexts } from '@/hooks/useTexts';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithFacebook } from '@/lib/authService';

export default function ParentLoginScreen() {
  const router = useRouter();
  const { getText, loading: textsLoading } = useScreenTexts('parent_login');
  const registerTexts = useScreenTexts('parent_register');

  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateRegistration = () => {
    if (!firstName || !email || !password || !confirmPassword) {
      setError(registerTexts.getText('parent_register.error_required_fields', 'נא למלא את כל השדות'));
      return false;
    }

    if (password.length < 6) {
      setError(registerTexts.getText('parent_register.error_password_length', 'הסיסמה חייבת להיות לפחות 6 תווים'));
      return false;
    }

    if (password !== confirmPassword) {
      setError(registerTexts.getText('parent_register.error_passwords_mismatch', 'הסיסמאות אינן תואמות'));
      return false;
    }

    return true;
  };

  const validateLogin = () => {
    if (!email || !password) {
      setError(getText('parent_login.error_required_fields', 'נא למלא את כל השדות'));
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;

    setLoading(true);
    setError('');

    try {
      await signInWithEmail({ email, password });
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(getText('parent_login.error_invalid_credentials', 'אימייל או סיסמה שגויים'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateRegistration()) return;

    setLoading(true);
    setError('');

    try {
      await signUpWithEmail({ email, password, firstName });
      router.replace('/auth/onboarding');
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת חשבון');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle('parent');
    } catch (err: any) {
      setError(err.message || 'שגיאה בהתחברות עם Google');
      setLoading(false);
    }
  };

  const handleFacebookAuth = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithFacebook('parent');
    } catch (err: any) {
      setError(err.message || 'שגיאה בהתחברות עם Facebook');
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setFirstName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  if (textsLoading || registerTexts.loading) {
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#B4FF39', '#4FFFB0', '#4DD9D9']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>
              {isRegistering
                ? registerTexts.getText('parent_register.title', 'הרשמת הורה')
                : getText('parent_login.title', 'כניסת הורה')}
            </Text>
            <Text style={styles.subtitle}>
              {isRegistering
                ? registerTexts.getText('parent_register.subtitle', 'צור חשבון חדש')
                : getText('parent_login.subtitle', 'התחבר או צור חשבון חדש')}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.form}>
              {isRegistering && (
                <TextInput
                  style={styles.input}
                  placeholder={registerTexts.getText('parent_register.first_name_placeholder', 'שם פרטי')}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  placeholderTextColor="#666"
                />
              )}

              <TextInput
                style={styles.input}
                placeholder={isRegistering
                  ? registerTexts.getText('parent_register.email_placeholder', 'אימייל')
                  : getText('parent_login.email_placeholder', 'אימייל')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
              />

              <TextInput
                style={styles.input}
                placeholder={isRegistering
                  ? registerTexts.getText('parent_register.password_placeholder', 'סיסמה (לפחות 6 תווים)')
                  : getText('parent_login.password_placeholder', 'סיסמה')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#666"
              />

              {isRegistering && (
                <TextInput
                  style={styles.input}
                  placeholder={registerTexts.getText('parent_register.confirm_password_placeholder', 'אימות סיסמה')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholderTextColor="#666"
                />
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={isRegistering ? handleRegister : handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isRegistering
                      ? registerTexts.getText('parent_register.register_button', 'צור חשבון')
                      : getText('parent_login.login_button', 'התחבר')}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>או</Text>
                <View style={styles.dividerLine} />
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

              <TouchableOpacity onPress={toggleMode} style={styles.linkContainer}>
                <Text style={styles.linkText}>
                  {isRegistering
                    ? registerTexts.getText('parent_register.have_account', 'כבר יש לך חשבון?')
                    : getText('parent_login.no_account', 'אין לך חשבון?')}{' '}
                  <Text style={styles.linkTextBold}>
                    {isRegistering
                      ? registerTexts.getText('parent_register.login_link', 'התחבר')
                      : getText('parent_login.create_account_link', 'צור חשבון חדש')}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'right',
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  linkTextBold: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
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
});
