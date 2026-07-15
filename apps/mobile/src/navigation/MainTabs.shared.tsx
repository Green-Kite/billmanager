import React from 'react';
import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  Home,
  Plus,
  ReceiptText,
  Settings2,
} from 'lucide-react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SymbolView, type SFSymbol } from 'expo-symbols';

import HomeScreen from '../features/home/HomeScreen';
import BillsHomeScreen from '../features/bills/BillsHomeScreen';
import CalendarHomeScreen from '../features/calendar/CalendarHomeScreen';
import InsightsHomeScreen from '../features/insights/InsightsHomeScreen';
import SettingsHomeScreen from '../features/settings/SettingsHomeScreen';
import AccountScreen from '../features/settings/AccountScreen';
import AppearanceScreen from '../features/settings/AppearanceScreen';
import LanguageRegionScreen from '../features/settings/LanguageRegionScreen';
import ReleaseNotesScreen from '../features/settings/ReleaseNotesScreen';
import TelemetryScreen from '../features/settings/TelemetryScreen';
import ReminderInboxScreen from '../features/reminders/ReminderInboxScreen';
import AddBillScreen from '../screens/AddBillScreen';
import BillDetailScreen from '../screens/BillDetailScreen';
import BillsScreen from '../screens/BillsScreen';
import DatabaseManagementScreen from '../screens/DatabaseManagementScreen';
import InvitationsScreen from '../screens/InvitationsScreen';
import { PaymentHistoryContainer } from '../features/payments';
import { AnalyticsContainer } from '../features/analytics';
import { AdministrationContainer } from '../features/administration';
import { BillingContainer } from '../features/billing';
import { CollaborationContainer } from '../features/collaboration';
import { SettlementsContainer } from '../features/settlements';
import SharedBillsScreen from '../screens/SharedBillsScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import ServerProfilesScreen from '../screens/ServerProfilesScreen';
import ConflictQueueScreen from '../screens/ConflictQueueScreen';
import AppSecurityScreen from '../screens/AppSecurityScreen';
import {
  DeleteAccountRoute,
  DisableTwoFactorRoute,
  EmailTwoFactorSetupRoute,
  LinkedAccountsRoute,
  OAuthLinkRoute,
  PasskeyManagementRoute,
  RecoveryCodesRoute,
  SecurityOverviewRoute,
  TwoFactorSettingsRoute,
} from './SecurityFlowScreens';
import { AdaptivePlatform } from '../design/tokens';
import { useAdaptiveLayout } from '../design/useAdaptiveLayout';
import { useAdaptiveTheme } from '../design/useAdaptiveTheme';
import { useMobileRuntime } from '../context/MobileRuntimeContext';
import {
  BillsStackParamList,
  CalendarStackParamList,
  HomeStackParamList,
  InsightsStackParamList,
  MainTabParamList,
  SettingsStackParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const BillsStack = createNativeStackNavigator<BillsStackParamList>();
const CalendarStack = createNativeStackNavigator<CalendarStackParamList>();
const InsightsStack = createNativeStackNavigator<InsightsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

type ToolbarNavigation = {
  navigate: (name: string, params?: unknown) => void;
};

function HeaderActions({
  navigation,
  platform,
  showAdd = false,
}: {
  navigation: ToolbarNavigation;
  platform: AdaptivePlatform;
  showAdd?: boolean;
}) {
  const theme = useAdaptiveTheme(platform);
  const { t } = useTranslation();
  const runtime = useMobileRuntime();
  const reminderCount = runtime.bills.filter((bill) => bill.reminder_enabled).length;
  return (
    <View style={styles.headerActions}>
      {showAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mobileCore.common.addBill')}
          hitSlop={8}
          onPress={() => navigation.navigate('AddBill')}
          style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.5 : 1 }]}
        >
          <SymbolView
            name="plus"
            size={22}
            weight="semibold"
            tintColor={theme.colors.primary}
            fallback={<Plus size={23} color={theme.colors.primary} strokeWidth={2.4} />}
          />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('mobileCore.common.reminders', { count: reminderCount })}
        hitSlop={8}
        onPress={() => navigation.navigate('ReminderInbox')}
        style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.5 : 1 }]}
      >
        <SymbolView
          name="bell"
          size={21}
          weight="medium"
          tintColor={theme.colors.primary}
          fallback={<Bell size={22} color={theme.colors.primary} strokeWidth={2.3} />}
        />
        {reminderCount > 0 ? <View style={[styles.headerBadge, { backgroundColor: theme.colors.accent }]} /> : null}
      </Pressable>
    </View>
  );
}

