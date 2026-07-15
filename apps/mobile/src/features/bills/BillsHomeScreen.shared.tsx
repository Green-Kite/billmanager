import React, { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  Bolt,
  Film,
  Music2,
  Search,
  ShieldCheck,
  Wifi,
  X,
} from 'lucide-react-native';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import SegmentedControl from '../../components/adaptive/SegmentedControl';
import { AdaptivePlatform, typography } from '../../design/tokens';
import { useAdaptiveLayout } from '../../design/useAdaptiveLayout';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';
import { formatCurrency } from '../../i18n/format';
import { PreviewBill, PreviewBillIcon } from '../previewData';
import { useBillPresentation } from '../useBillPresentation';

type BillFilter = 'all' | 'expense' | 'income';

interface BillsHomeScreenViewProps {
  platform: AdaptivePlatform;
}

function BillIcon({ bill, platform }: { bill: PreviewBill; platform: AdaptivePlatform }) {
  const theme = useAdaptiveTheme(platform);
  const color = bill.tone === 'income' ? theme.colors.success : theme.colors.primary;
  const icons: Record<PreviewBillIcon, React.ReactNode> = {
    electric: <Bolt size={23} color={theme.colors.accent} fill={theme.colors.accent} />,
    streaming: <Film size={22} color={color} />,
    salary: <ArrowDownToLine size={23} color={color} />,
    music: <Music2 size={22} color={color} />,
    insurance: <ShieldCheck size={22} color={color} />,
    internet: <Wifi size={22} color={color} />,
  };

  return (
    <View
      style={[
        styles.billIcon,
        { backgroundColor: bill.tone === 'income' ? theme.colors.primaryContainer : theme.colors.surfaceMuted },
      ]}
    >
      {icons[bill.icon]}
    </View>
  );
}

