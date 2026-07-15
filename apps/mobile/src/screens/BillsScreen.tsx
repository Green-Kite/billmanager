import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUpDown, ChevronDown, Plus, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useMobileRuntime } from '../context/MobileRuntimeContext';
import { formatCurrency, formatDate } from '../i18n/format';
import { Bill } from '../types';
import { BillIcon } from '../components/BillIcon';
import { useTranslation } from 'react-i18next';
import {
  billBucketLabel,
  countBillListFilters,
  emptyBillListFilters,
  filterAndSortBills,
  type BillListFilters,
  type BillSort,
} from '../features/bills/listModels';

type BillsStackParamList = {
  BillsList: undefined;
  BillDetail: { billId: number };
  AddBill: undefined;
};

type NavigationProp = NativeStackNavigationProp<BillsStackParamList, 'BillsList'>;
type FilterType = 'all' | 'expense' | 'deposit' | 'archived';

function formatBillAmount(amount: number | null, average: number | undefined, variableLabel: string): string {
  if (amount !== null) return formatCurrency(amount);
  return average && average > 0 ? `~${formatCurrency(average)}` : variableLabel;
}

const getDaysUntil = (dateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateStr + 'T00:00:00');
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDueBadgeColor = (daysUntil: number): string => {
  if (daysUntil < 0) return '#ef4444';
  if (daysUntil <= 7) return '#ef4444';
  if (daysUntil <= 14) return '#f97316';
  if (daysUntil <= 21) return '#eab308';
  if (daysUntil <= 30) return '#3b82f6';
  return '#6b7280';
};

