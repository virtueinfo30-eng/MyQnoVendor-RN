import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { theme } from '../../theme';

const Loader = ({ visible = true }) => {
  return (
    <Modal transparent animationType="none" visible={visible}>
      <View style={styles.container}>
        <View style={styles.indicatorContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorContainer: {
    backgroundColor: theme.colors.white,
    padding: 20,
    borderRadius: 10,
  },
});

export default Loader;
