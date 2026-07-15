import React from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { ReleaseNotesScreenView } from './ReleaseNotesScreen.shared';

export default function ReleaseNotesScreen() {
  const navigation = useNavigation<any>();
  return (
    <ReleaseNotesScreenView
      platform={Platform.OS === 'ios' ? 'ios' : 'android'}
      onOpenServerProfiles={() => navigation.navigate('ServerProfiles')}
    />
  );
}