export default function BillsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { currentDatabase, databases, selectDatabase } = useAuth();
  const runtime = useMobileRuntime();
  const { bills, archivedBills } = runtime;
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [showDbPicker, setShowDbPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [listFilters, setListFilters] = useState<BillListFilters>(emptyBillListFilters);
  const [sort, setSort] = useState<BillSort>('due_asc');
  const [page, setPage] = useState(1);

  const styles = createStyles(colors, insets);
  const sortLabels: Record<BillSort, string> = {
    due_asc: t('mobileParity.bills.sortDueSoonest'),
    due_desc: t('mobileParity.bills.sortDueLatest'),
    name_asc: t('mobileParity.bills.sortNameAsc'),
    name_desc: t('mobileParity.bills.sortNameDesc'),
    amount_desc: t('mobileParity.bills.sortHighest'),
    amount_asc: t('mobileParity.bills.sortLowest'),
  };

  const handleRefresh = useCallback(() => {
    void runtime.syncNow().catch(() => undefined);
  }, [runtime]);

  const handleBillPress = (bill: Bill) => {
    navigation.navigate('BillDetail', { billId: bill.id });
  };

  const handleAddBill = () => {
    navigation.navigate('AddBill');
  };

  const handleSelectDatabase = async (dbName: string) => {
    setShowDbPicker(false);
    if (dbName !== currentDatabase) {
      await selectDatabase(dbName);
    }
  };

  const closeFilters = () => {
    const validDate = (value: string) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
    if (!validDate(listFilters.dueFrom) || !validDate(listFilters.dueTo)) {
      Alert.alert(t('mobileParity.bills.checkDue'), t('mobileParity.bills.invalidDue'));
      return;
    }
    if (listFilters.dueFrom && listFilters.dueTo && listFilters.dueFrom > listFilters.dueTo) {
      Alert.alert(t('mobileParity.bills.checkDue'), t('mobileParity.bills.dueOrder'));
      return;
    }
    setShowFilters(false);
  };

  const isAllBucketsMode = currentDatabase === '_all_';
  const currentDbInfo = isAllBucketsMode
    ? { id: 0, name: '_all_', display_name: t('mobileCore.common.allBuckets') }
    : databases.find(db => db.name === currentDatabase);

  const sourceBills = useMemo(() => {
    const source = filter === 'archived' ? archivedBills : bills;
    return filter === 'expense' || filter === 'deposit'
      ? source.filter((bill) => bill.type === filter)
      : source;
  }, [archivedBills, bills, filter]);
  const filteredBills = useMemo(
    () => filterAndSortBills(sourceBills, searchQuery, listFilters, sort),
    [listFilters, searchQuery, sort, sourceBills],
  );
  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(filteredBills.length / pageSize));
  const visibleBills = filteredBills.slice(0, page * pageSize);
  const detailedFilterCount = countBillListFilters(listFilters);
  const filterOptions = useMemo(() => ({
    accounts: [...new Set([...bills, ...archivedBills]
      .map((bill) => bill.account)
      .filter((value): value is string => Boolean(value)))].sort(),
    categories: [...new Set([...bills, ...archivedBills]
      .map((bill) => bill.category)
      .filter((value): value is string => Boolean(value)))].sort(),
  }), [archivedBills, bills]);

  useEffect(() => {
    setPage(1);
  }, [currentDatabase, filter, listFilters, searchQuery, sort]);

  const counts = {
    all: bills.length,
    expense: bills.filter(b => b.type === 'expense').length,
    deposit: bills.filter(b => b.type === 'deposit').length,
    archived: archivedBills.length,
  };

  const renderBillCard = ({ item: bill }: { item: Bill }) => {
    const daysUntil = getDaysUntil(bill.next_due);
    const isOverdue = daysUntil < 0;
    const isDeposit = bill.type === 'deposit';
    const isShared = bill.is_shared;
    const badgeColor = getDueBadgeColor(daysUntil);
    const bucketLabel = billBucketLabel(bill, databases);

    const dueText = isOverdue
      ? t('mobileParity.bills.dueAgo', { count: Math.abs(daysUntil) })
      : daysUntil === 0
      ? t('mobileParity.bills.dueToday')
      : t('mobileParity.bills.dueIn', { count: daysUntil });

    return (
      <TouchableOpacity
        style={[
          styles.billCard,
          isShared && { backgroundColor: colors.primary + '08', borderLeftWidth: 3, borderLeftColor: colors.primary }
        ]}
        onPress={() => handleBillPress(bill)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <BillIcon
            icon={bill.icon}
            size={24}
            containerSize={48}
            color={isDeposit ? colors.success : colors.primary}
            backgroundColor={isDeposit ? colors.success + '15' : colors.primary + '15'}
          />

          <View style={styles.cardMiddle}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.billName} numberOfLines={1}>{bill.name}</Text>
              {isShared && (
                <View style={[styles.sharedBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.sharedBadgeText}>{t('mobileParity.bills.shared')}</Text>
                </View>
              )}
            </View>
            {isShared && bill.share_info && (
              <Text style={styles.sharedOwner} numberOfLines={1}>
                {t('mobileParity.bills.sharedBy', { name: bill.share_info.owner_name })}
              </Text>
            )}
            {isAllBucketsMode && bucketLabel && (
              <Text style={styles.bucketName} numberOfLines={1}>
                {bucketLabel}
              </Text>
            )}
            <View style={styles.dueRow}>
              <View style={[styles.dueDot, { backgroundColor: badgeColor }]} />
              <Text style={[styles.dueText, { color: badgeColor }]}>
                {formatDate(bill.next_due)} • {dueText}
              </Text>
            </View>
          </View>

          <View style={styles.cardRight}>
            <Text style={[styles.billAmount, { color: isDeposit ? colors.success : colors.text }]}>
              {isDeposit ? '+' : ''}{formatBillAmount(bill.amount, bill.avg_amount, t('mobileParity.bills.variable'))}
            </Text>
            {isShared && bill.share_info?.my_portion !== null && bill.share_info?.my_portion !== undefined && (
              <Text style={styles.myPortion}>
                {t('mobileParity.bills.myPortion', { amount: formatCurrency(bill.share_info.my_portion) })}
              </Text>
            )}
            {bill.account && !isShared && (
              <Text style={styles.billAccount} numberOfLines={1}>{bill.account}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterTabs = () => {
    const tabs: { key: FilterType; label: string }[] = [
      { key: 'all', label: t('mobileParity.bills.allCount', { count: counts.all }) },
      { key: 'expense', label: t('mobileParity.common.expenses') },
      { key: 'deposit', label: t('mobileParity.common.income') },
      { key: 'archived', label: t('mobileParity.bills.archivedCount', { count: counts.archived }) },
    ];

    return (
      <View style={styles.filterContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterButton,
              filter === tab.key ? styles.filterButtonActive : styles.filterButtonInactive,
            ]}
            onPress={() => setFilter(tab.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === tab.key ? styles.filterButtonTextActive : styles.filterButtonTextInactive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (runtime.loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (runtime.error && bills.length === 0 && archivedBills.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{runtime.error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>{t('mobileParity.common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => databases.length > 1 && setShowDbPicker(true)}
            style={styles.dbSelector}
            activeOpacity={databases.length > 1 ? 0.7 : 1}
          >
            <Text style={styles.headerTitle}>
              {currentDbInfo?.display_name || t('mobileCore.navigation.bills')}
            </Text>
            {databases.length > 1 && (
              <ChevronDown size={16} color={colors.textMuted} style={styles.dropdownArrow} />
            )}
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleAddBill}
              style={styles.iconButton}
            >
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              style={[styles.iconButton, showSearch && styles.iconButtonActive]}
            >
              <Search size={22} color={showSearch ? '#fff' : colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.headerSubtitle}>
          {t('mobileParity.bills.summary', { expenses: counts.expense, income: counts.deposit })}
        </Text>

        {showSearch && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel={t('mobileParity.bills.searchA11y')}
              placeholder={t('billList.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchButton}
              >
                <X size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {(filter !== 'all' || searchQuery.length > 0 || detailedFilterCount > 0) && (
          <View style={styles.activeFilterBanner}>
            <Text style={styles.activeFilterText}>
              {t('mobileParity.bills.showing', { count: filteredBills.length, filter: filter === 'expense'
                ? t('mobileParity.bills.filterExpenses')
                : filter === 'deposit'
                  ? t('mobileParity.bills.filterIncome')
                : filter === 'archived'
                    ? t('mobileParity.bills.filterArchived')
                    : t('mobileParity.bills.filterAll'), query: searchQuery.length > 0 ? t('mobileParity.bills.matching', { query: searchQuery }) : '' })}
              {detailedFilterCount > 0 ? ` · ${detailedFilterCount} advanced ${detailedFilterCount === 1 ? 'filter' : 'filters'}` : ''}
            </Text>
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={() => {
                setFilter('all');
                setSearchQuery('');
                setShowSearch(false);
                setListFilters(emptyBillListFilters);
              }}
            >
              <Text style={styles.clearAllButtonText}>{t('billList.clear')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderFilterTabs()}

        <View style={styles.listTools}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('mobileParity.bills.filtersA11y', { active: detailedFilterCount ? t('mobileParity.bills.activeFilters', { count: detailedFilterCount }) : '' })}
            style={[styles.toolButton, detailedFilterCount > 0 && styles.toolButtonActive]}
            onPress={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={17} color={detailedFilterCount > 0 ? colors.primary : colors.textMuted} />
            <Text style={[styles.toolButtonText, detailedFilterCount > 0 && styles.toolButtonTextActive]}>
              {t('mobileParity.bills.filters')}{detailedFilterCount ? ` (${detailedFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('mobileParity.bills.sortA11y', { sort: sortLabels[sort] })}
            style={styles.toolButton}
            onPress={() => setShowSort(true)}
          >
            <ArrowUpDown size={17} color={colors.textMuted} />
            <Text style={styles.toolButtonText}>{sortLabels[sort]}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlashList
        data={visibleBills}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBillCard}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={() => {
          if (visibleBills.length < filteredBills.length) {
            setPage((current) => Math.min(totalPages, current + 1));
          }
        }}
        onEndReachedThreshold={0.45}
        refreshControl={
          <RefreshControl
            refreshing={runtime.syncing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filter === 'archived' && !searchQuery
                ? t('mobileParity.bills.noArchived')
                : searchQuery || filter !== 'all' || detailedFilterCount > 0
                  ? t('mobileParity.bills.noMatches')
                  : t('mobileParity.bills.noBillsYet')}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || filter !== 'all' || detailedFilterCount > 0
                ? t('mobileParity.bills.adjustSearch')
                : t('mobileParity.bills.addFirst')}
            </Text>
          </View>
        }
        ListFooterComponent={visibleBills.length < filteredBills.length ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('mobileParity.bills.loadMoreA11y', { shown: visibleBills.length, total: filteredBills.length })}
            style={styles.loadMoreButton}
            onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            <Text style={styles.loadMoreText}>{t('mobileParity.bills.loadMore', { shown: visibleBills.length, total: filteredBills.length })}</Text>
          </TouchableOpacity>
        ) : null}
      />

      <Modal
        visible={showDbPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDbPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDbPicker(false)}
        >
          <View style={styles.dbPickerContainer}>
            <Text style={styles.dbPickerTitle}>{t('mobileParity.bills.selectGroup')}</Text>
            {/* All Buckets option */}
            <TouchableOpacity
              style={[
                styles.dbPickerItem,
                currentDatabase === '_all_' && styles.dbPickerItemActive,
              ]}
              onPress={() => handleSelectDatabase('_all_')}
            >
              <Text
                style={[
                  styles.dbPickerItemText,
                  currentDatabase === '_all_' && styles.dbPickerItemTextActive,
                ]}
              >
                {t('mobileCore.common.allBuckets')}
              </Text>
              {currentDatabase === '_all_' && (
                <Text style={styles.dbPickerCheck}>✓</Text>
              )}
            </TouchableOpacity>
            {/* Individual databases */}
            {databases.map((db) => (
              <TouchableOpacity
                key={db.id}
                style={[
                  styles.dbPickerItem,
                  db.name === currentDatabase && styles.dbPickerItemActive,
                ]}
                onPress={() => handleSelectDatabase(db.name)}
              >
                <Text
                  style={[
                    styles.dbPickerItemText,
                    db.name === currentDatabase && styles.dbPickerItemTextActive,
                  ]}
                >
                  {db.display_name}
                </Text>
                {db.name === currentDatabase && (
                  <Text style={styles.dbPickerCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={closeFilters}
      >
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity accessibilityRole="button" onPress={() => setListFilters(emptyBillListFilters)}>
              <Text style={[styles.sheetAction, { color: colors.danger }]}>{t('mobileParity.bills.reset')}</Text>
            </TouchableOpacity>
            <Text accessibilityRole="header" style={[styles.sheetTitle, { color: colors.text }]}>{t('mobileParity.bills.filterTitle')}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={closeFilters}>
              <Text style={[styles.sheetAction, styles.sheetDone, { color: colors.primary }]}>{t('mobileParity.common.done')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.sheetSectionTitle, { color: colors.text }]}>{t('mobileParity.bills.dueDate')}</Text>
            <View style={styles.dateFilterRow}>
              <View style={styles.dateField}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{t('mobileParity.bills.from')}</Text>
                <TextInput
                  accessibilityLabel={t('mobileParity.bills.dueFromA11y')}
                  autoCapitalize="none"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={listFilters.dueFrom}
                  onChangeText={(dueFrom) => setListFilters((current) => ({ ...current, dueFrom }))}
                  style={[styles.sheetInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{t('mobileParity.bills.to')}</Text>
                <TextInput
                  accessibilityLabel={t('mobileParity.bills.dueToA11y')}
                  autoCapitalize="none"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={listFilters.dueTo}
                  onChangeText={(dueTo) => setListFilters((current) => ({ ...current, dueTo }))}
                  style={[styles.sheetInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                />
              </View>
            </View>

            <Text style={[styles.sheetSectionTitle, { color: colors.text }]}>{t('billModal.accountLabel')}</Text>
            <View style={styles.choiceWrap}>
              {[null, ...filterOptions.accounts].map((account) => {
                const selected = listFilters.account === account;
                return (
                  <TouchableOpacity
                    key={account ?? '_all_accounts_'}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[styles.choiceChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? `${colors.primary}18` : colors.surface }]}
                    onPress={() => setListFilters((current) => ({ ...current, account }))}
                  >
                    <Text style={[styles.choiceText, { color: selected ? colors.primary : colors.text }]}>{account ?? t('mobileParity.bills.allAccounts')}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sheetSectionTitle, { color: colors.text }]}>{t('billModal.categoryLabel')}</Text>
            <View style={styles.choiceWrap}>
              {[null, ...filterOptions.categories].map((category) => {
                const selected = listFilters.category === category;
                return (
                  <TouchableOpacity
                    key={category ?? '_all_categories_'}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[styles.choiceChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? `${colors.primary}18` : colors.surface }]}
                    onPress={() => setListFilters((current) => ({ ...current, category }))}
                  >
                    <Text style={[styles.choiceText, { color: selected ? colors.primary : colors.text }]}>{category ?? t('mobileParity.bills.allCategories')}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showSort} animationType="fade" transparent onRequestClose={() => setShowSort(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSort(false)}>
          <View style={[styles.sortPicker, { backgroundColor: colors.surface }]}>
            <Text style={[styles.dbPickerTitle, { color: colors.text }]}>{t('mobileParity.bills.sortTitle')}</Text>
            {(Object.entries(sortLabels) as Array<[BillSort, string]>).map(([value, label]) => (
              <TouchableOpacity
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ selected: sort === value }}
                style={[styles.dbPickerItem, sort === value && styles.dbPickerItemActive]}
                onPress={() => { setSort(value); setShowSort(false); }}
              >
                <Text style={[styles.dbPickerItemText, sort === value && styles.dbPickerItemTextActive]}>{label}</Text>
                {sort === value ? <Text style={styles.dbPickerCheck}>✓</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: insets.top + 8,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconButtonActive: {
    backgroundColor: colors.primary,
  },
  searchContainer: {
    marginTop: 12,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  clearSearchButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterBanner: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeFilterText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  clearAllButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterButtonTextInactive: {
    color: colors.textMuted,
  },
  listTools: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  toolButton: {
    minHeight: 42,
    maxWidth: '100%',
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  toolButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  toolButtonText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  toolButtonTextActive: { color: colors.primary },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  billCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMiddle: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  billName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dueText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  billAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  billAccount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sharedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sharedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  sharedOwner: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  bucketName: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  myPortion: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 17,
    color: colors.textMuted,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
  },
  loadMoreButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loadMoreText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  dbSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownArrow: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dbPickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 320,
  },
  sortPicker: {
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 360,
  },
  dbPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  dbPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  dbPickerItemActive: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dbPickerItemText: {
    fontSize: 16,
    color: colors.text,
  },
  dbPickerItemTextActive: {
    fontWeight: '600',
    color: colors.primary,
  },
  dbPickerCheck: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
  sheet: { flex: 1 },
  sheetHeader: {
    minHeight: 58,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetAction: { minWidth: 64, fontSize: 16, fontWeight: '600' },
  sheetDone: { textAlign: 'right' },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  sheetContent: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, gap: 12 },
  sheetSectionTitle: { marginTop: 8, fontSize: 16, fontWeight: '700' },
  dateFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  dateField: { flex: 1, minWidth: 150, gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  sheetInput: { minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 13, fontSize: 16 },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  choiceText: { fontSize: 14, fontWeight: '600' },
});
