import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../theme';
import { CustomHeader } from '../../components/common/CustomHeader';
import { ToastService } from '../../components/common';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WorkingHoursScreen = ({ route, navigation }) => {
  const { initialTimeSlots, onSave, queueName, compMobile, location } =
    route.params || {};

  const [timeSlots, setTimeSlots] = useState(
    initialTimeSlots ||
      DAYS.map(day => ({
        day,
        active: false,
        startTime: '09:00',
        endTime: '18:00',
      })),
  );

  const [pickerConfig, setPickerConfig] = useState({
    show: false,
    dayIndex: -1,
    type: 'startTime', // 'startTime' or 'endTime'
    value: new Date(),
  });

  const handleToggleDay = index => {
    const updated = [...timeSlots];
    updated[index].active = !updated[index].active;
    setTimeSlots(updated);
  };

  const showPicker = (index, type) => {
    const timeStr = timeSlots[index][type];
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    setPickerConfig({
      show: true,
      dayIndex: index,
      type,
      value: date,
    });
  };

  const onPickerChange = (event, selectedDate) => {
    if (event.type === 'dismissed' || !selectedDate) {
      setPickerConfig({ ...pickerConfig, show: false });
      return;
    }

    const { dayIndex, type } = pickerConfig;
    const hours = selectedDate.getHours().toString().padStart(2, '0');
    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const updated = [...timeSlots];
    updated[dayIndex][type] = timeStr;

    // Validate that end time is after start time
    if (type === 'startTime') {
      const endTimeStr = updated[dayIndex].endTime;
      if (timeStr >= endTimeStr) {
        // Adjust end time to be 1 hour later if invalid
        let endH = (selectedDate.getHours() + 1) % 24;
        updated[dayIndex].endTime = `${endH
          .toString()
          .padStart(2, '0')}:${minutes}`;
      }
    } else {
      const startTimeStr = updated[dayIndex].startTime;
      if (timeStr <= startTimeStr) {
        ToastService.show({
          message: 'End time must be after start time',
          type: 'error',
        });
        setPickerConfig({ ...pickerConfig, show: false });
        return;
      }
    }

    setTimeSlots(updated);
    setPickerConfig({ ...pickerConfig, show: false });
  };

  const applyToAll = () => {
    const firstActive = timeSlots.find(d => d.active) || timeSlots[0];
    const updated = timeSlots.map(d => ({
      ...d,
      startTime: firstActive.startTime,
      endTime: firstActive.endTime,
    }));
    setTimeSlots(updated);
    ToastService.show({
      message: `${firstActive.day}'s timings applied to all days`,
      type: 'success',
    });
  };

  const handleSave = () => {
    onSave && onSave(timeSlots);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Add Working Hour Timings"
        showBackIcon={true}
        navigation={navigation}
      />

      {/* Sub Header (from params) */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>{queueName}</Text>
        <Text style={styles.subHeaderText}>{location}</Text>
        <Text style={styles.subHeaderText}>{compMobile}</Text>
      </View>

      <View style={styles.tableHeaderRow}>
        <Text style={styles.tableHeaderTextLeft}>Week Day</Text>
        <Text style={styles.tableHeaderTextCenter}>Start Time</Text>
        <Text style={styles.tableHeaderTextRight}>End Time</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {timeSlots.map((slot, index) => (
          <View key={slot.day} style={styles.dayRow}>
            {/* Week Day Column */}
            <View style={styles.dayCol}>
              <TouchableOpacity onPress={() => handleToggleDay(index)}>
                <MaterialIcons
                  name={slot.active ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={slot.active ? theme.colors.text : theme.colors.text}
                />
              </TouchableOpacity>
              <Text style={styles.dayName}>
                {slot.day === 'Thu'
                  ? 'Thursday'
                  : slot.day === 'Tue'
                  ? 'Tuesday'
                  : slot.day === 'Wed'
                  ? 'Wednesday'
                  : slot.day === 'Sat'
                  ? 'Saturday'
                  : slot.day === 'Sun'
                  ? 'Sunday'
                  : slot.day === 'Mon'
                  ? 'Monday'
                  : 'Friday'}
              </Text>
            </View>

            {/* Start Time Column */}
            <View style={styles.timeCol}>
              <TouchableOpacity
                style={styles.timePickerBtn}
                disabled={!slot.active}
                onPress={() => showPicker(index, 'startTime')}
              >
                <Text
                  style={[
                    styles.timeValue,
                    !slot.active && styles.disabledText,
                  ]}
                >
                  {slot.startTime}
                </Text>
                <MaterialIcons
                  name="arrow-drop-down"
                  size={20}
                  color={theme.colors.iconDark}
                />
              </TouchableOpacity>
            </View>

            {/* End Time Column */}
            <View style={styles.timeCol}>
              <TouchableOpacity
                style={styles.timePickerBtn}
                disabled={!slot.active}
                onPress={() => showPicker(index, 'endTime')}
              >
                <Text
                  style={[
                    styles.timeValue,
                    !slot.active && styles.disabledText,
                  ]}
                >
                  {slot.endTime}
                </Text>
                <MaterialIcons
                  name="arrow-drop-down"
                  size={20}
                  color={theme.colors.iconDark}
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.bottomSaveBtn} onPress={handleSave}>
          <Text style={styles.bottomSaveText}>Save</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {pickerConfig.show && (
        <DateTimePicker
          value={pickerConfig.value}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
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
  scrollContent: {
    padding: theme.spacing.m,
  },
  subHeader: {
    backgroundColor: theme.colors.backgroundLight,
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
  tableHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  tableHeaderTextLeft: {
    flex: 1.2,
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.iconGray,
  },
  tableHeaderTextCenter: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.iconGray,
    textAlign: 'center',
    marginRight: 10,
  },
  tableHeaderTextRight: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.iconGray,
    textAlign: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dayCol: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayName: {
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.iconDark,
  },
  timeCol: {
    flex: 1,
    marginHorizontal: 5,
  },
  timePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.white,
  },
  timeValue: {
    fontSize: 15,
    color: theme.colors.iconDark,
  },
  disabledText: {
    color: theme.colors.iconGray,
  },
  bottomSaveBtn: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 15,
    borderRadius: 4,
    alignItems: 'center',
  },
  bottomSaveText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
