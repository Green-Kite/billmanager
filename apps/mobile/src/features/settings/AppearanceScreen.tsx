import React from 'react';
import { Platform } from 'react-native';

import { AppearanceScreenView } from './AppearanceScreen.shared';

export default function AppearanceScreen() {
  return <AppearanceScreenView platform={Platform.OS === 'ios' ? 'ios' : 'android'} />;
}
