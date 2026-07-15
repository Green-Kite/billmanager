import React from 'react';

import { defaultAdaptivePlatform } from '../../design/tokens';
import { HomeScreenView } from './HomeScreen.shared';
import IOSHomeScreen from './HomeScreen.ios';

export default function HomeScreen() {
  return defaultAdaptivePlatform() === 'ios'
    ? <IOSHomeScreen />
    : <HomeScreenView platform="android" />;
}
