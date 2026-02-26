import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../theme';
import { CustomHeader } from '../../components/common/CustomHeader';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WorkingHoursScreen = ({ route, navigation }) => {
  const {
    initialTimeSlots,
    onSave,
    locationName,
    queueName,
    compMobile,
    locMobile,
  } = route.params || {};

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
        Alert.alert('Invalid Time', 'End time must be after start time');
        setPickerConfig({ ...pickerConfig, show: false });
        return;
      }
    }

    setTimeSlots(updated);
    setPickerConfig({ ...pickerConfig, show: false });
  };

  const applyToAll = () => {
    // Find the first active day or just use Monday
    const firstActive = timeSlots.find(d => d.active) || timeSlots[0];

    Alert.alert(
      'Apply to All Days',
      `Copy ${firstActive.day}'s timings (${firstActive.startTime} - ${firstActive.endTime}) to all other enabled days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            const updated = timeSlots.map(d => ({
              ...d,
              startTime: firstActive.startTime,
              endTime: firstActive.endTime,
              // We don't necessarily want to force-active all days,
              // usually users want to match timings for days they work.
              // But if none are active, maybe active all?
              // Let's stick to just timings as per native "apply to all" logic often works.
            }));
            setTimeSlots(updated);
          },
        },
      ],
    );
  };

  const handleSave = () => {
    const activeCount = timeSlots.filter(d => d.active).length;
    if (activeCount === 0) {
      Alert.alert(
        'Warning',
        'No days are marked as active. The queue will be closed everyday. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Save',
            onPress: () => {
              onSave && onSave(timeSlots);
              navigation.goBack();
            },
          },
        ],
      );
      return;
    }

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
        <Text style={styles.subHeaderText}>{locationName}</Text>
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
                  color="#C4C4C4"
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
                  color="#C4C4C4"
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
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: theme.spacing.m,
  },
  subHeader: {
    backgroundColor: '#EAEAEA',
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
    color: '#A0A0A0',
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
