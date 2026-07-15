import React from 'react';
import { defaultAdaptivePlatform } from '../design/tokens';
import { MainTabsShared } from './MainTabs.shared';

export default function MainTabs() {
  return <MainTabsShared platform={defaultAdaptivePlatform()} />;
}
