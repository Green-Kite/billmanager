import type { FeatureLoadStatus } from '../payments/models';

export type ShareSplitMode = 'equal' | 'percentage' | 'fixed';
export type ShareInviteDirection = 'incoming' | 'outgoing';

export interface ShareParticipant {
  userId: string;
  displayName: string;
  email: string;
  sharePercent?: number;
  fixedAmount?: number;
  owner?: boolean;
}

export interface SharedBillItem {
  shareId: string;
  billId: string;
  billName: string;
  ownerName: string;
  totalAmount: number;
  myShareAmount: number;
  splitMode: ShareSplitMode;
  participants: ShareParticipant[];
  dueLabel: string;
  cadenceLabel: string;
  canManage: boolean;
  pendingSync?: boolean;
}

export interface ShareInviteItem {
  id: string;
  direction: ShareInviteDirection;
  billName: string;
  invitedByName?: string;
  invitedEmail?: string;
  splitMode: ShareSplitMode;
  shareAmount?: number;
  sharePercent?: number;
  expiresLabel: string;
}

export interface CollaborationViewModel {
  status: FeatureLoadStatus;
  errorMessage?: string;
  permissionMessage?: string;
  offline: boolean;
  lastUpdatedLabel?: string;
  locale: string;
  currency: string;
  bucketLabel: string;
  sharedBills: SharedBillItem[];
  pendingInvites: ShareInviteItem[];
  refreshing?: boolean;
}

export interface CollaborationActions {
  onAddShare: () => void;
  onOpenSharedBill: (billId: string) => void;
  onEditSplit: (shareId: string) => void;
  onRevokeShare: (shareId: string) => void;
  onAcceptInvite: (inviteId: string) => void;
  onDeclineInvite: (inviteId: string) => void;
  onRevokeInvite: (inviteId: string) => void;
  onRefresh: () => void;
  onRetry: () => void;
}

export function describeSplit(
  mode: ShareSplitMode,
  participantCount: number,
  sharePercent?: number,
  fixedAmount?: number,
  locale = 'en-US',
  currency = 'USD',
): string {
  if (mode === 'equal') return `Split equally between ${participantCount} ${participantCount === 1 ? 'person' : 'people'}`;
  if (mode === 'percentage') return `${(sharePercent ?? 0).toFixed(1)} percent share`;
  return `${new Intl.NumberFormat(locale, { style: 'currency', currency }).format(fixedAmount ?? 0)} fixed share`;
}
