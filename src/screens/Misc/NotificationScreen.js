import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { CustomHeader } from '../../components/common';

export const NotificationScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <CustomHeader
        title="Notifications"
        navigation={navigation}
        showBackIcon={true}
      />
      <View style={styles.content}>
        <Text style={styles.text}>No recent notifications.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.medium,
  },
});
