import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  ForcedPasswordChangeScreen,
  ForgotPasswordScreen,
  LoginFlowScreen,
  OAuthCallbackScreen,
  OAuthProvidersScreen,
  RegisterScreen,
  ResendVerificationScreen,
  ResetPasswordScreen,
  ShareInviteAcceptanceScreen,
  TeamInviteAcceptanceScreen,
  TwoFactorChallengeScreen,
  VerifyEmailScreen,
  type AuthFlowResult,
} from '../features/auth';
import { useAuth } from '../context/AuthContext';
import { useMobileRuntime } from '../context/MobileRuntimeContext';
import { useServerProfiles } from '../context/ServerProfileContext';
import ServerProfilesScreen from '../screens/ServerProfilesScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

function useAdoptSession() {
  const { t } = useTranslation();
  const { adoptAuthenticatedSession } = useAuth();
  return async (result: Extract<AuthFlowResult, { status: 'authenticated' }>) => {
    const adopted = await adoptAuthenticatedSession(result);
    if (!adopted.success) Alert.alert(t('mobileAuth.login.incompleteTitle'), adopted.error);
  };
}

function LoginRoute({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Login'>) {
  const adopt = useAdoptSession();
  const { activeProfile } = useServerProfiles();
  return (
    <LoginFlowScreen
      capabilities={activeProfile.capabilities}
      onAuthenticated={(result) => void adopt(result)}
      onTwoFactorRequired={(result) => navigation.navigate('TwoFactorChallenge', {
        sessionToken: result.sessionToken,
        methods: result.methods,
        scope: result.scope,
      })}
      onPasswordChangeRequired={(token, scope) => navigation.navigate('ForcedPasswordChange', { token, scope })}
      onEmailVerificationRequired={() => navigation.navigate('ResendVerification')}
      onForgotPassword={() => navigation.navigate('ForgotPassword')}
      onRegister={() => navigation.navigate('Register')}
      onOAuth={() => navigation.navigate('OAuthProviders', { flow: 'login' })}
      onChangeServer={() => navigation.navigate('ServerProfiles')}
    />
  );
}

function RegisterRoute({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Register'>) {
  const { activeProfile } = useServerProfiles();
  return (
    <RegisterScreen
      capabilities={activeProfile.capabilities}
      onComplete={(verificationRequired) => navigation.navigate(verificationRequired ? 'ResendVerification' : 'Login')}
      onSignIn={() => navigation.navigate('Login')}
    />
  );
}

function VerifyEmailRoute({ navigation, route }: NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>) {
  return <VerifyEmailScreen token={route.params?.token ?? ''} onComplete={() => navigation.navigate('Login')} onRequestNewLink={() => navigation.navigate('ResendVerification')} />;
}

function ResendRoute({ navigation, route }: NativeStackScreenProps<AuthStackParamList, 'ResendVerification'>) {
  return <ResendVerificationScreen initialEmail={route.params?.email} onBack={() => navigation.navigate('Login')} />;
}

function ForgotRoute({ navigation }: NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>) {
  return <ForgotPasswordScreen onBack={() => navigation.navigate('Login')} />;
}

function ResetRoute({ navigation, route }: NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>) {
  return <ResetPasswordScreen token={route.params?.token ?? ''} onComplete={() => navigation.navigate('Login')} onExpired={() => navigation.navigate('ForgotPassword')} />;
}

function ForcedPasswordRoute({ navigation, route }: NativeStackScreenProps<AuthStackParamList, 'ForcedPasswordChange'>) {
  return <ForcedPasswordChangeScreen token={route.params?.token ?? ''} authScope={route.params?.scope} onComplete={() => navigation.navigate('Login')} onExpired={() => navigation.navigate('Login')} />;
}

function TeamInviteRoute({ navigation, route }: NativeStackScreenProps<AuthStackParamList, 'AcceptInvite'>) {
  return <TeamInviteAcceptanceScreen token={route.params?.token ?? ''} onAccepted={() => navigation.navigate('Login')} onSignIn={() => navigation.navigate('Login')} />;
}

function ShareInviteRoute({ navigation, route }: NativeStackScreenProps<AuthStackParamList, 'AcceptShareInvite'>) {
  const { isAuthenticated } = useAuth();
  const runtime = useMobileRuntime();
  const { activeProfile } = useServerProfiles();
  const finishAcceptance = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    void runtime.syncNow().catch(() => null);
    navigation.getParent()?.navigate('Main' as never);
  };
  return (
    <ShareInviteAcceptanceScreen
      token={route.params?.token ?? ''}
      capabilities={activeProfile.capabilities}
      authenticated={isAuthenticated}
      onAccepted={finishAcceptance}
      onSignIn={() => navigation.navigate('Login')}
      onCreateAccount={() => navigation.navigate('Register')}
    />
  );
}

function OAuthProvidersRoute({ navigation, route }: NativeStackScreenProps<AuthStackParamList, 'OAuthProviders'>) {
  const adopt = useAdoptSession();
  const { activeProfile } = useServerProfiles();
  return (
    <OAuthProvidersScreen
      flow={route.params?.flow ?? 'login'}
      capabilities={activeProfile.capabilities}
      onAuthenticated={(result) => void adopt(result)}
      onTwoFactorRequired={(result) => navigation.navigate('TwoFactorChallenge', { sessionToken: result.sessionToken, methods: result.methods, scope: result.scope })}
      onLinked={() => navigation.goBack()}
      onCancel={() => navigation.goBack()}
    />
  );
}

function OAuthCallbackRoute({ navigation, route }: NativeStackScreenProps<AuthStackParamList, 'OAuthCallback'>) {
  const adopt = useAdoptSession();
  const params = route.params ?? { provider: '', code: '', state: '' };
  return (
    <OAuthCallbackScreen
      {...params}
      onAuthenticated={(result) => void adopt(result)}
      onTwoFactorRequired={(result) => navigation.navigate('TwoFactorChallenge', { sessionToken: result.sessionToken, methods: result.methods, scope: result.scope })}
      onLinked={() => navigation.goBack()}
      onRetry={() => navigation.navigate('OAuthProviders', { flow: params.flow ?? 'login' })}
    />
  );
}

function TwoFactorRoute({ navigation, route }: NativeStackScreenProps<AuthStackParamList, 'TwoFactorChallenge'>) {
  const adopt = useAdoptSession();
  const { activeProfile } = useServerProfiles();
  return (
    <TwoFactorChallengeScreen
      sessionToken={route.params?.sessionToken ?? ''}
      methods={route.params?.methods ?? []}
      authScope={route.params.scope}
      capabilities={activeProfile.capabilities}
      onAuthenticated={(result) => void adopt(result)}
      onCancel={() => navigation.navigate('Login')}
    />
  );
}

export default function AuthFlowNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginRoute} />
      <Stack.Screen
        name="ServerProfiles"
        component={ServerProfilesScreen}
        options={{ headerShown: true, title: t('mobileAuth.navigation.serverConnections') }}
      />
      <Stack.Screen name="Register" component={RegisterRoute} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailRoute} />
      <Stack.Screen name="ResendVerification" component={ResendRoute} />
      <Stack.Screen name="ForgotPassword" component={ForgotRoute} />
      <Stack.Screen name="ResetPassword" component={ResetRoute} />
      <Stack.Screen name="ForcedPasswordChange" component={ForcedPasswordRoute} />
      <Stack.Screen name="AcceptInvite" component={TeamInviteRoute} />
      <Stack.Screen name="AcceptShareInvite" component={ShareInviteRoute} />
      <Stack.Screen name="OAuthProviders" component={OAuthProvidersRoute} />
      <Stack.Screen name="OAuthCallback" component={OAuthCallbackRoute} />
      <Stack.Screen name="TwoFactorChallenge" component={TwoFactorRoute} />
    </Stack.Navigator>
  );
}
