import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme';
import { CustomHeader, Loader, ToastService } from '../../components/common';
import { fetchHolidays, deleteHoliday } from '../../api/company';

export const CompHolidaysListScreen = ({ route, navigation }) => {
  const {
    queueId,
    locationId,
    companyId,
    selectedCompName,
    selectedQueueName,
    location,
  } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState([]);

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetchHolidays(queueId);
      console.log('Holidays Response:', resp);
      if (resp && resp.found && resp.holidays) {
        setHolidays(resp.holidays);
      } else {
        setHolidays([]);
      }
    } catch (e) {
      console.error('Fetch Holidays Error:', e);
      ToastService.show({ message: 'Failed to load holidays', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [queueId]);

  useFocusEffect(
    useCallback(() => {
      loadHolidays();
    }, [loadHolidays]),
  );

  const handleDelete = async holiday => {
    setLoading(true);
    try {
      const resp = await deleteHoliday(queueId, holiday.queue_holiday_id);
      if (resp && resp.found) {
        ToastService.show({
          message: resp.message || 'Holiday deleted successfully',
          type: 'success',
        });
        loadHolidays();
      } else {
        ToastService.show({
          message: resp?.message || 'Failed to delete holiday',
          type: 'error',
        });
      }
    } catch (e) {
      console.error('Delete Holiday Error:', e);
      ToastService.show({
        message: 'An error occurred while deleting',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    try {
      const d = new Date(dateString);
      return isNaN(d)
        ? dateString
        : d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
    } catch (e) {
      return dateString;
    }
  };

  const renderHolidayItem = ({ item }) => (
    <TouchableOpacity
      style={styles.holidayItem}
      onPress={() =>
        navigation.navigate('AddUpdateCompHoliday', {
          isUpdate: true,
          holidayData: item,
          queueId,
          locationId,
          companyId,
          selectedCompName,
          selectedQueueName,
          location,
        })
      }
    >
      <View style={styles.holidayInfo}>
        <Text style={styles.holidayName}>{item.holiday_name}</Text>
        <Text style={styles.holidayDate}>{formatDate(item.holiday_date)}</Text>
      </View>
      <View style={styles.rightInfo}>
        <Text style={styles.workingStatus}>
          {item.working_day_status === 'F'
            ? 'Full Day'
            : `${item.start_time.substring(0, 5)} to ${item.end_time.substring(
                0,
                5,
              )}`}
        </Text>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.deleteBtn}
        >
          <MaterialIcons name="delete" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Holidays"
        showBackIcon={true}
        navigation={navigation}
        rightIconName="add"
        rightIconPress={() =>
          navigation.navigate('AddUpdateCompHoliday', {
            isUpdate: false,
            queueId,
            locationId,
            companyId,
            selectedCompName,
            selectedQueueName,
            location,
          })
        }
      />

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>{selectedCompName}</Text>
        <Text style={styles.subHeaderText}>{location}</Text>
        <Text style={styles.subHeaderText}>{selectedQueueName}</Text>
      </View>

      <Loader visible={loading && holidays.length === 0} />
      {!loading && (
        <FlatList
          data={holidays}
          keyExtractor={item => item.queue_holiday_id.toString()}
          renderItem={renderHolidayItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="event-busy"
                size={64}
                color={theme.colors.borderLight}
              />
              <Text style={styles.emptyText}>No holidays found</Text>
              <TouchableOpacity
                style={styles.addFirstBtn}
                onPress={() =>
                  navigation.navigate('AddUpdateCompHoliday', {
                    isUpdate: false,
                    queueId,
                    locationId,
                    companyId,
                    selectedCompName,
                    selectedQueueName,
                    location,
                  })
                }
              >
                <Text style={styles.addFirstText}>ADD HOLIDAY</Text>
              </TouchableOpacity>
            </View>
          }
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
  listContent: {
    padding: theme.spacing.m,
  },
  holidayItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  holidayInfo: {
    flex: 1,
  },
  holidayName: {
    fontSize: 16,
    color: theme.colors.iconDark,
    marginBottom: 4,
  },
  holidayDate: {
    fontSize: 14,
    color: theme.colors.iconDark,
  },
  rightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workingStatus: {
    fontSize: 14,
    color: theme.colors.iconDark,
    marginRight: 15,
  },
  deleteBtn: {
    padding: 8,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  addFirstBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.m,
  },
  addFirstText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
});
