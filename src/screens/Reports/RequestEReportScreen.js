import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CustomHeader, Loader, ToastService } from '../../components/common';
import { getLocQueCombo, sendReportEmail } from '../../api/reports';
import { theme } from '../../theme';

export const RequestEReportScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [queues, setQueues] = useState([]);

  const [form, setForm] = useState({
    fromDate: new Date(),
    toDate: new Date(),
    locationId: '-1',
    locationName: 'Select Location',
    queueId: '-1',
    queueName: 'Select Queue',
  });

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'location' or 'queue'

  useEffect(() => {
    fetchComboData();
  }, []);

  const fetchComboData = async () => {
    setLoading(true);
    try {
      const response = await getLocQueCombo();
      console.log('Fetch Combo Response:', response);
      if (response && response.found && response.data) {
        setLocations(response.data.location_list || []);
      }
    } catch (error) {
      console.error('Fetch Combo Error:', error);
      ToastService.show({
        message: 'Failed to load location data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = loc => {
    setForm(prev => ({
      ...prev,
      locationId: loc.company_locations_id,
      locationName: loc.location_name,
      queueId: '-1',
      queueName: 'All',
    }));
    setQueues(loc.queue_list || []);
    setModalVisible(false);
  };

  const handleQueueSelect = que => {
    setForm(prev => ({
      ...prev,
      queueId: que.queue_master_id,
      queueName: que.queue_name,
    }));
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formatDate = date => {
        return date.toISOString().split('T')[0];
      };

      const response = await sendReportEmail({
        fromdate: formatDate(form.fromDate),
        todate: formatDate(form.toDate),
        txtcomploca: form.locationId,
        txtqlist: form.queueId,
      });

      if (response.found) {
        ToastService.show({
          message: response.message || 'Report request sent to your email',
          type: 'success',
          duration: 4000,
        });
        navigation.goBack();
      } else {
        ToastService.show({
          message: response.message || 'Failed to request report',
          type: 'info',
        });
      }
    } catch (error) {
      console.error('Submit Request Error:', error);
      ToastService.show({
        message: 'Failed to send report request',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderModalItem = ({ item }) => {
    const isLocation = modalType === 'location';
    const name = isLocation ? item.location_name : item.queue_name;

    return (
      <TouchableOpacity
        style={styles.modalItem}
        onPress={() =>
          isLocation ? handleLocationSelect(item) : handleQueueSelect(item)
        }
      >
        <Text style={styles.modalItemText}>{name}</Text>
      </TouchableOpacity>
    );
  };

  const formatDateDisplay = date => {
    const options = { month: 'short', day: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Paid Token Report"
        navigation={navigation}
        showBackIcon={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formSection}>
          <Text style={styles.label}>Select Company Location:</Text>
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={() => {
              setModalType('location');
              setModalVisible(true);
            }}
          >
            <Text
              style={[
                styles.pickerText,
                form.locationId === '-1' && { color: theme.colors.textLight },
              ]}
            >
              {form.locationName}
            </Text>
            <MaterialIcons
              name="arrow-drop-down"
              size={32}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          <Text style={styles.label}>Select Queue:</Text>
          <TouchableOpacity
            style={[
              styles.pickerContainer,
              form.locationId === '-1' && styles.disabledPicker,
            ]}
            onPress={() => {
              if (form.locationId === '-1') return;
              setModalType('queue');
              setModalVisible(true);
            }}
            disabled={form.locationId === '-1'}
          >
            <Text
              style={[
                styles.pickerText,
                form.queueId === '-1' && { color: theme.colors.textLight },
              ]}
            >
              {form.queueName}
            </Text>
            <MaterialIcons
              name="arrow-drop-down"
              size={32}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          <View style={styles.dateRow}>
            <View style={styles.dateColumn}>
              <Text style={styles.label}>From Date</Text>
              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => setShowFromPicker(true)}
              >
                <FontAwesome
                  name="calendar-o"
                  size={20}
                  color={theme.colors.textLight}
                  style={styles.calendarIcon}
                />
                <Text style={styles.dateText}>
                  {formatDateDisplay(form.fromDate)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ width: 15 }} />
            <View style={styles.dateColumn}>
              <Text style={styles.label}>To Date</Text>
              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => setShowToPicker(true)}
              >
                <FontAwesome
                  name="calendar-o"
                  size={20}
                  color={theme.colors.textLight}
                  style={styles.calendarIcon}
                />
                <Text style={styles.dateText}>
                  {formatDateDisplay(form.toDate)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>Request</Text>
          </TouchableOpacity>
          <Loader visible={loading} message="Sending request…" />
        </View>
      </ScrollView>

      {showFromPicker && (
        <DateTimePicker
          value={form.fromDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowFromPicker(false);
            if (date) setForm({ ...form, fromDate: date });
          }}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={form.toDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowToPicker(false);
            if (date) setForm({ ...form, toDate: date });
          }}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {modalType === 'location' ? 'Location' : 'Queue'}
            </Text>
            <FlatList
              data={modalType === 'location' ? locations : queues}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderModalItem}
              ListHeaderComponent={
                modalType === 'location' ? (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() =>
                      handleLocationSelect({
                        company_locations_id: '-1',
                        location_name: 'All Locations',
                        queue_list: [],
                      })
                    }
                  >
                    <Text style={styles.modalItemText}>All Locations</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() =>
                      handleQueueSelect({
                        queue_master_id: '-1',
                        queue_name: 'All Queues',
                      })
                    }
                  >
                    <Text style={styles.modalItemText}>All Queues</Text>
                  </TouchableOpacity>
                )
              }
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  scrollContent: {
    padding: 20,
  },
  formSection: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 5,
    marginTop: 15,
    fontWeight: 'bold',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 4,
    paddingLeft: 10,
    height: 45,
    backgroundColor: theme.colors.white,
    justifyContent: 'space-between',
  },
  disabledPicker: {
    backgroundColor: theme.colors.lightGray,
  },
  pickerText: {
    fontSize: 15,
    color: theme.colors.iconDark,
  },
  dateRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  dateColumn: {
    flex: 1,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 45,
    backgroundColor: theme.colors.white,
  },
  calendarIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 15,
    color: theme.colors.iconDark,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    maxHeight: '70%',
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backgroundLight,
  },
  modalItemText: {
    fontSize: 16,
    color: theme.colors.iconDark,
  },
  modalCloseButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  modalCloseText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});
