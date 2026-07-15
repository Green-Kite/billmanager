import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';

interface TelemetryNoticeModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TelemetryNoticeModal({ visible, onClose }: TelemetryNoticeModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const styles = createStyles(colors);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const response = await api.acceptTelemetry();
      if (response.success) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to accept telemetry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptOut = async () => {
    setLoading(true);
    try {
      const response = await api.optOutTelemetry();
      if (response.success) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to opt out of telemetry:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDocumentation = () => {
    Linking.openURL('https://github.com/brdweb/billmanager/blob/main/TELEMETRY.md');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {}} // Prevent closing without choice
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <AlertCircle size={24} color={colors.primary} />
          <Text style={styles.title}>{t('mobileParity.telemetry.title')}</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>{t('mobileParity.telemetry.description')}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('mobileParity.telemetry.collectedTitle')}</Text>
            <Text style={styles.bullet}>• {t('mobileParity.telemetry.totalCounts')}</Text>
            <Text style={styles.bullet}>• {t('mobileParity.telemetry.featureUsage')}</Text>
            <Text style={styles.bullet}>• {t('mobileParity.telemetry.platformInfo')}</Text>
            <Text style={styles.bullet}>• {t('mobileParity.telemetry.instanceVersion')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('mobileParity.telemetry.neverTitle')}</Text>
            <Text style={styles.bullet}>• {t('mobileParity.telemetry.noPersonalInformation')}</Text>
            <Text style={styles.bullet}>• {t('mobileParity.telemetry.noFinancialData')}</Text>
            <Text style={styles.bullet}>• {t('mobileParity.telemetry.noBillContent')}</Text>
            <Text style={styles.bullet}>• {t('mobileParity.telemetry.noPaymentHistory')}</Text>
          </View>

          <TouchableOpacity accessibilityRole="link" onPress={openDocumentation} style={styles.linkContainer}>
            <Text style={styles.linkText}>{t('mobileParity.telemetry.documentation')}</Text>
          </TouchableOpacity>

          <Text style={styles.footnote}>{t('mobileParity.telemetry.footnote')}</Text>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleOptOut}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t('mobileParity.telemetry.optOut')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleAccept}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>{t('mobileParity.telemetry.accept')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    marginBottom: 4,
  },
  linkContainer: {
    marginVertical: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
  footnote: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: colors.text,
  },
});
