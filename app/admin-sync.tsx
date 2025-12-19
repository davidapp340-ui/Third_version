import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { RefreshCw, ExternalLink, Database, CheckCircle, XCircle, ArrowLeft } from 'lucide-react-native';
import { getSheetEditUrl } from '@/lib/exercisesDataSource';

interface SyncResult {
  success: boolean;
  message?: string;
  results?: {
    eyeExercises: { inserted: number; updated: number; errors: number };
    gallery: { inserted: number; updated: number; errors: number };
  };
  totalProcessed?: number;
  error?: string;
  details?: string;
}

export default function AdminSyncScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const sheetUrl = getSheetEditUrl();

  const handleSync = async () => {
    try {
      setIsLoading(true);
      setSyncResult(null);

      const response = await fetch('/sync-exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer your-secret-key',
        },
      });

      const result = await response.json();
      setSyncResult(result);

      if (result.success) {
        Alert.alert('Success', 'Exercises synced successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to sync exercises');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncResult({
        success: false,
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
      Alert.alert('Error', 'Failed to connect to sync API');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#4F46E5" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Database size={48} color="#4F46E5" />
          <Text style={styles.title}>Exercise Data Sync</Text>
          <Text style={styles.subtitle}>
            Sync exercise data from Google Sheets to the database
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Source</Text>
          <View style={styles.urlBox}>
            <Text style={styles.urlText} numberOfLines={2}>
              {sheetUrl}
            </Text>
          </View>
          <Text style={styles.infoText}>
            Make sure your Google Sheet is set to "Anyone with the link can view"
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.syncButton, isLoading && styles.syncButtonDisabled]}
          onPress={handleSync}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <RefreshCw size={24} color="#FFFFFF" />
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </>
          )}
        </TouchableOpacity>

        {syncResult && (
          <View style={styles.card}>
            <View style={styles.resultHeader}>
              {syncResult.success ? (
                <CheckCircle size={32} color="#10B981" />
              ) : (
                <XCircle size={32} color="#EF4444" />
              )}
              <Text
                style={[
                  styles.resultTitle,
                  syncResult.success ? styles.resultSuccess : styles.resultError,
                ]}
              >
                {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
              </Text>
            </View>

            {syncResult.message && (
              <Text style={styles.resultMessage}>{syncResult.message}</Text>
            )}

            {syncResult.results && (
              <View style={styles.resultsDetail}>
                <Text style={styles.resultsTitle}>Results:</Text>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Eye Exercises:</Text>
                  <Text style={styles.resultValue}>
                    {syncResult.results.eyeExercises.updated} updated
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Gallery Items:</Text>
                  <Text style={styles.resultValue}>
                    {syncResult.results.gallery.updated} updated
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Total Processed:</Text>
                  <Text style={styles.resultValue}>{syncResult.totalProcessed}</Text>
                </View>
              </View>
            )}

            {syncResult.error && (
              <View style={styles.errorDetail}>
                <Text style={styles.errorText}>{syncResult.error}</Text>
                {syncResult.details && (
                  <Text style={styles.errorDetails}>{syncResult.details}</Text>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Expected Sheet Format</Text>
          <Text style={styles.instructionText}>
            Your Google Sheet should have these columns:{'\n\n'}
            <Text style={styles.boldText}>Required:</Text>{'\n'}
            • id - Exercise ID{'\n'}
            • exercise_name - Exercise name{'\n\n'}
            <Text style={styles.boldText}>Optional:</Text>{'\n'}
            • description, icon, media_type{'\n'}
            • video_link, audio_link{'\n'}
            • category, color, display{'\n'}
            • display_order
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: '#4F46E5',
    marginLeft: 8,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  urlBox: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  urlText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
  resultSuccess: {
    color: '#10B981',
  },
  resultError: {
    color: '#EF4444',
  },
  resultMessage: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  resultsDetail: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  errorDetail: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  errorDetails: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '600',
    color: '#111827',
  },
});