export function BillsHomeScreenView({ platform }: BillsHomeScreenViewProps) {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const theme = useAdaptiveTheme(platform);
  const layout = useAdaptiveLayout();
  const {
    bills,
    groupOptions,
    selectedGroup,
    selectGroup,
    totals,
    syncing,
    isAllBuckets,
  } = useBillPresentation();
  const [showBuckets, setShowBuckets] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<BillFilter>('all');
  const [selectedBill, setSelectedBill] = useState<PreviewBill | null>(null);

  const filteredBills = useMemo(() => bills.filter((bill) => {
    const matchesQuery = `${bill.name} ${bill.category} ${bill.account}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesType = filter === 'all' || bill.tone === filter;
    return matchesQuery && matchesType;
  }), [bills, filter, query]);

  const addBill = () => navigation.navigate('AddBill');
  const openReminders = () => navigation.navigate('ReminderInbox');

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {platform === 'android' ? (
        <AdaptiveHeader
          title={t('mobileCore.bills.title')}
          groupName={selectedGroup}
          notificationCount={bills.filter((bill) => bill.source?.reminder_enabled).length}
          onPressGroup={() => setShowBuckets(true)}
          onPressNotifications={openReminders}
        />
      ) : null}

      <ScrollView
        keyboardShouldPersistTaps="handled"
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
          <View style={styles.summaryRow}>
            <View>
              <Text accessibilityRole="header" style={[typography.title, { color: theme.colors.text }]}>{t('mobileCore.bills.thisMonth')}</Text>
              <Text style={[typography.body, { color: theme.colors.textMuted }]}>
                {t('mobileCore.bills.activeBills', { count: bills.length, group: selectedGroup })}
              </Text>
            </View>
            <View style={styles.summaryAmount}>
              <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{t('mobileCore.bills.remaining')}</Text>
              <MoneyText platform={platform} amount={totals.expenses} style={styles.totalAmount} />
            </View>
          </View>

          <AdaptiveSurface style={styles.searchSurface}>
            <Search size={21} color={theme.colors.textMuted} />
            <TextInput
              accessibilityLabel={t('mobileCore.bills.search')}
              autoCapitalize="none"
              clearButtonMode="while-editing"
              placeholder={t('mobileCore.bills.searchPlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              value={query}
              onChangeText={setQuery}
              style={[styles.searchInput, typography.body, { color: theme.colors.text }]}
            />
            {query.length > 0 && platform === 'android' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('mobileCore.bills.clearSearch')}
                hitSlop={10}
                onPress={() => setQuery('')}
                style={styles.clearButton}
              >
                <X size={20} color={theme.colors.textMuted} />
              </Pressable>
            ) : null}
          </AdaptiveSurface>

          <SegmentedControl
            platform={platform}
            label={t('mobileCore.bills.filterByType')}
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: t('mobileCore.bills.all') },
              { value: 'expense', label: t('mobileCore.bills.expenses') },
              { value: 'income', label: t('mobileCore.bills.income') },
            ]}
          />

          <AdaptiveSurface>
            {filteredBills.length > 0 ? filteredBills.map((bill, index) => (
              <AdaptiveListRow
                key={bill.id}
                platform={platform}
                title={bill.name}
                subtitle={`${bill.cadence} • ${bill.dueLabel} • ${bill.account}${isAllBuckets && bill.source?.database_name ? ` • ${bill.source.database_name}` : ''}`}
                leading={<BillIcon bill={bill} platform={platform} />}
                trailing={(
                  <MoneyText
                    platform={platform}
                    amount={bill.amount}
                    signed={bill.tone === 'income'}
                    tone={bill.tone}
                    style={styles.rowAmount}
                  />
                )}
                onPress={() => setSelectedBill(bill)}
                accessibilityLabel={`${bill.name}, ${bill.cadence}, ${bill.dueLabel}, ${formatCurrency(bill.amount)}`}
                isLast={index === filteredBills.length - 1}
              />
            )) : (
              <View style={styles.emptyState}>
                <Search size={28} color={theme.colors.textMuted} />
                <Text style={[typography.headline, { color: theme.colors.text }]}>{t('mobileCore.bills.noMatches')}</Text>
                <Text style={[typography.body, styles.emptyCopy, { color: theme.colors.textMuted }]}>{t('mobileCore.bills.noMatchesDetail')}</Text>
              </View>
            )}
          </AdaptiveSurface>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mobileCore.bills.manageAll')}
            onPress={() => navigation.navigate('BillsList')}
            style={({ pressed }) => [
              styles.liveListButton,
              {
                minHeight: theme.minimumHitSize,
                borderColor: theme.colors.primary,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[typography.callout, { color: theme.colors.primary, fontWeight: '700' }]}>
              {syncing ? t('mobileCore.bills.syncing') : t('mobileCore.bills.manageAll')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <FloatingAddAction onPress={addBill} label={t('mobileCore.common.addBill')} />
      <BucketPicker
        platform={platform}
        visible={showBuckets}
        selected={selectedGroup}
        options={groupOptions}
        onSelect={(value) => void selectGroup(value)}
        onClose={() => setShowBuckets(false)}
      />

      <Modal
        animationType={platform === 'ios' ? 'slide' : 'fade'}
        transparent
        visible={Boolean(selectedBill)}
        onRequestClose={() => setSelectedBill(null)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedBill(null)} />
          {selectedBill ? (
            <AdaptiveSurface style={[styles.detailSheet, platform === 'ios' && styles.iosDetailSheet]}>
              <View style={styles.detailHeader}>
                <BillIcon bill={selectedBill} platform={platform} />
                <View style={styles.detailCopy}>
                  <Text accessibilityRole="header" style={[typography.section, { color: theme.colors.text }]}>{selectedBill.name}</Text>
                  <Text style={[typography.body, { color: theme.colors.textMuted }]}>{selectedBill.category} • {selectedBill.account}</Text>
                </View>
                <MoneyText
                  platform={platform}
                  amount={selectedBill.amount}
                  tone={selectedBill.tone}
                  style={styles.detailAmount}
                />
              </View>
              <View style={[styles.detailMeta, { backgroundColor: theme.colors.surfaceMuted }]}>
                <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{t('mobileCore.bills.nextDate')}</Text>
                <Text style={[typography.headline, { color: theme.colors.text }]}>{selectedBill.dueLabel}</Text>
                <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{t('mobileCore.bills.repeats')}</Text>
                <Text style={[typography.headline, { color: theme.colors.text }]}>{selectedBill.cadence}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('mobileCore.bills.viewDetails', { name: selectedBill.name })}
                onPress={() => {
                  setSelectedBill(null);
                  if (selectedBill.source) {
                    navigation.navigate('BillDetail', { billId: selectedBill.source.id });
                  } else {
                    navigation.navigate('BillsList');
                  }
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    minHeight: theme.minimumHitSize,
                    borderRadius: platform === 'ios' ? 12 : 16,
                    backgroundColor: theme.colors.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[typography.headline, { color: theme.colors.onPrimary }]}>{t('mobileCore.bills.viewBill')}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('mobileCore.bills.closeDetails')}
                onPress={() => setSelectedBill(null)}
                style={[styles.secondaryButton, { minHeight: theme.minimumHitSize }]}
              >
                <Text style={[typography.callout, { color: theme.colors.primary }]}>{t('mobileCore.common.close')}</Text>
              </Pressable>
            </AdaptiveSurface>
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingTop: 20 },
  content: { width: '100%', alignSelf: 'center', gap: 16 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryAmount: { alignItems: 'flex-end', gap: 2 },
  totalAmount: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  searchSurface: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { minWidth: 0, flex: 1, paddingVertical: 0 },
  clearButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  billIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowAmount: { fontSize: 16, lineHeight: 21, fontWeight: '700' },
  emptyState: { padding: 32, alignItems: 'center', gap: 8 },
  emptyCopy: { textAlign: 'center' },
  liveListButton: {
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalOverlay: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailSheet: { width: '100%', maxWidth: 520, padding: 18, gap: 16 },
  iosDetailSheet: { marginTop: 'auto', marginBottom: -20, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailCopy: { minWidth: 0, flex: 1, gap: 2 },
  detailAmount: { fontSize: 21, lineHeight: 27, fontWeight: '800' },
  detailMeta: { padding: 14, borderRadius: 12, gap: 4 },
  primaryButton: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  secondaryButton: { alignItems: 'center', justifyContent: 'center' },
});
