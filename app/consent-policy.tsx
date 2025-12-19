import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { useScreenTexts } from '@/hooks/useTexts';

export default function ConsentPolicyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getText, loading: textsLoading } = useScreenTexts('consent');

  const policyType = params.type as string;

  const getTitleKey = () => {
    if (policyType === 'data_collection') {
      return 'consent.data_collection.title';
    }
    return 'consent.terms_of_use.title';
  };

  const getContentKey = () => {
    if (policyType === 'data_collection') {
      return 'consent.data_collection.content';
    }
    return 'consent.terms_of_use.content';
  };

  if (textsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4FFFB0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {getText('consent.policy_viewer.title', 'מדיניות')}
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.policyTitle}>
          {getText(getTitleKey(), 'כותרת המדיניות')}
        </Text>
        <Text style={styles.policyContent}>
          {getText(getContentKey(), 'תוכן המדיניות יופיע כאן')}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.closeFooterButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.closeFooterButtonText}>
            {getText('consent.policy_viewer.close', 'סגור')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  policyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'right',
  },
  policyContent: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 28,
    textAlign: 'right',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  closeFooterButton: {
    backgroundColor: '#4FFFB0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  closeFooterButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
});