function createRootOptions(platform: AdaptivePlatform, colors: ReturnType<typeof useAdaptiveTheme>['colors']) {
  return {
    headerShown: platform === 'ios',
    headerLargeTitle: platform === 'ios',
    headerShadowVisible: false,
    headerTintColor: colors.primary,
    headerStyle: { backgroundColor: colors.background },
    headerLargeStyle: { backgroundColor: colors.background },
    headerTitleStyle: { color: colors.text, fontWeight: '600' as const },
    headerLargeTitleStyle: { color: colors.text, fontWeight: '700' as const },
    contentStyle: { backgroundColor: colors.background },
  };
}

function createSecondaryOptions(platform: AdaptivePlatform, colors: ReturnType<typeof useAdaptiveTheme>['colors']) {
  return {
    headerShown: true,
    headerLargeTitle: false,
    headerShadowVisible: false,
    headerTintColor: colors.primary,
    headerStyle: { backgroundColor: colors.background },
    headerTitleStyle: { color: colors.text, fontWeight: '600' as const },
    contentStyle: { backgroundColor: colors.background },
    presentation: platform === 'ios' ? ('card' as const) : ('card' as const),
  };
}

function HomeStackNavigator({ platform }: { platform: AdaptivePlatform }) {
  const theme = useAdaptiveTheme(platform);
  const { t } = useTranslation();
  return (
    <HomeStack.Navigator screenOptions={createSecondaryOptions(platform, theme.colors)}>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          ...createRootOptions(platform, theme.colors),
          title: platform === 'ios'
            ? t('mobileCore.home.overview')
            : 'BillManager',
          headerRight: platform === 'ios'
            ? () => <HeaderActions navigation={navigation} platform={platform} showAdd />
            : undefined,
        })}
      />
      <HomeStack.Screen name="ReminderInbox" component={ReminderInboxScreen} options={{ title: t('mobileCore.navigation.reminders') }} />
      <HomeStack.Screen
        name="AddBill"
        component={AddBillScreen}
        options={{ headerShown: false, presentation: platform === 'ios' ? 'formSheet' : 'modal' }}
      />
    </HomeStack.Navigator>
  );
}

function BillsStackNavigator({ platform }: { platform: AdaptivePlatform }) {
  const theme = useAdaptiveTheme(platform);
  const { t } = useTranslation();
  return (
    <BillsStack.Navigator screenOptions={createSecondaryOptions(platform, theme.colors)}>
      <BillsStack.Screen
        name="BillsHome"
        component={BillsHomeScreen}
        options={({ navigation }) => ({
          ...createRootOptions(platform, theme.colors),
          title: t('mobileCore.navigation.bills'),
          headerRight: platform === 'ios'
            ? () => <HeaderActions navigation={navigation} platform={platform} showAdd />
            : undefined,
        })}
      />
      <BillsStack.Screen name="BillsList" component={BillsScreen} options={{ headerShown: false }} />
      <BillsStack.Screen name="BillDetail" component={BillDetailScreen} options={{ headerShown: false }} />
      <BillsStack.Screen
        name="AddBill"
        component={AddBillScreen}
        options={{ headerShown: false, presentation: platform === 'ios' ? 'formSheet' : 'modal' }}
      />
      <BillsStack.Screen name="ReminderInbox" component={ReminderInboxScreen} options={{ title: t('mobileCore.navigation.reminders') }} />
    </BillsStack.Navigator>
  );
}

