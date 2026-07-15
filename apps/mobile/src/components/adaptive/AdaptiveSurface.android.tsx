import React from 'react';

import { AdaptiveSurfaceProps, AdaptiveSurfaceShared } from './AdaptiveSurface.shared';

export default function AdaptiveSurface(props: Omit<AdaptiveSurfaceProps, 'platform'>) {
  return <AdaptiveSurfaceShared {...props} platform="android" />;
}
