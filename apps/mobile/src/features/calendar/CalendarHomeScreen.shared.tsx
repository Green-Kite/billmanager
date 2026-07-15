import React, { useMemo, useState } from 'react';
import { ArrowDownToLine, BellRing, Bolt, ChevronLeft, ChevronRight, Film } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import AdaptiveHeader from '../../components/adaptive/AdaptiveHeader';
import AdaptiveListRow from '../../components/adaptive/AdaptiveListRow';
import AdaptiveSurface from '../../components/adaptive/AdaptiveSurface';
import BucketPicker from '../../components/adaptive/BucketPicker';
import FloatingAddAction from '../../components/adaptive/FloatingAddAction';
import MoneyText from '../../components/adaptive/MoneyText';
import SectionHeader from '../../components/adaptive/SectionHeader';
import SegmentedControl from '../../components/adaptive/SegmentedControl';
import { AdaptivePlatform, typography } from '../../design/tokens';
import { useAdaptiveLayout } from '../../design/useAdaptiveLayout';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';
import { formatDate } from '../../i18n/format';
import { PreviewBill } from '../previewData';
import { useBillPresentation } from '../useBillPresentation';
import { expandCalendarOccurrences } from './calendarProjection';

type Range = '1' | '3' | '6';

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function calendarDaysForMonth(month: Date): Array<number | null> {
  const leadingBlanks = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days: Array<number | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

interface CalendarHomeScreenViewProps {
  platform: AdaptivePlatform;
}

export function CalendarHomeScreenView({ platform }: CalendarHomeScreenViewProps) {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const theme = useAdaptiveTheme(platform);
  const layout = useAdaptiveLayout();
  const {
    bills,
    groupOptions,
    selectedGroup,
    selectGroup,
    recordPayment,
  } = useBillPresentation();
  const [showBuckets, setShowBuckets] = useState(false);
  const [range, setRange] = useState<Range>('1');
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [monthOffset, setMonthOffset] = useState(0);
  const visibleDate = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  }, [monthOffset]);
  const monthLabel = formatDate(visibleDate, {
    month: 'long',
    year: 'numeric',
  });
  const monthName = formatDate(visibleDate, { month: 'long' });
  const weekdayLabels = Array.from({ length: 7 }, (_, index) => formatDate(
    new Date(2021, 7, index + 1),
    { weekday: 'narrow' },
  ));
  const visibleMonths = useMemo(() => Array.from(
    { length: Number(range) },
    (_, index) => new Date(visibleDate.getFullYear(), visibleDate.getMonth() + index, 1),
  ), [range, visibleDate]);
  const calendarOccurrences = useMemo(() => {
    const start = visibleMonths[0];
    const endMonth = visibleMonths[visibleMonths.length - 1];
    const end = new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0, 23, 59, 59);
    return expandCalendarOccurrences(bills, start, end);
  }, [bills, visibleMonths]);
  const agendaByDate = useMemo(() => calendarOccurrences.reduce<Record<string, PreviewBill[]>>((result, bill) => {
    if (!bill.dueDate) return result;
    (result[bill.dueDate] ??= []).push(bill);
    return result;
  }, {}), [calendarOccurrences]);
  const agenda = agendaByDate[selectedDate] ?? [];
  const selectedDateValue = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate]);
  const selectedDateLabel = formatDate(selectedDateValue, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const visibleTotals = useMemo(() => calendarOccurrences.reduce((result, bill) => {
      if (bill.tone === 'income') result.income += bill.amount;
      else result.expenses += bill.amount;
      return result;
    }, { income: 0, expenses: 0 }), [calendarOccurrences]);

  const moveMonth = (direction: -1 | 1) => {
    setMonthOffset((value) => value + direction);
    const today = new Date();
    setSelectedDate(dateKey(new Date(today.getFullYear(), today.getMonth() + monthOffset + direction, 1)));
  };

  const goToToday = () => {
    setMonthOffset(0);
    setSelectedDate(dateKey(new Date()));
  };

  const renderMonthCalendar = (month: Date) => {
    const label = formatDate(month, {
      month: 'long',
      year: 'numeric',
    });
    const days = calendarDaysForMonth(month);
    const cardWidth = layout.isTablet
      ? undefined
      : range === '1'
        ? layout.contentWidth
        : Math.min(layout.contentWidth - 24, 410);
    return (
      <AdaptiveSurface
        key={`${month.getFullYear()}-${month.getMonth()}`}
        style={[
          styles.calendarCard,
          layout.isTablet && {
            width: layout.isWideTablet ? '48.5%' : '100%',
          },
          cardWidth ? { width: cardWidth } : undefined,
        ]}
      >
        <Text accessibilityRole="header" style={[typography.section, styles.calendarTitle, { color: theme.colors.text }]}>
          {label}
        </Text>
        <View style={styles.weekRow}>
          {weekdayLabels.map((weekday, index) => (
            <Text key={`${weekday}-${index}`} style={[styles.weekLabel, typography.caption, { color: theme.colors.textMuted }]}>
              {weekday}
            </Text>
          ))}
        </View>
        <View accessibilityRole="list" accessibilityLabel={t('mobileCore.calendar.calendarA11y', { label })} style={styles.calendarGrid}>
          {days.map((day, index) => {
            const key = day == null
              ? null
              : dateKey(new Date(month.getFullYear(), month.getMonth(), day));
            const isSelected = key === selectedDate;
            const scheduledBills = key ? agendaByDate[key] : undefined;
            const dateLabel = day
              ? formatDate(new Date(month.getFullYear(), month.getMonth(), day), { month: 'long', day: 'numeric' })
              : '';
            return (
              <View key={`${day ?? 'blank'}-${index}`} style={styles.dayCell}>
                {day ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={scheduledBills
                      ? t('mobileCore.calendar.scheduledItems', { date: dateLabel, count: scheduledBills.length })
                      : dateLabel}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => key && setSelectedDate(key)}
                    style={({ pressed }) => [
                      styles.dayButton,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                        opacity: pressed ? 0.65 : 1,
                      },
                    ]}
                  >
                    <Text style={[typography.callout, { color: isSelected ? theme.colors.onPrimary : theme.colors.text }]}>
                      {day}
                    </Text>
                    {scheduledBills ? (
                      <View style={[styles.eventDot, { backgroundColor: isSelected ? theme.colors.onPrimary : theme.colors.accent }]} />
                    ) : null}
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      </AdaptiveSurface>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {platform === 'android' ? (
        <AdaptiveHeader
          title={t('mobileCore.calendar.title')}
          groupName={selectedGroup}
          notificationCount={bills.filter((bill) => bill.source?.reminder_enabled).length}
          onPressGroup={() => setShowBuckets(true)}
          onPressNotifications={() => navigation.navigate('ReminderInbox')}
        />
      ) : null}

      <ScrollView
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
          <SegmentedControl
            platform={platform}
            label={t('mobileCore.calendar.range')}
            value={range}
            onChange={(value) => {
              setRange(value);
              setSelectedDate(dateKey(visibleDate));
            }}
            options={[
              { value: '1', label: t('mobileCore.calendar.oneMonth') },
              { value: '3', label: t('mobileCore.calendar.threeMonths') },
              { value: '6', label: t('mobileCore.calendar.sixMonths') },
            ]}
          />

          <View style={[layout.isTablet && styles.tabletGrid, { gap: layout.columnGap }]}>
            <View style={[styles.calendarPane, layout.isTablet && styles.calendarPaneTablet]}>
              <View style={styles.monthHeader}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('mobileCore.calendar.previousMonth')}
                  onPress={() => moveMonth(-1)}
                  style={({ pressed }) => [styles.monthButton, { opacity: pressed ? 0.5 : 1 }]}
                >
                  <ChevronLeft size={22} color={theme.colors.primary} />
                </Pressable>
                <View style={styles.monthCopy}>
                  <Text accessibilityRole="header" style={[typography.section, { color: theme.colors.text }]}>{monthLabel}</Text>
                  <Text style={[typography.caption, { color: theme.colors.textMuted }]}>
                    {range === '1'
                      ? t('mobileCore.calendar.monthlyAgenda')
                      : t('mobileCore.calendar.rangePlanning', { count: Number(range) })}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('mobileCore.calendar.nextMonth')}
                  onPress={() => moveMonth(1)}
                  style={({ pressed }) => [styles.monthButton, { opacity: pressed ? 0.5 : 1 }]}
                >
                  <ChevronRight size={22} color={theme.colors.primary} />
                </Pressable>
              </View>
              {!layout.isTablet && range !== '1' ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.calendarScroller, { gap: layout.columnGap }]}
                  snapToInterval={Math.min(layout.contentWidth - 24, 410) + layout.columnGap}
                  decelerationRate="fast"
                >
                  {visibleMonths.map(renderMonthCalendar)}
                </ScrollView>
              ) : (
                <View style={[layout.isTablet && styles.calendarCollection, { gap: layout.columnGap }]}>
                  {visibleMonths.map(renderMonthCalendar)}
                </View>
              )}
            </View>

            <View style={layout.isTablet && styles.agendaPane}>
              <SectionHeader
                platform={platform}
                title={selectedDateLabel}
                actionLabel={t('mobileCore.calendar.today')}
                onAction={goToToday}
              />
              <AdaptiveSurface>
                {agenda.length > 0 ? agenda.map((bill, index) => (
                  <View key={`${bill.id}-${bill.dueDate}`} style={index < agenda.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border }}>
                    <AdaptiveListRow
                      platform={platform}
                      title={bill.name}
                      subtitle={`${bill.cadence} • ${bill.account}`}
                      leading={(
                        <View style={[styles.agendaIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
                          {bill.id === 'electric' ? <Bolt size={22} color={theme.colors.accent} /> : null}
                          {bill.id === 'netflix' ? <Film size={22} color={theme.colors.primary} /> : null}
                          {bill.id === 'salary' ? <ArrowDownToLine size={22} color={theme.colors.success} /> : null}
                        </View>
                      )}
                      trailing={(
                        <MoneyText
                          platform={platform}
                          amount={bill.amount}
                          signed={bill.tone === 'income'}
                          tone={bill.tone}
                          style={styles.agendaAmount}
                        />
                      )}
                      onPress={() => navigation.getParent()?.navigate('BillsTab', {
                        screen: 'BillDetail',
                        params: { billId: Number(bill.id) },
                      })}
                      isLast
                    />
                    {bill.source && !bill.source.archived ? (
                      <View style={styles.agendaActions}>
                        {!bill.source.is_shared ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('mobileCore.calendar.editBillA11y', { name: bill.name })}
                            onPress={() => navigation.navigate('AddBill', { bill: bill.source })}
                            style={({ pressed }) => [styles.agendaAction, { borderColor: theme.colors.border, opacity: pressed ? 0.55 : 1 }]}
                          >
                            <Text style={[typography.callout, { color: theme.colors.primary }]}>{t('mobileCore.calendar.editBill')}</Text>
                          </Pressable>
                        ) : null}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t('mobileCore.calendar.recordPaymentA11y', { name: bill.name })}
                          onPress={() => void recordPayment({ bill: bill.source! }).then(
                            () => Alert.alert(
                              t('mobileCore.calendar.paymentRecordedTitle'),
                              t('mobileCore.calendar.paymentRecordedBody', { name: bill.name }),
                            ),
                            (reason) => Alert.alert(
                              t('mobileCore.calendar.paymentFailedTitle'),
                              reason instanceof Error ? reason.message : t('mobileCore.calendar.paymentFailedBody'),
                            ),
                          )}
                          style={({ pressed }) => [styles.agendaAction, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, opacity: pressed ? 0.72 : 1 }]}
                        >
                          <Text style={[typography.callout, { color: theme.colors.onPrimary, fontWeight: '700' }]}>{t('mobileCore.calendar.markPaid')}</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                )) : (
                  <View style={styles.emptyAgenda}>
                    <BellRing size={28} color={theme.colors.textMuted} />
                    <Text style={[typography.headline, { color: theme.colors.text }]}>{t('mobileCore.calendar.nothingScheduled')}</Text>
                    <Text style={[typography.body, styles.emptyText, { color: theme.colors.textMuted }]}>{t('mobileCore.calendar.nothingScheduledDetail')}</Text>
                  </View>
                )}
              </AdaptiveSurface>

              <AdaptiveSurface style={[styles.monthSummary, { backgroundColor: theme.colors.surfaceMuted }]}>
                <View>
                  <Text style={[typography.caption, { color: theme.colors.textMuted }]}>
                    {range === '1'
                      ? t('mobileCore.calendar.monthExpenses', { month: monthName })
                      : t('mobileCore.calendar.rangeExpenses', { count: Number(range) })}
                  </Text>
                  <MoneyText platform={platform} amount={visibleTotals.expenses} style={styles.summaryValue} />
                </View>
                <View style={styles.summaryRight}>
                  <Text style={[typography.caption, { color: theme.colors.textMuted }]}>
                    {range === '1'
                      ? t('mobileCore.calendar.monthIncome', { month: monthName })
                      : t('mobileCore.calendar.rangeIncome', { count: Number(range) })}
                  </Text>
                  <MoneyText platform={platform} amount={visibleTotals.income} tone="income" style={styles.summaryValue} />
                </View>
              </AdaptiveSurface>
            </View>
          </View>
        </View>
      </ScrollView>

      <FloatingAddAction onPress={() => navigation.navigate('AddBill')} label={t('mobileCore.calendar.addBill')} />
      <BucketPicker
        platform={platform}
        visible={showBuckets}
        selected={selectedGroup}
        options={groupOptions}
        onSelect={(value) => void selectGroup(value)}
        onClose={() => setShowBuckets(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingTop: 20 },
  content: { width: '100%', alignSelf: 'center', gap: 16 },
  tabletGrid: { flexDirection: 'row', alignItems: 'flex-start' },
  calendarPane: { width: '100%' },
  calendarPaneTablet: { flex: 1.2 },
  calendarCollection: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarScroller: { paddingHorizontal: 1, paddingBottom: 2 },
  calendarCard: { overflow: 'hidden' },
  calendarTitle: { textAlign: 'center', paddingTop: 18, paddingBottom: 6 },
  agendaPane: { flex: 0.8, minWidth: 320 },
  agendaActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  agendaAction: { minHeight: 42, minWidth: 82, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  monthHeader: {
    minHeight: 72,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  monthCopy: { alignItems: 'center', gap: 1 },
  weekRow: { flexDirection: 'row', paddingHorizontal: 8 },
  weekLabel: { width: `${100 / 7}%`, textAlign: 'center', paddingVertical: 8 },
  calendarGrid: { paddingHorizontal: 8, paddingBottom: 12, flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayButton: { width: '86%', aspectRatio: 1, maxWidth: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  eventDot: { width: 5, height: 5, borderRadius: 3, position: 'absolute', bottom: 5 },
  agendaIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  agendaAmount: { fontSize: 16, lineHeight: 21, fontWeight: '700' },
  emptyAgenda: { minHeight: 190, padding: 28, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { textAlign: 'center' },
  monthSummary: { marginTop: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', gap: 18 },
  summaryRight: { alignItems: 'flex-end' },
  summaryValue: { marginTop: 4, fontSize: 20, lineHeight: 26, fontWeight: '800' },
});
