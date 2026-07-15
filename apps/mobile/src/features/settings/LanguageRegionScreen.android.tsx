import React from 'react';
import { useNavigation } from '@react-navigation/native';

import { LanguageRegionScreenView } from './LanguageRegionScreen.shared';

export default function LanguageRegionScreen() {
  const navigation = useNavigation<any>();
  return (
    <LanguageRegionScreenView
      platform="android"
      onOpenServerProfiles={() => navigation.navigate('ServerProfiles')}
    />
  );
}