function CalendarStackNavigator({ platform }: { platform: AdaptivePlatform }) {
  const theme = useAdaptiveTheme(platform);
  const { t } = useTranslation();
  return (
    <CalendarStack.Navigator screenOptions={createSecondaryOptions(platform, theme.colors)}>
      <CalendarStack.Screen
        name="CalendarHome"
        component={CalendarHomeScreen}
        options={({ navigation }) => ({
          ...createRootOptions(platform, theme.colors),
          title: t('mobileCore.navigation.calendar'),
          headerRight: platform === 'ios'
            ? () => <HeaderActions navigation={navigation} platform={platform} showAdd />
            : undefined,
        })}
      />
      <CalendarStack.Screen
        name="AddBill"
        component={AddBillScreen}
        options={{ headerShown: false, presentation: platform === 'ios' ? 'formSheet' : 'modal' }}
      />
      <CalendarStack.Screen name="ReminderInbox" component={ReminderInboxScreen} options={{ title: t('mobileCore.navigation.reminders') }} />
    </CalendarStack.Navigator>
  );
}

function InsightsStackNavigator({ platform }: { platform: AdaptivePlatform }) {
  const theme = useAdaptiveTheme(platform);
  const { t } = useTranslation();
  return (
    <InsightsStack.Navigator screenOptions={createSecondaryOptions(platform, theme.colors)}>
      <InsightsStack.Screen
        name="InsightsHome"
        component={InsightsHomeScreen}
        options={({ navigation }) => ({
          ...createRootOptions(platform, theme.colors),
          title: t('mobileCore.navigation.insights'),
          headerRight: platform === 'ios'
            ? () => <HeaderActions navigation={navigation} platform={platform} />
            : undefined,
        })}
      />
      <InsightsStack.Screen name="Stats" component={AnalyticsContainer} options={{ headerShown: false }} />
      <InsightsStack.Screen name="Analytics" component={AnalyticsContainer} options={{ title: t('mobileCore.navigation.analytics') }} />
      <InsightsStack.Screen name="PaymentHistory" component={PaymentHistoryContainer} options={{ headerShown: false }} />
      <InsightsStack.Screen name="Collaboration" component={CollaborationContainer} options={{ headerShown: false }} />
      <InsightsStack.Screen name="Settlements" component={SettlementsContainer} options={{ headerShown: false }} />
      <InsightsStack.Screen name="SharedBills" component={SharedBillsScreen} options={{ headerShown: false }} />
      <InsightsStack.Screen name="ReminderInbox" component={ReminderInboxScreen} options={{ title: t('mobileCore.navigation.reminders') }} />
    </InsightsStack.Navigator>
  );
}

