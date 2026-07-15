import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { typography } from '../../../design/tokens';
import { useAdaptiveTheme } from '../../../design/useAdaptiveTheme';

export interface AuthScaffoldProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testID?: string;
}

export function AuthScaffold({
  title,
  subtitle,
  children,
  footer,
  testID,
}: AuthScaffoldProps) {
  const theme = useAdaptiveTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          testID={testID}
        >
          <View style={[styles.content, { maxWidth: 560 }]}>
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={[typography.title, { color: theme.colors.text }]}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[typography.body, { color: theme.colors.textSecondary }]}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <View style={[styles.body, { gap: theme.spacing.md }]}>{children}</View>
            {footer ? <View style={[styles.footer, { marginTop: theme.spacing.xl }]}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  error?: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
}

export function FormField({ label, error, hint, style, ...inputProps }: FormFieldProps) {
  const theme = useAdaptiveTheme();
  const description = error ?? hint;

  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        accessibilityHint={description}
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.primary}
        style={[
          styles.input,
          {
            minHeight: theme.minimumHitSize,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.small,
          },
        ]}
      />
      {description ? (
        <Text
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          style={[
            styles.fieldMessage,
            { color: error ? theme.colors.danger : theme.colors.textMuted },
          ]}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}

export interface ActionButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'plain';
  accessibilityHint?: string;
  testID?: string;
}

export function ActionButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  accessibilityHint,
  testID,
}: ActionButtonProps) {
  const theme = useAdaptiveTheme();
  const isDisabled = disabled || loading;
  const backgroundColor = variant === 'primary'
    ? theme.colors.primary
    : variant === 'danger'
      ? theme.colors.danger
      : variant === 'secondary'
        ? theme.colors.surfaceMuted
        : 'transparent';
  const foregroundColor = variant === 'primary' || variant === 'danger'
    ? theme.colors.onPrimary
    : variant === 'plain'
      ? theme.colors.primary
      : theme.colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: theme.minimumHitSize,
          backgroundColor,
          borderColor: variant === 'secondary' ? theme.colors.border : backgroundColor,
          borderRadius: theme.radius.small,
          opacity: isDisabled ? 0.45 : pressed ? 0.72 : 1,
        },
      ]}
    >
      {loading ? <ActivityIndicator color={foregroundColor} /> : null}
      <Text style={[styles.buttonLabel, { color: foregroundColor }]}>{label}</Text>
    </Pressable>
  );
}

export interface StatusNoticeProps {
  kind?: 'info' | 'success' | 'error' | 'warning';
  title?: string;
  message: string;
}

export function StatusNotice({ kind = 'info', title, message }: StatusNoticeProps) {
  const theme = useAdaptiveTheme();
  const foreground = kind === 'error'
    ? theme.colors.danger
    : kind === 'success'
      ? theme.colors.success
      : kind === 'warning'
        ? theme.colors.accent
        : theme.colors.textSecondary;
  const background = kind === 'error'
    ? `${theme.colors.danger}14`
    : kind === 'success'
      ? theme.colors.primaryContainer
      : kind === 'warning'
        ? theme.colors.accentContainer
        : theme.colors.surfaceMuted;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.notice, { backgroundColor: background, borderRadius: theme.radius.small }]}
    >
      {title ? <Text style={[styles.noticeTitle, { color: foreground }]}>{title}</Text> : null}
      <Text style={[typography.callout, { color: foreground }]}>{message}</Text>
    </View>
  );
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  const theme = useAdaptiveTheme();
  return (
    <View accessibilityLiveRegion="polite" style={styles.loadingState}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text style={[typography.callout, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export function CapabilityUnavailable({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <AuthScaffold title={title} subtitle="Not available on this server">
      <StatusNotice kind="warning" message={message} />
    </AuthScaffold>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const theme = useAdaptiveTheme();
  return (
    <View style={[styles.section, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.sectionHeading}>
        <Text accessibilityRole="header" style={[typography.headline, { color: theme.colors.text }]}>
          {title}
        </Text>
        {description ? (
          <Text style={[typography.callout, { color: theme.colors.textSecondary }]}>{description}</Text>
        ) : null}
      </View>
      <View style={{ gap: theme.spacing.sm }}>{children}</View>
    </View>
  );
}

export function ListAction({
  title,
  detail,
  onPress,
  destructive = false,
  disabled = false,
}: {
  title: string;
  detail?: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const theme = useAdaptiveTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.listAction,
        {
          minHeight: theme.minimumHitSize,
          borderBottomColor: theme.colors.border,
          opacity: disabled ? 0.45 : pressed ? 0.62 : 1,
        },
      ]}
    >
      <View style={styles.listActionText}>
        <Text style={[typography.body, { color: destructive ? theme.colors.danger : theme.colors.text }]}>
          {title}
        </Text>
        {detail ? (
          <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{detail}</Text>
        ) : null}
      </View>
      <Text accessibilityElementsHidden style={[styles.disclosure, { color: theme.colors.textMuted }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { width: '100%', alignSelf: 'center' },
  heading: { gap: 8, marginBottom: 28 },
  body: { width: '100%' },
  footer: { alignItems: 'center' },
  field: { gap: 7 },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 16 },
  fieldMessage: { fontSize: 13, lineHeight: 18 },
  button: {
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonLabel: { fontSize: 16, lineHeight: 21, fontWeight: '700' },
  notice: { paddingHorizontal: 16, paddingVertical: 14, gap: 4 },
  noticeTitle: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  loadingState: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 12 },
  section: { paddingVertical: 20, borderBottomWidth: StyleSheet.hairlineWidth, gap: 14 },
  sectionHeading: { gap: 4 },
  listAction: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  listActionText: { flex: 1, gap: 2 },
  disclosure: { fontSize: 28, lineHeight: 30, fontWeight: '300' },
});
