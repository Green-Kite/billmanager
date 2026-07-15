import type { FeatureLoadStatus } from '../payments/models';

export type AdminSection = 'users' | 'invites' | 'groups';
export type AdminRole = 'owner' | 'admin' | 'user';
export type AdminUserStatus = 'active' | 'suspended' | 'pending-password-change';

export interface AdminItemPermissions {
  edit: boolean;
  delete: boolean;
  changeAccess: boolean;
}

export interface AdminUserItem {
  id: string;
  displayName: string;
  email: string;
  role: AdminRole;
  status: AdminUserStatus;
  groupNames: string[];
  lastLoginLabel?: string;
  permissions: AdminItemPermissions;
}

export interface AdminInviteItem {
  id: string;
  email: string;
  role: AdminRole;
  groupNames: string[];
  invitedByName: string;
  sentLabel: string;
  expiresLabel: string;
  canResend: boolean;
  canRevoke: boolean;
}

export interface AdminGroupItem {
  id: string;
  name: string;
  databaseName?: string;
  memberCount: number;
  ownerCount: number;
  permissions: AdminItemPermissions;
}

export interface AdministrationViewModel {
  status: FeatureLoadStatus;
  errorMessage?: string;
  permissionMessage?: string;
  offline: boolean;
  lastUpdatedLabel?: string;
  selectedSection: AdminSection;
  currentUserRole: AdminRole;
  canCreateUsers: boolean;
  canCreateInvites: boolean;
  canCreateGroups: boolean;
  users: AdminUserItem[];
  invites: AdminInviteItem[];
  groups: AdminGroupItem[];
  refreshing?: boolean;
}

export interface AdministrationActions {
  onChangeSection: (section: AdminSection) => void;
  onCreateUser: () => void;
  onEditUser: (userId: string) => void;
  onChangeUserAccess: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onCreateInvite: () => void;
  onResendInvite: (inviteId: string) => void;
  onRevokeInvite: (inviteId: string) => void;
  onCreateGroup: () => void;
  onEditGroup: (groupId: string) => void;
  onManageGroupAccess: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onRefresh: () => void;
  onRetry: () => void;
}

export function canManageRole(actor: AdminRole, target: AdminRole): boolean {
  if (actor === 'owner') return true;
  if (actor === 'admin') return target === 'user';
  return false;
}

export function adminStatusLabel(status: AdminUserStatus): string {
  const labels: Record<AdminUserStatus, string> = {
    active: 'Active',
    suspended: 'Suspended',
    'pending-password-change': 'Password change required',
  };
  return labels[status];
}
