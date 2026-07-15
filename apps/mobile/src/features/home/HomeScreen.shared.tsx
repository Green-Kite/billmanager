import React, { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  Bolt,
  Film,
  Music2,
  ShieldCheck,
  Wifi,
} from 'lucide-react-native';
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import AdaptiveHeader from '../../components/adaptive/AdaptiveHeader';
import AdaptiveListRow from '../../components/adaptive/AdaptiveListRow';
import AdaptiveSurface from '../../components/adaptive/AdaptiveSurface';
import BucketPicker from '../../components/adaptive/BucketPicker';
import FloatingAddAction from '../../components/adaptive/FloatingAddAction';
import MoneyText from '../../components/adaptive/MoneyText';
import PreviewLineChart from '../../components/adaptive/PreviewLineChart';
import SectionHeader from '../../components/adaptive/SectionHeader';
import { AdaptivePlatform, typography } from '../../design/tokens';
import { useAdaptiveLayout } from '../../design/useAdaptiveLayout';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';
import { formatCurrency, formatDate } from '../../i18n/format';
import { PreviewBill, PreviewBillIcon } from '../previewData';
import { useBillPresentation } from '../useBillPresentation';
import { expandCalendarOccurrences } from '../calendar/calendarProjection';

interface HomeScreenViewProps {
  platform: AdaptivePlatform;
}

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function BillGlyph({ bill, platform }: { bill: PreviewBill; platform: AdaptivePlatform }) {
  const theme = useAdaptiveTheme(platform);
  const color = bill.tone === 'income' ? theme.colors.success : theme.colors.primary;
  const backgroundColor = bill.tone === 'income'
    ? theme.colors.primaryContainer
    : bill.id === 'electric'
      ? theme.colors.accentContainer
      : theme.colors.surfaceMuted;

  const icons: Record<PreviewBillIcon, React.ReactNode> = {
    electric: <Bolt size={24} color={theme.colors.accent} fill={theme.colors.accent} />,
    streaming: <Film size={23} color={color} />,
    salary: <ArrowDownToLine size={24} color={color} />,
    music: <Music2 size={23} color={color} />,
    insurance: <ShieldCheck size={23} color={color} />,
    internet: <Wifi size={23} color={color} />,
  };

  return (
    <View style={[styles.billGlyph, { backgroundColor }]}>
      {icons[bill.icon]}
    </View>
  );
}

