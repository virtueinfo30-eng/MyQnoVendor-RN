import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../theme';
import { CustomHeader } from '../../components/common';
import { saveHoliday, fetchHolidayQueueList } from '../../api/company';

export const AddUpdateCompHolidayScreen = ({ route, navigation }) => {
  const {
    isUpdate,
    holidayData,
    queueId,
    locationId,
    companyId,
    selectedCompName,
    selectedQueueName,
    location,
  } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: holidayData?.holiday_name || '',
    date: holidayData?.holiday_date
      ? new Date(holidayData.holiday_date)
      : new Date(),
    isPartial: holidayData?.working_day_status === 'P',
    startTime: holidayData?.start_time || '09:00',
    endTime: holidayData?.end_time || '18:00',
    applyAll: false,
  });

  const [datePickerShow, setDatePickerShow] = useState(false);
  const [timePicker, setTimePicker] = useState({
    show: false,
    type: 'startTime',
  });
  const [queues, setQueues] = useState([]);
  const [queuesLoading, setQueuesLoading] = useState(false);

  useEffect(() => {
    const loadQueues = async () => {
      setQueuesLoading(true);
      try {
        const resp = await fetchHolidayQueueList(
          companyId,
          locationId,
          queueId,
        );
        if (resp && resp.found && resp.queues) {
          // Map native format to our state
          const mapped = resp.queues
            .filter(q => q.queue_master_id !== queueId)
            .map(q => ({
              id: q.queue_master_id,
              name: q.queue_name_group,
              selected:
                holidayData?.other_queue_details?.some(
                  oq => oq.queue_master_id === q.queue_master_id,
                ) || false,
            }));
          setQueues(mapped);
        }
      } catch (e) {
        console.error('Fetch Holiday Queues Error:', e);
      } finally {
        setQueuesLoading(false);
      }
    };

    loadQueues();
  }, [companyId, locationId, queueId, holidayData]);

  const handleDateChange = (event, selectedDate) => {
    setDatePickerShow(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const handleTimeChange = (event, selectedDate) => {
    setTimePicker({ ...timePicker, show: false });
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      const newFormData = { ...formData, [timePicker.type]: timeStr };

      // Basic validation
      if (timePicker.type === 'startTime' && timeStr >= formData.endTime) {
        let endH = (selectedDate.getHours() + 1) % 24;
        newFormData.endTime = `${endH.toString().padStart(2, '0')}:${minutes}`;
      }

      setFormData(newFormData);
    }
  };

  const toggleQueue = id => {
    const newQueues = queues.map(q =>
      q.id === id ? { ...q, selected: !q.selected } : q,
    );
    setQueues(newQueues);
    const allSelected =
      newQueues.length > 0 && newQueues.every(q => q.selected);
    if (allSelected !== formData.applyAll) {
      setFormData({ ...formData, applyAll: allSelected });
    }
  };

  const handleApplyAllChange = val => {
    setFormData({ ...formData, applyAll: val });
    setQueues(queues.map(q => ({ ...q, selected: val })));
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please enter holiday name');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('queue_master_id', queueId);
      data.append('txthname', formData.name);

      const yyyy = formData.date.getFullYear();
      const mm = (formData.date.getMonth() + 1).toString().padStart(2, '0');
      const dd = formData.date.getDate().toString().padStart(2, '0');
      data.append('txtolidat', `${yyyy}-${mm}-${dd}`);

      data.append('chkPartialMain', formData.isPartial ? 'true' : 'false');
      data.append('holstTime', formData.isPartial ? formData.startTime : '');
      data.append('holedTime', formData.isPartial ? formData.endTime : '');

      if (isUpdate) {
        data.append('queue_holiday_id', holidayData.queue_holiday_id);
      }

      const selectedIds = queues.filter(q => q.selected).map(q => q.id);
      data.append('other_queue_id_array', selectedIds.join(','));

      const resp = await saveHoliday(isUpdate, data);
      if (resp && resp.found) {
        Alert.alert('Success', resp.message || 'Holiday saved successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', resp?.message || 'Failed to save holiday');
      }
    } catch (e) {
      console.error('Save Holiday Error:', e);
      Alert.alert('Error', 'An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title={isUpdate ? 'Update Holiday' : 'Add New Holidays'}
        showBackIcon={true}
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.subHeader}>
          <Text style={styles.subHeaderText}>{selectedCompName}</Text>
          <Text style={styles.subHeaderText}>{location}</Text>
          <Text style={styles.subHeaderText}>{selectedQueueName}</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Holiday Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
            placeholder="Enter Holiday Name"
            placeholderTextColor={theme.colors.textLight}
          />

          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setDatePickerShow(true)}
          >
            <Text style={styles.pickerText}>
              {formData.date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>

          <View style={styles.timeSettingsHeader}>
            <Text style={styles.timeSettingsLabelHeading}>Partial On</Text>
            <Text
              style={[
                styles.timeSettingsLabelHeading,
                { flex: 1, textAlign: 'center' },
              ]}
            >
              Start Time
            </Text>
            <Text
              style={[
                styles.timeSettingsLabelHeading,
                { flex: 1, textAlign: 'right', paddingRight: 10 },
              ]}
            >
              End Time
            </Text>
          </View>

          <View style={styles.timeSettingsRow}>
            <View style={styles.switchContainer}>
              <Switch
                value={formData.isPartial}
                onValueChange={val =>
                  setFormData({ ...formData, isPartial: val })
                }
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.border,
                }}
                thumbColor={
                  formData.isPartial
                    ? theme.colors.primary
                    : theme.colors.lightGray
                }
              />
            </View>

            {formData.isPartial ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.timePickerBox,
                    !formData.isPartial && styles.disabledPicker,
                  ]}
                  disabled={!formData.isPartial}
                  onPress={() =>
                    setTimePicker({ show: true, type: 'startTime' })
                  }
                >
                  <Text style={styles.timeValueText}>{formData.startTime}</Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={20}
                    color={theme.colors.textLight}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.timePickerBox,
                    !formData.isPartial && styles.disabledPicker,
                  ]}
                  disabled={!formData.isPartial}
                  onPress={() => setTimePicker({ show: true, type: 'endTime' })}
                >
                  <Text style={styles.timeValueText}>{formData.endTime}</Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={20}
                    color={theme.colors.textLight}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={styles.fullDayText}>Full Day Holiday</Text>
              </View>
            )}
          </View>

          <Text style={styles.checkQueueText}>Check queue to add holiday</Text>

          {queues.length > 0 && (
            <View style={styles.queuesSection}>
              <View style={styles.applyAllContainer}>
                <Text style={styles.applyAllText}>Apply to all</Text>
                <View style={styles.applyAllSwitchContainer}>
                  {queuesLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                    />
                  ) : (
                    <Switch
                      value={formData.applyAll}
                      onValueChange={handleApplyAllChange}
                      trackColor={{
                        false: theme.colors.border,
                        true: theme.colors.border,
                      }}
                      thumbColor={
                        formData.applyAll
                          ? theme.colors.primary
                          : theme.colors.lightGray
                      }
                    />
                  )}
                </View>
              </View>

              <View style={styles.queuesList}>
                {queues.map(q => (
                  <TouchableOpacity
                    key={q.id}
                    style={styles.queueItem}
                    onPress={() => toggleQueue(q.id)}
                  >
                    <MaterialIcons
                      name={
                        q.selected ? 'check-box' : 'check-box-outline-blank'
                      }
                      size={24}
                      color={
                        q.selected
                          ? theme.colors.primary
                          : theme.colors.textLight
                      }
                    />
                    <Text style={styles.queueName}>{q.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.addBtnText}>
                  {isUpdate ? 'Update' : 'Add'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {datePickerShow && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {timePicker.show && (
        <DateTimePicker
          value={(() => {
            const [h, m] = formData[timePicker.type].split(':').map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
          })()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  saveHeaderBtn: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollContent: {
    padding: 0,
  },
  subHeader: {
    backgroundColor: theme.colors.lightGray,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  subHeaderText: {
    fontSize: 14,
    color: theme.colors.iconDark,
    textAlign: 'center',
    marginBottom: 2,
  },
  formContainer: {
    padding: 20,
    backgroundColor: theme.colors.white,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.iconGray,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 4,
    padding: 12,
    fontSize: 15,
    color: theme.colors.iconDark,
    backgroundColor: theme.colors.white,
    marginBottom: 20,
  },
  pickerBtn: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 4,
    padding: 12,
    backgroundColor: theme.colors.white,
    marginBottom: 20,
  },
  pickerText: {
    fontSize: 15,
    color: theme.colors.iconDark,
  },
  timeSettingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeSettingsLabelHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.iconGray,
  },
  timeSettingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  switchContainer: {
    width: 60,
  },
  timePickerBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.white,
    marginLeft: 15,
  },
  disabledPicker: {
    opacity: 0.5,
  },
  timeValueText: {
    fontSize: 15,
    color: theme.colors.iconDark,
  },
  fullDayText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: 'bold',
  },
  checkQueueText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
    marginBottom: 15,
  },
  queuesSection: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  applyAllContainer: {
    width: 100,
  },
  applyAllText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  applyAllSwitchContainer: {
    alignItems: 'flex-start',
  },
  queuesList: {
    flex: 1,
    paddingLeft: 20,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  queueName: {
    marginLeft: 10,
    fontSize: 14,
    color: theme.colors.iconDark,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  addBtn: {
    flex: 1,
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 2,
  },
  addBtnText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDark,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 10,
    borderRadius: 2,
  },
  cancelBtnText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
});
