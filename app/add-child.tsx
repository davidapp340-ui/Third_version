import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Check, Copy, Square, CheckSquare } from 'lucide-react-native';
import { useScreenTexts } from '@/hooks/useTexts';
import { getCurrentUser } from '@/lib/authService';
import { getFamily, addChild, type Child } from '@/lib/familyService';

export default function AddChildScreen() {
  const router = useRouter();
  const { getText, loading: textsLoading } = useScreenTexts('add_child');
  const consentTexts = useScreenTexts('consent');

  const [step, setStep] = useState<'form' | 'consent' | 'code'>('form');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [child, setChild] = useState<Child | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const [dataCollectionConsent, setDataCollectionConsent] = useState(false);
  const [termsOfUseConsent, setTermsOfUseConsent] = useState(false);

  const handleContinueToConsent = () => {
    if (!name.trim()) {
      setError('נא להזין שם');
      return;
    }

    const ageNum = parseInt(age);
    if (!ageNum || ageNum < 1 || ageNum > 17) {
      setError('נא להזין גיל בין 1 ל-17');
      return;
    }

    setError('');
    setStep('consent');
  };

  const handleSubmit = async () => {
    if (!dataCollectionConsent || !termsOfUseConsent) {
      setError(consentTexts.getText('consent.must_agree', 'יש לאשר את שתי ההסכמות כדי להמשיך'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/auth/parent-login');
        return;
      }

      const family = await getFamily(user.id);
      if (!family) {
        setError('לא נמצאה משפחה. נא להתחבר מחדש.');
        return;
      }

      const newChild = await addChild(family.id, {
        name: name.trim(),
        age: parseInt(age),
      });

      setChild(newChild);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'שגיאה בהוספת ילד');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPolicy = (policyType: 'data_collection' | 'terms_of_use') => {
    router.push(`/consent-policy?type=${policyType}`);
  };

  const handleCopyCode = async () => {
    if (child) {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleDone = () => {
    router.back();
  };

  if (textsLoading || consentTexts.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4FFFB0" />
      </View>
    );
  }

  if (step === 'code' && child) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#B4FF39', '#4FFFB0', '#4DD9D9']}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Check size={80} color="#1A1A1A" strokeWidth={3} />

            <Text style={styles.title}>
              {getText('add_child.code_title', 'קוד החיבור נוצר!')}
            </Text>

            <Text style={styles.instruction}>
              {getText('add_child.code_instruction', 'הזן את הקוד הזה במכשיר הילד כדי לחבר אותו לחשבון')}
            </Text>

            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>
                {getText('add_child.code_label', 'קוד חיבור:')}
              </Text>
              <View style={styles.codeBox}>
                <Text style={styles.code}>{child.linking_code}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyCode}
                  activeOpacity={0.7}
                >
                  {codeCopied ? (
                    <Check size={24} color="#4FFFB0" />
                  ) : (
                    <Copy size={24} color="#1A1A1A" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleDone}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>
                {getText('add_child.done_button', 'סיימתי')}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (step === 'consent') {
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
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>
              {getText('add_child.title', 'הוסף ילד חדש')}
            </Text>

            <Text style={styles.consentSectionTitle}>
              הסכמות נדרשות
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.consentContainer}>
              <TouchableOpacity
                style={styles.consentItem}
                onPress={() => setDataCollectionConsent(!dataCollectionConsent)}
                activeOpacity={0.7}
              >
                <View style={styles.consentCheckbox}>
                  {dataCollectionConsent ? (
                    <CheckSquare size={28} color="#1A1A1A" strokeWidth={2.5} />
                  ) : (
                    <Square size={28} color="#1A1A1A" strokeWidth={2.5} />
                  )}
                </View>
                <View style={styles.consentTextContainer}>
                  <Text style={styles.consentText}>
                    {consentTexts.getText(
                      'consent.data_collection.checkbox',
                      'אני מסכים/ה לאיסוף נתונים על הילד'
                    )}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleViewPolicy('data_collection')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewPolicyLink}>
                      {consentTexts.getText('consent.view_policy', 'לחץ לקריאה מלאה')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.consentItem}
                onPress={() => setTermsOfUseConsent(!termsOfUseConsent)}
                activeOpacity={0.7}
              >
                <View style={styles.consentCheckbox}>
                  {termsOfUseConsent ? (
                    <CheckSquare size={28} color="#1A1A1A" strokeWidth={2.5} />
                  ) : (
                    <Square size={28} color="#1A1A1A" strokeWidth={2.5} />
                  )}
                </View>
                <View style={styles.consentTextContainer}>
                  <Text style={styles.consentText}>
                    {consentTexts.getText(
                      'consent.terms_of_use.checkbox',
                      'אני מאשר/ת את תנאי השימוש'
                    )}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleViewPolicy('terms_of_use')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewPolicyLink}>
                      {consentTexts.getText('consent.view_policy', 'לחץ לקריאה מלאה')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!dataCollectionConsent || !termsOfUseConsent) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || !dataCollectionConsent || !termsOfUseConsent}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {getText('add_child.submit_button', 'צור קוד חיבור')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setStep('form')}
            >
              <Text style={styles.cancelButtonText}>חזור</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
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
        <View style={styles.content}>
          <Text style={styles.title}>
            {getText('add_child.title', 'הוסף ילד חדש')}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder={getText('add_child.name_placeholder', 'שם הילד')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholderTextColor="#666"
              textAlign="right"
            />

            <TextInput
              style={styles.input}
              placeholder={getText('add_child.age_placeholder', 'גיל')}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={2}
              placeholderTextColor="#666"
              textAlign="right"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleContinueToConsent}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>המשך</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>ביטול</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  consentSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 8,
  },
  instruction: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  consentContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 20,
  },
  consentItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  consentCheckbox: {
    marginTop: 2,
  },
  consentTextContainer: {
    flex: 1,
    gap: 8,
  },
  consentText: {
    fontSize: 15,
    color: '#1A1A1A',
    textAlign: 'right',
    lineHeight: 22,
  },
  viewPolicyLink: {
    fontSize: 14,
    color: '#0066CC',
    textAlign: 'right',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  codeContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  codeLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  code: {
    flex: 1,
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    letterSpacing: 4,
  },
  copyButton: {
    padding: 8,
  },
  doneButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: 16,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
});
