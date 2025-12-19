import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { AlertCircle, CheckCircle, Wrench, X } from 'lucide-react-native';
import { diagnoseProgressIssue, autoFixProgressIssue } from '@/lib/diagnostics/progressDiagnostics';

export function ProgressDiagnosticButton() {
  const [showModal, setShowModal] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<{ success: boolean; message: string } | null>(null);

  const runDiagnostics = async () => {
    setRunning(true);
    setFixResult(null);
    try {
      const results = await diagnoseProgressIssue();
      setDiagnostics(results);
    } catch (error) {
      console.error('Diagnostics error:', error);
    } finally {
      setRunning(false);
    }
  };

  const runAutoFix = async () => {
    setFixing(true);
    try {
      const result = await autoFixProgressIssue();
      setFixResult(result);

      // Re-run diagnostics after fix
      if (result.success) {
        setTimeout(() => runDiagnostics(), 1000);
      }
    } catch (error) {
      setFixResult({
        success: false,
        message: `Error: ${error}`,
      });
    } finally {
      setFixing(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.diagnosticButton}
        onPress={() => {
          setShowModal(true);
          runDiagnostics();
        }}
      >
        <AlertCircle size={20} color="#FFFFFF" />
        <Text style={styles.diagnosticButtonText}>Diagnose</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Progress Page Diagnostics</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
                <X size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.resultsContainer}>
              {running ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Running diagnostics...</Text>
                </View>
              ) : diagnostics ? (
                <>
                  {/* Overall Status */}
                  <View
                    style={[
                      styles.statusCard,
                      diagnostics.overall.allPassed ? styles.successCard : styles.errorCard,
                    ]}
                  >
                    {diagnostics.overall.allPassed ? (
                      <CheckCircle size={32} color="#4FFFB0" />
                    ) : (
                      <AlertCircle size={32} color="#FF6B6B" />
                    )}
                    <Text style={styles.statusTitle}>
                      {diagnostics.overall.allPassed ? 'All Checks Passed' : 'Issues Found'}
                    </Text>
                    <Text style={styles.statusMessage}>{diagnostics.overall.summary}</Text>
                  </View>

                  {/* Individual Checks */}
                  <Text style={styles.sectionTitle}>Detailed Results</Text>

                  <DiagnosticCheck title="User Authentication" result={diagnostics.userCheck} />
                  <DiagnosticCheck title="Child Account" result={diagnostics.childCheck} />
                  <DiagnosticCheck title="Track Progress" result={diagnostics.progressCheck} />
                  <DiagnosticCheck title="Training Tracks" result={diagnostics.trackCheck} />
                  <DiagnosticCheck title="Track Days" result={diagnostics.trackDaysCheck} />
                  <DiagnosticCheck title="RLS Policies" result={diagnostics.rlsCheck} />

                  {/* Fix Button */}
                  {!diagnostics.overall.allPassed && diagnostics.progressCheck.passed === false && (
                    <View style={styles.fixSection}>
                      <Text style={styles.fixTitle}>Quick Fix Available</Text>
                      <Text style={styles.fixDescription}>
                        We can automatically start a training track for this child.
                      </Text>

                      <TouchableOpacity
                        style={styles.fixButton}
                        onPress={runAutoFix}
                        disabled={fixing}
                      >
                        <Wrench size={20} color="#1A1A1A" />
                        <Text style={styles.fixButtonText}>
                          {fixing ? 'Fixing...' : 'Auto-Fix Issue'}
                        </Text>
                      </TouchableOpacity>

                      {fixResult && (
                        <View
                          style={[
                            styles.fixResult,
                            fixResult.success ? styles.fixSuccess : styles.fixError,
                          ]}
                        >
                          <Text
                            style={[
                              styles.fixResultText,
                              fixResult.success
                                ? styles.fixSuccessText
                                : styles.fixErrorText,
                            ]}
                          >
                            {fixResult.message}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Manual Fix Instructions */}
                  {diagnostics.overall.suggestedFix && !diagnostics.progressCheck.passed && (
                    <View style={styles.manualFixSection}>
                      <Text style={styles.manualFixTitle}>Manual Fix</Text>
                      <Text style={styles.manualFixText}>{diagnostics.overall.suggestedFix}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No diagnostics run yet</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={runDiagnostics}
                disabled={running}
              >
                <Text style={styles.retryButtonText}>
                  {running ? 'Running...' : 'Re-run Diagnostics'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function DiagnosticCheck({ title, result }: { title: string; result: any }) {
  return (
    <View style={styles.checkCard}>
      <View style={styles.checkHeader}>
        {result.passed ? (
          <CheckCircle size={20} color="#4FFFB0" />
        ) : (
          <AlertCircle size={20} color="#FF6B6B" />
        )}
        <Text style={styles.checkTitle}>{title}</Text>
      </View>
      <Text style={[styles.checkMessage, result.passed ? styles.checkSuccess : styles.checkError]}>
        {result.message}
      </Text>
      {result.fix && (
        <Text style={styles.checkFix}>💡 Fix: {result.fix}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  diagnosticButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#FF6B6B',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  diagnosticButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  statusCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  successCard: {
    backgroundColor: '#E8F9F3',
    borderWidth: 2,
    borderColor: '#4FFFB0',
  },
  errorCard: {
    backgroundColor: '#FFE8E8',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  checkCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  checkMessage: {
    fontSize: 14,
    marginLeft: 28,
  },
  checkSuccess: {
    color: '#4FFFB0',
  },
  checkError: {
    color: '#FF6B6B',
  },
  checkFix: {
    fontSize: 12,
    color: '#666',
    marginLeft: 28,
    fontStyle: 'italic',
  },
  fixSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#FFF4E6',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFB84D',
  },
  fixTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  fixDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  fixButton: {
    backgroundColor: '#4FFFB0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fixButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  fixResult: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  fixSuccess: {
    backgroundColor: '#E8F9F3',
  },
  fixError: {
    backgroundColor: '#FFE8E8',
  },
  fixResultText: {
    fontSize: 14,
    textAlign: 'center',
  },
  fixSuccessText: {
    color: '#00875A',
  },
  fixErrorText: {
    color: '#C9372C',
  },
  manualFixSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  manualFixTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  manualFixText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  retryButton: {
    backgroundColor: '#4FFFB0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
});