export function HomeScreenView({ platform }: HomeScreenViewProps) {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const theme = useAdaptiveTheme(platform);
  const layout = useAdaptiveLayout();
  const {
    bills,
    groupOptions,
    selectedGroup,
    selectGroup,
    payments,
    recordPayment,
    online,
    syncing,
  } = useBillPresentation();
  const [bucketPickerVisible, setBucketPickerVisible] = useState(false);
  const [paidBillId, setPaidBillId] = useState<string | null>(null);
  const [chartWidth, setChartWidth] = useState(Math.max(300, layout.contentWidth - 64));
  const comingUp = useMemo(() => bills.slice(1, 5), [bills]);
  const nextBill = bills[0];
  const nextBillPaid = nextBill?.id === paidBillId;
  const now = new Date();
  const monthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now.getFullYear(), now.getMonth()]);
  const monthEnd = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59), [now.getFullYear(), now.getMonth()]);
  const monthOccurrences = useMemo(
    () => expandCalendarOccurrences(bills, monthStart, monthEnd),
    [bills, monthEnd, monthStart],
  );
  const monthTotals = useMemo(() => monthOccurrences.reduce((result, bill) => {
    if (bill.tone === 'income') result.income += bill.amount;
    else result.expenses += bill.amount;
    return result;
  }, { income: 0, expenses: 0 }), [monthOccurrences]);
  const paidExpenses = useMemo(() => {
    const sourceById = new Map<number, PreviewBill>();
    bills.forEach((bill) => {
      if (bill.source) sourceById.set(bill.source.id, bill);
    });
    return payments.reduce((total, payment) => {
      if (payment.payment_date < dateKey(monthStart) || payment.payment_date > dateKey(monthEnd)) return total;
      const type = payment.bill_type ?? sourceById.get(payment.bill_id)?.tone;
      return type === 'expense' ? total + payment.amount : total;
    }, 0);
  }, [bills, monthEnd, monthStart, payments]);
  const monthNet = monthTotals.income - monthTotals.expenses;
  const monthRemaining = Math.max(0, monthTotals.expenses - paidExpenses);
  const forecast = useMemo(() => {
    const points = monthOccurrences
      .slice()
      .sort((left, right) => (left.dueDate ?? '').localeCompare(right.dueDate ?? ''))
      .reduce<number[]>((values, bill) => {
        values.push((values[values.length - 1] ?? 0) + (bill.tone === 'income' ? bill.amount : -bill.amount));
        return values;
      }, [0]);
    if (points.length === 1) points.push(0);
    return points;
  }, [monthOccurrences]);
  const monthLabel = formatDate(now, { month: 'long' });
  const daysRemaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const reminderCount = bills.filter((bill) => bill.source?.reminder_enabled).length;

  const openBillsTab = () => navigation.getParent()?.navigate('BillsTab');
  const openAddBill = () => navigation.navigate('AddBill');
  const openReminders = () => navigation.navigate('ReminderInbox');

  const handleChartLayout = (event: LayoutChangeEvent) => {
    setChartWidth(Math.max(260, event.nativeEvent.layout.width - 24));
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {platform === 'android' ? (
        <AdaptiveHeader
          title="BillManager"
          showBrand
          groupName={selectedGroup}
          notificationCount={reminderCount}
          onPressGroup={() => setBucketPickerVisible(true)}
          onPressNotifications={openReminders}
        />
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: layout.horizontalPadding,
            paddingBottom: platform === 'android' ? 104 : 40,
          },
        ]}
      >
        <View style={[styles.content, { maxWidth: theme.contentMaxWidth }]}>
          {platform === 'ios' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('mobileCore.common.currentGroup', { group: selectedGroup })}
              onPress={() => setBucketPickerVisible(true)}
              style={({ pressed }) => [
                styles.iosBucket,
                {
                  minHeight: theme.minimumHitSize,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.65 : 1,
                },
              ]}
            >
              <Text style={[typography.callout, { color: theme.colors.textMuted }]}>{t('mobileCore.home.viewing')}</Text>
              <Text style={[typography.headline, { color: theme.colors.primary }]}>{selectedGroup}</Text>
            </Pressable>
          ) : null}

          <View style={styles.overviewHeading}>
            <View style={styles.overviewCopy}>
              <Text accessibilityRole="header" style={[typography.title, { color: theme.colors.text }]}>
                {t('mobileCore.home.monthOverview', { month: monthLabel })}
              </Text>
              <Text style={[typography.body, { color: theme.colors.textSecondary }]}>{t('mobileCore.home.daysRemaining', { count: daysRemaining })}</Text>
            </View>
            <AdaptiveSurface
              style={[
                styles.remainingCard,
                platform === 'ios' && { backgroundColor: theme.colors.surfaceMuted },
              ]}
              accessibilityLabel={t('mobileCore.home.monthRemainingA11y', { amount: formatCurrency(monthRemaining) })}
            >
              <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{t('mobileCore.home.monthRemaining')}</Text>
              <MoneyText
                platform={platform}
                amount={monthRemaining}
                style={[styles.remainingAmount, { color: theme.colors.success }]}
              />
            </AdaptiveSurface>
          </View>

          {!online ? (
            <View
              accessible
              accessibilityRole="alert"
              style={[styles.successBanner, { backgroundColor: theme.colors.surfaceMuted }]}
            >
              <Text style={[typography.callout, { color: theme.colors.textSecondary }]}>{t('mobileCore.home.offlineSaved')}</Text>
              <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{t('mobileCore.home.changesSyncLater')}</Text>
            </View>
          ) : null}

          {nextBillPaid && nextBill ? (
            <View
              accessible
              accessibilityRole="alert"
              style={[styles.successBanner, { backgroundColor: theme.colors.primaryContainer }]}
            >
              <Text style={[typography.callout, { color: theme.colors.primary }]}>{t('mobileCore.home.markedPaid', { name: nextBill.name })}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('mobileCore.home.dismissPaid', { name: nextBill.name })}
                onPress={() => setPaidBillId(null)}
                hitSlop={8}
              >
                <Text style={[typography.callout, { color: theme.colors.primary, fontWeight: '800' }]}>{t('mobileCore.home.dismiss')}</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={[layout.isTablet && styles.tabletGrid, { gap: layout.columnGap }]}>
            <AdaptiveSurface
              style={[styles.cashFlowCard, layout.isTablet && styles.tabletPrimary]}
              accessibilityLabel={t('mobileCore.home.cashFlowA11y', { amount: formatCurrency(monthNet) })}
            >
              <View style={styles.cashFlowHeader}>
                <View>
                  <Text style={[typography.callout, { color: theme.colors.textSecondary }]}>{t('mobileCore.home.cashFlowAfterBills')}</Text>
                  <MoneyText
                    platform={platform}
                    amount={monthNet}
                    signed
                    tone={monthNet >= 0 ? 'income' : 'expense'}
                    style={typography.amount}
                  />
                </View>
                <View style={[styles.dateBadge, { backgroundColor: theme.colors.surfaceMuted }]}>
                  <Text style={[styles.dateNumber, { color: theme.colors.primary }]}>{now.getDate()}</Text>
                  <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{t('mobileCore.home.today')}</Text>
                </View>
              </View>
              <View onLayout={handleChartLayout} style={styles.chartSlot}>
                <PreviewLineChart platform={platform} width={chartWidth} compact={layout.isTablet} values={forecast} />
              </View>
            </AdaptiveSurface>

            <View style={layout.isTablet ? styles.tabletSecondary : undefined}>
              <SectionHeader platform={platform} title={t('mobileCore.home.nextUp')} />
              {nextBill ? (
                <AdaptiveSurface
                  style={[
                    styles.nextCard,
                    {
                      borderColor: nextBillPaid ? theme.colors.border : theme.colors.accent,
                      backgroundColor: nextBillPaid ? theme.colors.surfaceMuted : theme.colors.surface,
                    },
                  ]}
                >
                  <View style={styles.nextBillHeader}>
                    <BillGlyph bill={nextBill} platform={platform} />
                    <View style={styles.nextBillCopy}>
                      <Text style={[typography.section, { color: theme.colors.text }]}>{nextBill.name}</Text>
                      <View style={[styles.dueBadge, { backgroundColor: theme.colors.accentContainer }]}>
                        <Text style={[typography.caption, { color: theme.colors.accent }]}>{nextBill.dueLabel}</Text>
                      </View>
                    </View>
                    <MoneyText
                      platform={platform}
                      amount={nextBill.amount}
                      signed={nextBill.tone === 'income'}
                      tone={nextBill.tone}
                      style={styles.nextAmount}
                    />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={nextBillPaid
                      ? t('mobileCore.home.billIsPaid', { name: nextBill.name })
                      : t('mobileCore.home.markBillPaid', { name: nextBill.name })}
                    accessibilityState={{ disabled: nextBillPaid || syncing, busy: syncing }}
                    disabled={nextBillPaid || syncing}
                    onPress={() => {
                      if (!nextBill.source) return;
                      setPaidBillId(nextBill.id);
                      void recordPayment({ bill: nextBill.source }).catch(() => setPaidBillId(null));
                    }}
                    style={({ pressed }) => [
                      styles.markPaidButton,
                      {
                        minHeight: theme.minimumHitSize,
                        backgroundColor: nextBillPaid ? theme.colors.border : theme.colors.accent,
                        opacity: pressed || syncing ? 0.72 : 1,
                        borderRadius: platform === 'ios' ? 12 : 16,
                      },
                    ]}
                  >
                    <Text style={[typography.headline, { color: '#FFFFFF' }]}>
                      {nextBillPaid
                        ? t('mobileCore.home.paid')
                        : syncing
                          ? t('mobileCore.home.syncing')
                          : t('mobileCore.home.markPaid')}
                    </Text>
                  </Pressable>
                </AdaptiveSurface>
              ) : (
                <AdaptiveSurface style={[styles.nextCard, { borderColor: theme.colors.border }]}>
                  <Text style={[typography.headline, { color: theme.colors.text }]}>{t('mobileCore.home.noUpcoming')}</Text>
                  <Text style={[typography.body, { color: theme.colors.textMuted }]}>{t('mobileCore.home.noUpcomingDetail')}</Text>
                </AdaptiveSurface>
              )}
            </View>
          </View>

          <SectionHeader
            platform={platform}
            title={t('mobileCore.home.comingUp')}
            actionLabel={t('mobileCore.home.viewAll')}
            onAction={openBillsTab}
          />
          <AdaptiveSurface style={styles.upcomingList}>
            {comingUp.length > 0 ? comingUp.map((bill, index) => (
              <AdaptiveListRow
                key={bill.id}
                platform={platform}
                title={bill.name}
                subtitle={`${bill.cadence} • ${bill.dueLabel}`}
                leading={<BillGlyph bill={bill} platform={platform} />}
                trailing={(
                  <MoneyText
                    platform={platform}
                    amount={bill.amount}
                    signed={bill.tone === 'income'}
                    tone={bill.tone}
                    style={styles.listAmount}
                  />
                )}
                onPress={openBillsTab}
                accessibilityLabel={t('mobileCore.home.openBills', {
                  name: bill.name,
                  due: bill.dueLabel,
                  amount: formatCurrency(bill.amount),
                })}
                isLast={index === comingUp.length - 1}
              />
            )) : (
              <View style={styles.emptyUpcoming}>
                <Text style={[typography.body, { color: theme.colors.textMuted }]}>{t('mobileCore.home.nothingElse')}</Text>
              </View>
            )}
          </AdaptiveSurface>
        </View>
      </ScrollView>

      <FloatingAddAction onPress={openAddBill} label={t('mobileCore.common.addBill')} />
      <BucketPicker
        platform={platform}
        visible={bucketPickerVisible}
        selected={selectedGroup}
        options={groupOptions}
        onSelect={(value) => void selectGroup(value)}
        onClose={() => setBucketPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    gap: 12,
  },
  iosBucket: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  overviewHeading: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  overviewCopy: {
    flexShrink: 1,
    gap: 4,
  },
  remainingCard: {
    minWidth: 150,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-end',
    gap: 2,
  },
  remainingAmount: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  successBanner: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tabletGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tabletPrimary: {
    flex: 1.25,
  },
  tabletSecondary: {
    flex: 0.75,
  },
  cashFlowCard: {
    paddingTop: 16,
  },
  cashFlowHeader: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateBadge: {
    minWidth: 64,
    minHeight: 64,
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumber: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
  },
  chartSlot: {
    width: '100%',
    minHeight: 140,
  },
  nextCard: {
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  nextBillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  billGlyph: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBillCopy: {
    minWidth: 0,
    flex: 1,
    alignItems: 'flex-start',
    gap: 5,
  },
  dueBadge: {
    minHeight: 25,
    paddingHorizontal: 10,
    borderRadius: 999,
    justifyContent: 'center',
  },
  nextAmount: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  markPaidButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  upcomingList: {
    width: '100%',
  },
  emptyUpcoming: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  listAmount: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
});
