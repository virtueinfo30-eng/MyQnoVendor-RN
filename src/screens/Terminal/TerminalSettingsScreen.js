import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Loader, ToastService } from '../../components/common';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { CustomHeader } from '../../components/common/CustomHeader';
import { theme } from '../../theme';
import apiClient from '../../api/client';
import { getTerminalDisplayIds } from '../../utils/session';

export const TerminalSettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [ids, setIds] = useState({ locationId: '', queueId: '' });

  const isLocation = ids.queueId === '-1' || !ids.queueId;

  const MIN_TOKENS = 1;
  const MAX_TOKENS = 4;
  const MIN_QUEUES = 1;
  const MAX_QUEUES = 6;
  const MIN_INTERVAL = 5;
  const MAX_INTERVAL = 20;

  const [noOfTokens, setNoOfTokens] = useState(4);
  const [noOfQueues, setNoOfQueues] = useState(2);
  const [intervalSec, setIntervalSec] = useState(10);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const activeIds = await getTerminalDisplayIds();
      setIds(activeIds);

      const locId = activeIds.locationId;
      const qId = activeIds.queueId;
      const isLoc = qId === '-1' || !qId;

      if (!locId && !qId) {
        ToastService.show({
          message:
            'Please select a location or queue as a display screen first.',
          type: 'warning',
        });
        setLoading(false);
        return;
      }

      const url = isLoc
        ? 'api/terminal/GetDisplayLocationSettings'
        : 'api/terminal/GetDisplayQueueSettings';

      const data = new FormData();
      if (isLoc) {
        data.append('location_id', locId);
      } else {
        data.append('queue_master_id', qId);
      }

      const response = await apiClient.post(url, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.type === 'SUCCESS') {
        const settings = response.data.listDisplySettingsInfo || [];
        settings.forEach(setting => {
          const val = parseInt(setting.val, 10);
          if (setting.para === 'NO_OF_TOKEN') setNoOfTokens(val);
          if (setting.para === 'NO_OF_QUEUE') setNoOfQueues(val);
          if (setting.para === 'DISPLAY_INTERVAL') setIntervalSec(val);
        });
      }
    } catch (e) {
      console.error('Error loading terminal settings', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!ids.locationId && !ids.queueId) {
      ToastService.show({
        message: 'No display screen configured.',
        type: 'info',
      });
      return;
    }

    setLoading(true);
    try {
      const url = isLocation
        ? 'api/terminal/SetDisplayLocationSettings'
        : 'api/terminal/SetDisplayQueueSettings';

      const data = new FormData();

      data.append('para[0]', 'NO_OF_TOKEN');
      data.append('value[0]', String(noOfTokens));

      if (isLocation) {
        data.append('location_id', ids.locationId);
        data.append('para[1]', 'NO_OF_QUEUE');
        data.append('value[1]', String(noOfQueues));
        data.append('para[2]', 'DISPLAY_INTERVAL');
        data.append('value[2]', String(intervalSec));
      } else {
        data.append('queue_master_id', ids.queueId);
        data.append('para[1]', 'NO_OF_QUEUE');
        data.append('value[1]', '1');
      }

      const response = await apiClient.post(url, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.type === 'SUCCESS') {
        ToastService.show({
          message: response.data.message || 'Settings saved successfully',
          type: 'success',
          duration: 4000,
        });
        navigation.replace('Terminal'); // Assuming Terminal defaults to display
      } else {
        ToastService.show({
          message: response.data?.message || 'Failed to save settings',
          type: 'error',
        });
      }
    } catch (e) {
      console.error('Error saving terminal settings', e);
      ToastService.show({
        message: 'An error occurred while saving terminal settings',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const OptionRow = ({ label, value, min, max, setValue }) => (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setValue(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <MaterialIcons
            name="remove"
            size={24}
            color={value <= min ? theme.colors.textLight : theme.colors.primary}
          />
        </TouchableOpacity>
        <Text style={styles.valueText}>{value}</Text>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setValue(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <MaterialIcons
            name="add"
            size={24}
            color={value >= max ? theme.colors.textLight : theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        title={isLocation ? 'Location Terminal Setup' : 'Queue Terminal Setup'}
        showBackIcon={true}
        navigation={navigation}
      />
      {loading ? (
        <View style={styles.loaderContainer}>
          <Loader visible={loading} />
        </View>
      ) : (
        <View style={styles.content}>
          <OptionRow
            label="No. of Tokens"
            value={noOfTokens}
            min={MIN_TOKENS}
            max={MAX_TOKENS}
            setValue={setNoOfTokens}
          />
          {isLocation && (
            <>
              <View style={styles.divider} />
              <OptionRow
                label="No. of Queues"
                value={noOfQueues}
                min={MIN_QUEUES}
                max={MAX_QUEUES}
                setValue={setNoOfQueues}
              />
              <View style={styles.divider} />
              <OptionRow
                label="Interval (Sec)"
                value={intervalSec}
                min={MIN_INTERVAL}
                max={MAX_INTERVAL}
                setValue={setIntervalSec}
              />
            </>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: theme.spacing.m,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.l,
    paddingHorizontal: theme.spacing.m,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    marginVertical: 4,
  },
  optionLabel: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.iconDark,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: theme.fontSize.large,
    textAlign: 'center',
    width: 40,
    color: theme.colors.black,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
  },
});
