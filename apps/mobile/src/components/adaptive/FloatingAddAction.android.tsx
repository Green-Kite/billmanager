import React from 'react';
import { StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';

export default function FloatingAddAction({
  onPress,
  label = 'Add bill',
}: { onPress: () => void; label?: string }) {
  return (
    <FAB
      icon="plus"
      accessibilityLabel={label}
      mode="elevated"
      onPress={onPress}
      size="medium"
      style={styles.fab}
    />
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 20,
  },
});
