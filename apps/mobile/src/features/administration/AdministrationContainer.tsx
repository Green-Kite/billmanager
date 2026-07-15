import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Alert } from 'react-native';

import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useMobileRuntime } from '../../context/MobileRuntimeContext';
import { formatDate } from '../../i18n/format';
import AdministrationScreen from './AdministrationScreen';
import type { AdminRole, AdminSection } from './models';
import { useTranslation } from 'react-i18next';

export default function AdministrationContainer() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const runtime = useMobileRuntime();
  const [section, setSection] = useState<AdminSection>('users');
  const allowed = Boolean(user?.role === 'admin' || user?.is_account_owner);
  const query = useQuery({
    queryKey: ['administration'],
    enabled: allowed && runtime.online,
    queryFn: async () => {
      const [users, invites, groups] = await Promise.all([
        api.getUsers(),
        api.getInvitations(),
        api.getDatabases(),
      ]);
      if (!users.success || !invites.success || !groups.success) {
        throw new Error(users.error ?? invites.error ?? groups.error ?? t('mobileParity.administration.unavailableData'));
      }
      return { users: users.data ?? [], invites: invites.data ?? [], groups: groups.data ?? [] };
    },
  });

  const data = query.data ?? { users: [], invites: [], groups: [] };
  const groupNames = new Map(data.groups.map((group) => [group.id, group.display_name]));
  const actorRole: AdminRole = user?.is_account_owner ? 'owner' : user?.role === 'admin' ? 'admin' : 'user';

  return (
    <AdministrationScreen
      model={{
        status: !allowed ? 'permission-denied' : query.isLoading ? 'loading' : query.error ? 'error' : 'ready',
        errorMessage: query.error instanceof Error ? query.error.message : undefined,
        permissionMessage: !allowed ? t('mobileParity.administration.permissionRequired') : undefined,
        offline: !runtime.online,
        lastUpdatedLabel: runtime.lastSyncedAt ? formatDate(runtime.lastSyncedAt) : undefined,
        selectedSection: section,
        currentUserRole: actorRole,
        canCreateUsers: allowed,
        canCreateInvites: allowed,
        canCreateGroups: allowed,
        users: data.users.map((item) => ({
          id: String(item.id),
          displayName: item.username,
          email: item.email ?? t('mobileParity.administration.noEmail'),
          role: item.id === user?.id && user?.is_account_owner ? 'owner' : item.role,
          status: 'active',
          groupNames: data.groups.filter((group) => group.users?.some((member) => member.user_id === item.id)).map((group) => group.display_name),
          permissions: {
            edit: actorRole === 'owner' || (actorRole === 'admin' && item.role === 'user'),
            delete: item.id !== user?.id && (actorRole === 'owner' || (actorRole === 'admin' && item.role === 'user')),
            changeAccess: actorRole !== 'user',
          },
        })),
        invites: data.invites.map((invite) => ({
          id: String(invite.id),
          email: invite.email,
          role: invite.role,
          groupNames: invite.database_ids.map((id) => groupNames.get(id) ?? t('mobileParity.administration.groupFallback', { id })),
          invitedByName: t('mobileParity.administration.administrator'),
          sentLabel: formatDate(invite.created_at),
          expiresLabel: t('mobileParity.administration.expires', { date: formatDate(invite.expires_at) }),
          canResend: true,
          canRevoke: true,
        })),
        groups: data.groups.map((group) => ({
          id: String(group.id),
          name: group.display_name,
          databaseName: group.name,
          memberCount: group.users?.length ?? 0,
          ownerCount: 1,
          permissions: { edit: allowed, delete: actorRole === 'owner', changeAccess: allowed },
        })),
        refreshing: query.isFetching,
      }}
      actions={{
        onChangeSection: setSection,
        onCreateUser: () => navigation.navigate('UserManagement'),
        onEditUser: () => navigation.navigate('UserManagement'),
        onChangeUserAccess: () => navigation.navigate('UserManagement'),
        onDeleteUser: (id) => Alert.alert(t('mobileParity.administration.deleteUserTitle'), t('mobileParity.administration.deleteUserBody'), [
          { text: t('mobileParity.common.cancel'), style: 'cancel' },
          { text: t('mobileParity.common.delete'), style: 'destructive', onPress: () => void api.deleteUser(Number(id)).then(() => query.refetch()) },
        ]),
        onCreateInvite: () => navigation.navigate('Invitations'),
        onResendInvite: (id) => void api.resendInvitation(Number(id)).then(() => query.refetch()),
        onRevokeInvite: (id) => Alert.alert(t('mobileParity.administration.revokeInviteTitle'), t('mobileParity.administration.revokeInviteBody'), [
          { text: t('mobileParity.common.cancel'), style: 'cancel' },
          { text: t('mobileParity.collaboration.revoke'), style: 'destructive', onPress: () => void api.deleteInvitation(Number(id)).then(() => query.refetch()) },
        ]),
        onCreateGroup: () => navigation.navigate('DatabaseManagement'),
        onEditGroup: () => navigation.navigate('DatabaseManagement'),
        onManageGroupAccess: () => navigation.navigate('DatabaseManagement'),
        onDeleteGroup: () => navigation.navigate('DatabaseManagement'),
        onRefresh: () => void query.refetch(),
        onRetry: () => void query.refetch(),
      }}
    />
  );
}
