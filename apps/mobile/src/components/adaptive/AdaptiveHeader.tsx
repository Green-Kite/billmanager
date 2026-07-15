import React from 'react';

import { defaultAdaptivePlatform } from '../../design/tokens';
import { AdaptiveHeaderProps, AdaptiveHeaderShared } from './AdaptiveHeader.shared';

export default function AdaptiveHeader(props: Omit<AdaptiveHeaderProps, 'platform'>) {
  return <AdaptiveHeaderShared {...props} platform={defaultAdaptivePlatform()} />;
}
