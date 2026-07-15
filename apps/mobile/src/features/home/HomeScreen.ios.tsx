import { useNavigation } from '@react-navigation/native';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import {
  ArrowDownToLine,
  Bolt,
  ChevronRight,
  Film,
  Music2,
  ShieldCheck,
  Wifi,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import AdaptiveSurface from '../../components/adaptive/AdaptiveSurface';
import BucketPicker from '../../components/adaptive/BucketPicker';
import MoneyText from '../../components/adaptive/MoneyText';
import SectionHeader from '../../components/adaptive/SectionHeader';
import { typography } from '../../design/tokens';
import { useAdaptiveLayout } from '../../design/useAdaptiveLayout';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';
import { formatCurrency, formatDate } from '../../i18n/format';
import type { PreviewBill, PreviewBillIcon } from '../previewData';
import { useBillPresentation } from '../useBillPresentation';

const symbolNames: Record<PreviewBillIcon, SFSymbol> = {
  electric: 'bolt.fill',
  streaming: 'film.fill',
  salary: 'arrow.down.circle.fill',
  music: 'music.note',
  insurance: 'shield.fill',
  internet: 'wifi',
};

function BillFallback({ icon, color }: { icon: PreviewBillIcon; color: string }) {
  const props = { size: 24, color, strokeWidth: 2.2 };
  switch (icon) {
    case 'electric': return <Bolt {...props} />;
    case 'streaming': return <Film {...props} />;
    case 'salary': return <ArrowDownToLine {...props} />;
    case 'music': return <Music2 {...props} />;
    case 'insurance': return <ShieldCheck {...props} />;
    default: return <Wifi {...props} />;
  }
}

function BillRow({
  bill,
  paid,
  showPaidAction,
  onOpen,
  onMarkPaid,
  isLast,
}: {
  bill: PreviewBill;
  paid: boolean;
  showPaidAction: boolean;
  onOpen: () => void;
  onMarkPaid: () => void;
  isLast: boolean;
}) {
  const theme = useAdaptiveTheme('ios');
  const { t } = useTranslation();
  const toneColor = bill.tone === 'income' ? theme.colors.success : theme.colors.text;
  return (
    <View style={[styles.row, !isLast && { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('mobileCore.home.openBills', {
          name: bill.name,
          due: bill.dueLabel,
          amount: formatCurrency(bill.amount),
        })}
        onPress={onOpen}
        style={({ pressed }) => [styles.rowMain, { opacity: pressed ? 0.58 : 1 }]}
      >
        <View style={[styles.glyph, { backgroundColor: theme.colors.surfaceMuted }]}>
          <SymbolView
            name={symbolNames[bill.icon]}
            size={25}
            weight="medium"
            tintColor={theme.colors.primary}
            fallback={<BillFallback icon={bill.icon} color={theme.colors.primary} />}
          />
        </View>
        <View style={styles.rowCopy}>
          <Text numberOfLines={1} style={[typography.headline, { color: theme.colors.text }]}>{bill.name}</Text>
          <Text numberOfLines={1} style={[typography.body, { color: bill.dueLabel.toLowerCase().includes('today') ? theme.colors.accent : theme.colors.textMuted }]}>{bill.dueLabel}</Text>
        </View>
        <MoneyText
          platform="ios"
          amount={bill.amount}
          signed={bill.tone === 'income'}
          tone={bill.tone}
          style={[styles.amount, { color: toneColor }]}
        />
        <ChevronRight size={21} color={theme.colors.border} strokeWidth={2.6} />
      </Pressable>
      {showPaidAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paid
            ? t('mobileCore.home.billIsPaid', { name: bill.name })
            : t('mobileCore.home.markBillPaid', { name: bill.name })}
          accessibilityState={{ disabled: paid }}
          disabled={paid}
          onPress={onMarkPaid}
          style={({ pressed }) => [
            styles.payButton,
            {
              backgroundColor: paid ? theme.colors.surfaceMuted : theme.colors.primary,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <Text style={[typography.headline, { color: paid ? theme.colors.textMuted : '#FFFFFF' }]}>
            {paid ? t('mobileCore.home.paid') : t('mobileCore.home.markPaid')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const theme = useAdaptiveTheme('ios');
  const layout = useAdaptiveLayout();
  const {
    bills,
    groupOptions,
    selectedGroup,
    selectGroup,
    totals,
    payments,
    recordPayment,
    syncNow,
    syncing,
  } = useBillPresentation();
  const [bucketPickerVisible, setBucketPickerVisible] = useState(false);
  const [paidBillIds, setPaidBillIds] = useState<Set<string>>(() => new Set());
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayBills = bills.filter((bill) => bill.dueDate === todayKey);
  const laterBills = bills.filter((bill) => bill.dueDate !== todayKey).slice(0, 5);
  const paidThisMonth = useMemo(() => payments.reduce((sum, payment) => (
    payment.payment_date.startsWith(todayKey.slice(0, 7)) ? sum + payment.amount : sum
  ), 0), [payments, todayKey]);
  const remaining = Math.max(0, totals.expenses - paidThisMonth);

  const openBills = () => navigation.getParent()?.navigate('BillsTab');
  const markPaid = async (bill: PreviewBill) => {
    setPaidBillIds((current) => new Set(current).add(bill.id));
    if (!bill.source) return;
    try {
      await recordPayment({ bill: bill.source });
    } catch {
      setPaidBillIds((current) => {
        const next = new Set(current);
        next.delete(bill.id);
        return next;
      });
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={syncing} onRefresh={() => void syncNow()} tintColor={theme.colors.primary} />}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: layout.horizontalPadding,
            maxWidth: theme.contentMaxWidth,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mobileCore.common.currentGroup', { group: selectedGroup })}
          onPress={() => setBucketPickerVisible(true)}
          style={({ pressed }) => [
            styles.bucket,
            {
              minHeight: theme.minimumHitSize,
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.62 : 1,
            },
          ]}
        >
          <View style={[styles.bucketGlyph, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={[styles.bucketGlyphText, { color: theme.colors.primary }]}>$</Text>
          </View>
          <Text numberOfLines={1} style={[styles.bucketName, { color: theme.colors.text }]}>{selectedGroup}</Text>
          <ChevronRight size={21} color={theme.colors.textMuted} style={styles.bucketChevron} />
        </Pressable>

        <AdaptiveSurface style={[styles.summary, layout.width < 350 && styles.summaryCompact]}>
          <View style={[styles.summaryColumn, layout.width < 350 && styles.summaryDateColumnCompact]}>
            <Text style={[typography.section, { color: theme.colors.primary }]}>{formatDate(now, { month: 'long', day: 'numeric' })}</Text>
            <Text style={[
              typography.body,
              layout.width < 350 && styles.summaryLabelCompact,
              { color: theme.colors.textMuted },
            ]}>{t('mobileCore.home.thisMonth')}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
          <View style={[styles.summaryColumn, layout.width < 350 && styles.summaryMoneyColumnCompact]}>
            <MoneyText
              platform="ios"
              amount={remaining}
              style={[
                typography.amount,
                layout.width < 350 && styles.summaryAmountCompact,
                { color: theme.colors.primary },
              ]}
            />
            <Text style={[
              typography.body,
              layout.width < 350 && styles.summaryLabelCompact,
              { color: theme.colors.textMuted },
            ]}>{t('mobileCore.home.remaining')}</Text>
          </View>
          <View style={[
            styles.moneyGlyph,
            layout.width < 350 && styles.moneyGlyphCompact,
            { backgroundColor: theme.colors.primaryContainer },
          ]}>
            <Text style={[styles.moneyGlyphText, { color: theme.colors.primary }]}>$</Text>
          </View>
        </AdaptiveSurface>

        <SectionHeader platform="ios" title={t('mobileCore.home.today')} />
        <AdaptiveSurface>
          {(todayBills.length > 0 ? todayBills : bills.slice(0, 1)).map((bill, index, source) => (
            <BillRow
              key={bill.id}
              bill={bill}
              paid={paidBillIds.has(bill.id)}
              showPaidAction={index === 0 && bill.tone === 'expense'}
              onOpen={openBills}
              onMarkPaid={() => void markPaid(bill)}
              isLast={index === source.length - 1}
            />
          ))}
        </AdaptiveSurface>

        <SectionHeader platform="ios" title={t('mobileCore.home.laterThisWeek')} />
        <AdaptiveSurface>
          {laterBills.map((bill, index) => (
            <BillRow
              key={bill.id}
              bill={bill}
              paid={paidBillIds.has(bill.id)}
              showPaidAction={false}
              onOpen={openBills}
              onMarkPaid={() => void markPaid(bill)}
              isLast={index === laterBills.length - 1}
            />
          ))}
        </AdaptiveSurface>

        <Text style={[styles.refreshHint, { color: theme.colors.textMuted }]}>
          {t('mobileCore.home.pullToRefresh')}
        </Text>
      </ScrollView>
      <BucketPicker
        platform="ios"
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
  screen: { flex: 1 },
  content: {
    width: '100%',
    alignSelf: 'center',
    paddingTop: 10,
    paddingBottom: 32,
    gap: 14,
  },
  bucket: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bucketGlyph: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketGlyphText: { fontSize: 20, lineHeight: 24, fontWeight: '800' },
  bucketName: { flex: 1, fontSize: 19, lineHeight: 24, fontWeight: '600' },
  bucketChevron: { transform: [{ rotate: '90deg' }] },
  summary: {
    minHeight: 112,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryCompact: { padding: 14, gap: 10 },
  summaryAmountCompact: { fontSize: 26, lineHeight: 32 },
  summaryLabelCompact: { fontSize: 14, lineHeight: 20 },
  summaryDateColumnCompact: { flex: 0.76 },
  summaryMoneyColumnCompact: { flex: 1.24 },
  summaryColumn: { flex: 1, gap: 4 },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 62 },
  moneyGlyph: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moneyGlyphCompact: { width: 36, height: 36, borderRadius: 10 },
  moneyGlyphText: { fontSize: 22, lineHeight: 26, fontWeight: '800' },
  row: { paddingHorizontal: 14, paddingVertical: 10 },
  rowMain: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12 },
  glyph: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { minWidth: 0, flex: 1, gap: 2 },
  amount: { fontSize: 18, lineHeight: 23, fontWeight: '600', fontVariant: ['tabular-nums'] },
  payButton: {
    minHeight: 44,
    marginLeft: 58,
    marginTop: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshHint: { textAlign: 'center', fontSize: 13, lineHeight: 18 },
});
