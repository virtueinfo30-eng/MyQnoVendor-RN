import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import { CustomHeader } from '../../components/common/CustomHeader';
import { Loader, ToastService } from '../../components/common';

export const SettingsScreen = ({ navigation }) => {
  const [isLocationUpdateEnabled, setIsLocationUpdateEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const value = await AsyncStorage.getItem('@isUpdateLocationTimer');
      if (value !== null) {
        setIsLocationUpdateEnabled(value === 'true');
      }
    } catch (e) {
      console.error('Failed to load location preference', e);
      ToastService.show({ message: 'Settings save failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSwitch = async () => {
    const newValue = !isLocationUpdateEnabled;
    setIsLocationUpdateEnabled(newValue);
    try {
      await AsyncStorage.setItem('@isUpdateLocationTimer', String(newValue));
    } catch (e) {
      console.error('Failed to save location preference', e);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Settings"
        navigation={navigation}
        showBackIcon={false}
        showRightIcon={false}
      />
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Location</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>Enable Location Update</Text>
          {isLoading ? (
            <Loader visible={isLoading} />
          ) : (
            <Switch
              value={isLocationUpdateEnabled}
              onValueChange={toggleSwitch}
              trackColor={{
                false: theme.colors.borderLight,
                true: theme.colors.border,
              }}
              thumbColor={
                isLocationUpdateEnabled
                  ? theme.colors.primary
                  : theme.colors.borderLight
              }
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionHeader: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.black,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
  },
  label: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.text,
  },
});
