import React from 'react';

import { defaultAdaptivePlatform } from '../../design/tokens';
import { FloatingAddActionShared } from './FloatingAddAction.shared';

export default function FloatingAddAction(props: { onPress: () => void; label?: string }) {
  return <FloatingAddActionShared {...props} platform={defaultAdaptivePlatform()} />;
}
