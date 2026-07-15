import React from 'react';

import { defaultAdaptivePlatform } from '../../design/tokens';
import { AdaptiveSurfaceProps, AdaptiveSurfaceShared } from './AdaptiveSurface.shared';

export default function AdaptiveSurface(props: Omit<AdaptiveSurfaceProps, 'platform'>) {
  return <AdaptiveSurfaceShared {...props} platform={defaultAdaptivePlatform()} />;
}
