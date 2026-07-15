import React from 'react';
import { useNavigation } from '@react-navigation/native';

import { ReleaseNotesScreenView } from './ReleaseNotesScreen.shared';

export default function ReleaseNotesScreen() {
  const navigation = useNavigation<any>();
  return (
    <ReleaseNotesScreenView
      platform="android"
      onOpenServerProfiles={() => navigation.navigate('ServerProfiles')}
    />
  );
}
