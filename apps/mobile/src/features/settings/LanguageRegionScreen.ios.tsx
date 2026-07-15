import React from 'react';
import { useNavigation } from '@react-navigation/native';

import { LanguageRegionScreenView } from './LanguageRegionScreen.shared';

export default function LanguageRegionScreen() {
  const navigation = useNavigation<any>();
  return (
    <LanguageRegionScreenView
      platform="ios"
      onOpenServerProfiles={() => navigation.navigate('ServerProfiles')}
    />
  );
}