function SettingsStackNavigator({ platform }: { platform: AdaptivePlatform }) {
  const theme = useAdaptiveTheme(platform);
  const { t } = useTranslation();
  return (
    <SettingsStack.Navigator screenOptions={createSecondaryOptions(platform, theme.colors)}>
      <SettingsStack.Screen
        name="SettingsHome"
        component={SettingsHomeScreen}
        options={({ navigation }) => ({
          ...createRootOptions(platform, theme.colors),
          title: t('mobileSettings.title'),
          headerRight: platform === 'ios'
            ? () => <HeaderActions navigation={navigation} platform={platform} />
            : undefined,
        })}
      />
      <SettingsStack.Screen
        name="LanguageRegion"
        component={LanguageRegionScreen}
        options={{ title: t('mobileSettings.language.title') }}
      />
      <SettingsStack.Screen
        name="Appearance"
        component={AppearanceScreen}
        options={{ title: t('mobileSettings.appearance.title') }}
      />
      <SettingsStack.Screen
        name="Telemetry"
        component={TelemetryScreen}
        options={{ title: t('mobileSettings.telemetry.title') }}
      />
      <SettingsStack.Screen
        name="ReleaseNotes"
        component={ReleaseNotesScreen}
        options={{ title: t('mobileSettings.releaseNotes.title') }}
      />
      <SettingsStack.Screen name="LegacySettings" component={AccountScreen} options={{ title: t('mobileSettings.account.title') }} />
      <SettingsStack.Screen name="UserManagement" component={UserManagementScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen name="Invitations" component={InvitationsScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen name="DatabaseManagement" component={DatabaseManagementScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen name="Subscription" component={BillingContainer} options={{ headerShown: false }} />
      <SettingsStack.Screen name="ServerProfiles" component={ServerProfilesScreen} options={{ title: t('mobileParity.profiles.serversTitle') }} />
      <SettingsStack.Screen name="OfflineQueue" component={ConflictQueueScreen} options={{ title: t('mobileParity.conflicts.screenTitle') }} />
      <SettingsStack.Screen name="AppSecurity" component={AppSecurityScreen} options={{ title: t('mobileParity.deviceSecurity.screenTitle') }} />
      <SettingsStack.Screen name="SecurityOverview" component={SecurityOverviewRoute} options={{ title: t('mobileSecurity.overview.title') }} />
      <SettingsStack.Screen name="LinkedAccounts" component={LinkedAccountsRoute} options={{ title: t('mobileSecurity.linked.title') }} />
      <SettingsStack.Screen name="OAuthLink" component={OAuthLinkRoute} options={{ title: t('mobileAuth.oauth.linkTitle') }} />
      <SettingsStack.Screen name="TwoFactorSettings" component={TwoFactorSettingsRoute} options={{ title: t('mobileSecurity.twoFactorSettings.title') }} />
      <SettingsStack.Screen name="EmailTwoFactorSetup" component={EmailTwoFactorSetupRoute} options={{ title: t('mobileSecurity.emailSetup.title') }} />
      <SettingsStack.Screen name="PasskeyManagement" component={PasskeyManagementRoute} options={{ title: t('mobileSecurity.passkeys.title') }} />
      <SettingsStack.Screen name="RecoveryCodes" component={RecoveryCodesRoute} options={{ title: t('mobileSecurity.recovery.title') }} />
      <SettingsStack.Screen name="DisableTwoFactor" component={DisableTwoFactorRoute} options={{ title: t('mobileSecurity.disableTwoFactor.title') }} />
      <SettingsStack.Screen name="DeleteAccount" component={DeleteAccountRoute} options={{ title: t('mobileSecurity.deleteAccount.title') }} />
      <SettingsStack.Screen name="Administration" component={AdministrationContainer} options={{ headerShown: false }} />
      <SettingsStack.Screen name="Billing" component={BillingContainer} options={{ headerShown: false }} />
      <SettingsStack.Screen name="ReminderInbox" component={ReminderInboxScreen} options={{ title: t('mobileCore.navigation.reminders') }} />
    </SettingsStack.Navigator>
  );
}

type TabIconType = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

function TabIcon({
  platform,
  icon: Icon,
  color,
  focused,
  sfSymbol,
}: {
  platform: AdaptivePlatform;
  icon: TabIconType;
  color: string;
  focused: boolean;
  sfSymbol: SFSymbol;
}) {
  const theme = useAdaptiveTheme(platform);
  return (
    <View
      style={[
        styles.tabIcon,
        platform === 'android' && focused && {
          backgroundColor: theme.colors.primaryContainer,
        },
      ]}
    >
      {platform === 'ios' ? (
        <SymbolView
          name={sfSymbol}
          size={22}
          weight={focused ? 'semibold' : 'regular'}
          tintColor={color}
          fallback={<Icon size={23} color={color} strokeWidth={focused ? 2.6 : 2.1} />}
        />
      ) : (
        <Icon size={23} color={color} strokeWidth={focused ? 2.6 : 2.1} />
      )}
    </View>
  );
}

export function MainTabsShared({ platform }: { platform: AdaptivePlatform }) {
  const theme = useAdaptiveTheme(platform);
  const { t } = useTranslation();
  const layout = useAdaptiveLayout();
  const insets = useSafeAreaInsets();
  // Compact tablets retain the bottom bar so the content pane does not become
  // narrower than a phone. The rail appears only once there is room for a
  // useful two-pane layout beside it.
  const isRail = layout.isWideTablet;
  const isMaterialRail = isRail && platform === 'android';
  const railWidth = platform === 'ios' ? 280 : 104;
  const bottomHeight = 60 + Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarPosition: isRail ? 'left' : 'bottom',
        tabBarVariant: isMaterialRail ? 'material' : 'uikit',
        tabBarLabelPosition: isRail && platform === 'ios' ? 'beside-icon' : 'below-icon',
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarActiveBackgroundColor: isRail && platform === 'ios'
          ? theme.colors.primaryContainer
          : undefined,
        tabBarStyle: isRail
          ? {
            width: railWidth,
            minWidth: railWidth,
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: theme.colors.tabBar,
            borderRightColor: theme.colors.border,
            borderRightWidth: StyleSheet.hairlineWidth,
          }
          : {
            height: bottomHeight,
            paddingTop: platform === 'ios' ? 5 : 8,
            paddingBottom: Math.max(insets.bottom, 8),
            backgroundColor: theme.colors.tabBar,
            borderTopColor: theme.colors.border,
            borderTopWidth: StyleSheet.hairlineWidth,
          },
        tabBarItemStyle: isRail ? styles.railItem : undefined,
        tabBarLabelStyle: [
          styles.tabLabel,
          platform === 'ios' && styles.iosTabLabel,
          isRail && styles.railLabel,
        ],
      }}
    >
      <Tab.Screen
        name="HomeTab"
        options={{
          title: t('mobileCore.navigation.home'),
          tabBarAccessibilityLabel: t('mobileCore.navigation.home'),
          tabBarIcon: ({ color, focused }) => <TabIcon platform={platform} icon={Home} sfSymbol="house.fill" color={color} focused={focused} />,
        }}
      >
        {() => <HomeStackNavigator platform={platform} />}
      </Tab.Screen>
      <Tab.Screen
        name="BillsTab"
        options={{
          title: t('mobileCore.navigation.bills'),
          tabBarAccessibilityLabel: t('mobileCore.navigation.bills'),
          tabBarIcon: ({ color, focused }) => <TabIcon platform={platform} icon={ReceiptText} sfSymbol="list.bullet.rectangle.fill" color={color} focused={focused} />,
        }}
      >
        {() => <BillsStackNavigator platform={platform} />}
      </Tab.Screen>
      <Tab.Screen
        name="CalendarTab"
        options={{
          title: t('mobileCore.navigation.calendar'),
          tabBarAccessibilityLabel: t('mobileCore.navigation.calendar'),
          tabBarIcon: ({ color, focused }) => <TabIcon platform={platform} icon={CalendarDays} sfSymbol="calendar" color={color} focused={focused} />,
        }}
      >
        {() => <CalendarStackNavigator platform={platform} />}
      </Tab.Screen>
      <Tab.Screen
        name="InsightsTab"
        options={{
          title: t('mobileCore.navigation.insights'),
          tabBarAccessibilityLabel: t('mobileCore.navigation.insights'),
          tabBarIcon: ({ color, focused }) => <TabIcon platform={platform} icon={ChartNoAxesCombined} sfSymbol="chart.bar.xaxis" color={color} focused={focused} />,
        }}
      >
        {() => <InsightsStackNavigator platform={platform} />}
      </Tab.Screen>
      <Tab.Screen
        name="SettingsTab"
        options={{
          title: t('mobileSettings.tabs.settings'),
          tabBarAccessibilityLabel: t('mobileSettings.tabs.settings'),
          tabBarIcon: ({ color, focused }) => <TabIcon platform={platform} icon={Settings2} sfSymbol="gearshape.fill" color={color} focused={focused} />,
        }}
      >
        {() => <SettingsStackNavigator platform={platform} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  headerButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerBadge: { width: 7, height: 7, borderRadius: 4, position: 'absolute', top: 8, right: 7 },
  tabIcon: { minWidth: 48, height: 32, paddingHorizontal: 12, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  iosTabLabel: { fontSize: 11, fontWeight: '500' },
  railItem: { maxHeight: 78, marginVertical: 3 },
  railLabel: { fontSize: 12, marginTop: 2 },
});
