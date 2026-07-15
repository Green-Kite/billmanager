import React from 'react';
import { Platform } from 'react-native';

import { TelemetryScreenView } from './TelemetryScreen.shared';

export default function TelemetryScreen() {
  return <TelemetryScreenView platform={Platform.OS === 'ios' ? 'ios' : 'android'} />;
}
