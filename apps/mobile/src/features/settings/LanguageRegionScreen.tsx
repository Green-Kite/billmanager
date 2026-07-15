import React from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { LanguageRegionScreenView } from './LanguageRegionScreen.shared';

export default function LanguageRegionScreen() {
  const navigation = useNavigation<any>();
  return (
    <LanguageRegionScreenView
      platform={Platform.OS === 'ios' ? 'ios' : 'android'}
      onOpenServerProfiles={() => navigation.navigate('ServerProfiles')}
    />
  );
}
