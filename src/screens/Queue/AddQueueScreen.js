import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Loader, ToastService } from '../../components/common';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { CustomHeader } from '../../components/common/CustomHeader';
import { theme } from '../../theme';
import {
  fetchQueueDetails,
  fetchRingGroupNames,
} from '../../api/company';
import { checkDuplicateMobile } from '../../api/auth';
import { getSession, getTerminalDisplayIds, saveTerminalDisplayIds } from '../../utils/session';

export const AddQueueScreen = ({ navigation, route }) => {
  const { locationId, locationName, queueId, isUpdate, location } =
    route.params || {};
  const [loading, setLoading] = useState(false);
  const [isDisplayScreen, setIsDisplayScreen] = useState(false);

  useEffect(() => {
    const checkDisplayScreen = async () => {
      if (isUpdate && queueId && locationId) {
        const stored = await getTerminalDisplayIds();
        if (
          String(stored.locationId) === String(locationId) &&
          String(stored.queueId) === String(queueId)
        ) {
          setIsDisplayScreen(true);
        }
      }
    };
    checkDisplayScreen();
  }, [isUpdate, queueId, locationId]);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    mobile: '',
    locMobile: '',
    logged_company_id: '',
  });
  const [userType, setUserType] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [mobileSuccess, setMobileSuccess] = useState('');
  console.log('userType', userType);
  const DEFAULT_TIME_SLOTS = [
    { day: 'Mon', active: false, startTime: '09:00', endTime: '18:00' },
    { day: 'Tue', active: false, startTime: '09:00', endTime: '18:00' },
    { day: 'Wed', active: false, startTime: '09:00', endTime: '18:00' },
    { day: 'Thu', active: false, startTime: '09:00', endTime: '18:00' },
    { day: 'Fri', active: false, startTime: '09:00', endTime: '18:00' },
    { day: 'Sat', active: false, startTime: '09:00', endTime: '18:00' },
    { day: 'Sun', active: false, startTime: '09:00', endTime: '18:00' },
  ];

  const [formData, setFormData] = useState({
    txtqname: '',
    mobile_number: '',
    email_id: '',
    add_to_ring_topology: false,
    ring_group_name: '',
    ring_counter_no: '',
    rdprebook: false,
    txtprebookDays: '1',
    switchQueueOnOff: false,
    max_token: '',
    default_message_arrived: '',
    isactive: true,
    allow_paid_tokens: '0',
    paid_token_amount: '',
    timeSlots: DEFAULT_TIME_SLOTS,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const session = await getSession();
      setUserType(session.logged_user_type);
      if (session) {
        setCompanyInfo({
          name: session.company_name,
          mobile: session.logged_mobile,
          locMobile: route.params?.locMobile || '',
          logged_company_id: session.logged_company_id,
        });
      }

      if (isUpdate && queueId && queueId !== '-1') {
        const resp = await fetchQueueDetails(queueId);
        if (resp && resp.found && resp.queueInfo) {
          const q = resp.queueInfo;
          setFormData({
            txtqname: q.queue_name || '',
            mobile_number: q.reg_mobile || '',
            email_id: q.reg_email_id || '',
            add_to_ring_topology: q.add_to_ring_topology === '1',
            ring_group_name: q.ring_counter_name || '',
            ring_counter_no: q.ring_counter_no || '',
            rdprebook: q.allow_pre_booking === '1',
            txtprebookDays: q.pre_booking_days || '1',
            switchQueueOnOff: q.max_token !== '-1' && q.max_token !== '0',
            max_token:
              q.max_token !== '-1' && q.max_token !== '0' ? q.max_token : '',
            default_message_arrived: q.default_message_arrived || '',
            isactive: q.is_active === '1',
            allow_paid_tokens: q.allow_paid_tokens || '0',
            paid_token_amount: q.paid_token_amount || '',
            timeSlots:
              resp.listTimingsInfo && resp.listTimingsInfo.length > 0
                ? DEFAULT_TIME_SLOTS.map(d => {
                  const info = resp.listTimingsInfo.find(
                    t => t.week_day === d.day,
                  );
                  if (info) {
                    return {
                      ...d,
                      active: true,
                      startTime: info.start_time.substring(0, 5),
                      endTime: info.end_time.substring(0, 5),
                    };
                  }
                  return d;
                })
                : DEFAULT_TIME_SLOTS,
          });
        }
      }
    } catch (e) {
      console.error('Load Queue Details Error:', e);
      ToastService.show({
        message: 'Failed to load queue details',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMobileBlur = async () => {
    const mobile = formData.mobile_number?.trim();
    if (!mobile) {
      setMobileError('');
      setMobileSuccess('');
      return;
    }

    setLoading(true);
    try {
      const session = await getSession();
      const companyId = session.logged_company_id;
      const curQueueId = (isUpdate && queueId && queueId !== '-1') ? queueId : '-1';

      const result = await checkDuplicateMobile(
        mobile,
        'Q',
        '0',
        companyId,
        locationId || '0',
        curQueueId
      );

      if (result && String(result.code) === '1') {
        setMobileError(result.message || 'Mobile number already in use');
        setMobileSuccess('');
      } else if (result && String(result.code) !== '1') {
        setMobileError('');
        const msg = result.message ? result.message.replace('OK', '').trim() : '';
        setMobileSuccess(msg);
      }
    } catch (e) {
      console.log('Error checking duplicate mobile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (applyToAll = '0') => {
    if (!formData.txtqname || !formData.mobile_number) {
      ToastService.show({
        message: 'Please fill required fields',
        type: 'error',
      });
      return;
    }

    if (mobileError) {
      ToastService.show({ message: mobileError, type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const session = await getSession();
      const data = new FormData();
      data.append('txtcomploca', locationId);
      data.append('txtqlist', queueId || '-1');
      data.append('txtqname', formData.txtqname);
      data.append('rdprebook', formData.rdprebook ? '1' : '0');
      data.append('txtprebookDays', formData.txtprebookDays);
      data.append('aplyToallLoca', applyToAll);
      data.append('mobile_number', formData.mobile_number);
      data.append('email_id', formData.email_id);

      const maxTokenVal = formData.switchQueueOnOff
        ? formData.max_token || '0'
        : '-1';
      data.append('max_token', maxTokenVal);
      data.append('default_message_arrived', formData.default_message_arrived);
      data.append(
        'add_to_ring_topology',
        formData.add_to_ring_topology ? '1' : '0',
      );
      data.append(
        'ring_counter_no',
        formData.add_to_ring_topology ? formData.ring_counter_no : '',
      );
      data.append(
        'ring_group_name',
        formData.add_to_ring_topology ? formData.ring_group_name : '',
      );

      if (isUpdate) {
        data.append('isactive', formData.isactive ? '1' : '0');
      }

      formData.timeSlots.forEach(slot => {
        if (slot.active) {
          data.append(`chk${slot.day}`, slot.day);
          data.append(`st${slot.day}`, slot.startTime);
          data.append(`ed${slot.day}`, slot.endTime);
        }
      });

      const resp = await saveQueueDetails(session.logged_company_id, data);
      if (resp && resp.type === 'SUCCESS') {
        const queueIdToSave = isUpdate ? queueId : resp.queue_id; // Check actual API response format

        if (isDisplayScreen) {
          if (queueIdToSave && locationId) {
            await saveTerminalDisplayIds(locationId, queueIdToSave);
          } else {
            console.warn(
              'Could not save terminal IDs: missing queue or loc id',
            );
          }
        } else if (isUpdate) {
          await saveTerminalDisplayIds('', '');
        }

        ToastService.show({
          message: resp.message || 'Queue saved successfully',
          type: 'success',
        });
        navigation.goBack();
      } else {
        ToastService.show({
          message: resp?.message || 'Failed to save queue',
          type: 'error',
        });
      }
    } catch (e) {
      console.error('Save Queue Error:', e);
      ToastService.show({
        message: 'An error occurred while saving',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDisplayScreen = async () => {
    const nextState = !isDisplayScreen;
    setIsDisplayScreen(nextState);

    if (nextState) {
      if (queueId && locationId) {
        await saveTerminalDisplayIds(locationId, queueId);
        ToastService.show({
          message: 'This device set as queue display screen',
          type: 'success',
        });
      }
    } else {
      await saveTerminalDisplayIds('', '');
      ToastService.show({
        message: 'Display screen setting removed',
        type: 'info',
      });
    }
  };

  const incrementDays = () => {
    const d = parseInt(formData.txtprebookDays);
    if (d < 7) setFormData({ ...formData, txtprebookDays: (d + 1).toString() });
  };

  const decrementDays = () => {
    const d = parseInt(formData.txtprebookDays);
    if (d > 1) setFormData({ ...formData, txtprebookDays: (d - 1).toString() });
  };


  return (
    <View style={styles.container}>
      <CustomHeader
        title={isUpdate ? 'Update Queue Detail' : 'Add Queue Detail'}
        showBackIcon={true}
        navigation={navigation}
        showRightIcon={isUpdate}
        rightIconName={isDisplayScreen ? 'grid-on' : 'grid-off'}
        rightIconPress={toggleDisplayScreen}
      />

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>
          {companyInfo.name}: {companyInfo.mobile}
        </Text>
        <Text style={styles.subHeaderText}>
          {locationName}: {companyInfo.locMobile}
        </Text>
      </View>
      {loading && <Loader visible={loading} />}
      <ScrollView contentContainerStyle={styles.content}>
        <>
          <Text style={styles.label}>Queue Name</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="business"
              size={24}
              color={theme.colors.iconGray}
              style={styles.leftIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Queue Full Name"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.txtqname}
              onChangeText={text =>
                setFormData({ ...formData, txtqname: text })
              }
            />
          </View>

          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="smartphone"
              size={24}
              color={theme.colors.iconGray}
              style={styles.leftIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              placeholderTextColor={theme.colors.placeholder}
              keyboardType="phone-pad"
              value={formData.mobile_number}
              onChangeText={text => {
                setFormData({ ...formData, mobile_number: text });
                if (mobileError) setMobileError('');
                if (mobileSuccess) setMobileSuccess('');
              }}
              onBlur={handleMobileBlur}
            />
          </View>
          {mobileError ? (
            <Text style={{ color: theme.colors.error, fontSize: 12, marginTop: 4, marginBottom: 10 }}>
              {mobileError}
            </Text>
          ) : mobileSuccess ? (
            <Text style={{ color: theme.colors.success, fontSize: 12, marginTop: 4, marginBottom: 10 }}>
              {mobileSuccess}
            </Text>
          ) : <View style={{ height: 14 }} />}
        </>

        <Text style={styles.label}>Email ID</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons
            name="mail-outline"
            size={24}
            color={theme.colors.iconGray}
            style={styles.leftIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="email@domain.com"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email_id}
            onChangeText={text => setFormData({ ...formData, email_id: text })}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Multiple Queue Counter</Text>
          <Switch
            value={formData.add_to_ring_topology}
            onValueChange={v =>
              setFormData({ ...formData, add_to_ring_topology: v })
            }
            trackColor={{
              false: theme.colors.gray,
              true: theme.colors.redLight,
            }}
            thumbColor={
              formData.add_to_ring_topology
                ? theme.colors.primary
                : theme.colors.white
            }
          />
        </View>

        {formData.add_to_ring_topology && (
          <View style={styles.ringGroupContainer}>
            <Text style={styles.label}>Ring Group Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Search Ring Group"
                value={formData.ring_group_name}
                onChangeText={text =>
                  setFormData({ ...formData, ring_group_name: text })
                }
              />
            </View>
            <Text style={styles.label}>Counter Number</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Counter Number"
                keyboardType="numeric"
                value={formData.ring_counter_no}
                onChangeText={text =>
                  setFormData({ ...formData, ring_counter_no: text })
                }
              />
            </View>
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Allow Pre-Booking</Text>
          <Switch
            value={formData.rdprebook}
            onValueChange={v => setFormData({ ...formData, rdprebook: v })}
            trackColor={{
              false: theme.colors.gray,
              true: theme.colors.redLight,
            }}
            thumbColor={
              formData.rdprebook ? theme.colors.primary : theme.colors.white
            }
          />
        </View>
        {formData.rdprebook && (
          <View style={styles.preBookContainer}>
            <Text style={styles.label}>Pre-Booking Days</Text>
            <View style={styles.daysSelector}>
              <TouchableOpacity onPress={decrementDays} style={styles.dayBtn}>
                <MaterialIcons
                  name="remove"
                  size={24}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
              <Text style={styles.daysText}>
                {formData.txtprebookDays} Days
              </Text>
              <TouchableOpacity onPress={incrementDays} style={styles.dayBtn}>
                <MaterialIcons
                  name="add"
                  size={24}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Queue On</Text>
          <Switch
            value={formData.switchQueueOnOff}
            onValueChange={v =>
              setFormData({ ...formData, switchQueueOnOff: v })
            }
            trackColor={{
              false: theme.colors.gray,
              true: theme.colors.redLight,
            }}
            thumbColor={
              formData.switchQueueOnOff
                ? theme.colors.primary
                : theme.colors.white
            }
          />
        </View>

        {formData.switchQueueOnOff && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.label}>Allow Max Tokens</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Set Max Tokens"
                keyboardType="numeric"
                value={formData.max_token}
                onChangeText={text =>
                  setFormData({ ...formData, max_token: text })
                }
              />
            </View>
          </View>
        )}

        <Text style={styles.label}>Message Text</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message Text"
            placeholderTextColor={theme.colors.placeholder}
            value={formData.default_message_arrived}
            onChangeText={text =>
              setFormData({ ...formData, default_message_arrived: text })
            }
          />
        </View>

        <TouchableOpacity
          style={styles.navRow}
          onPress={() => {
            if (!formData.txtqname || !formData.mobile_number) {
              ToastService.show({
                message: 'Please enter queue name & mobile number',
                type: 'error',
              });
              return;
            }
            if (mobileError) {
              ToastService.show({ message: mobileError, type: 'warning' });
              return;
            }
            navigation.navigate('WorkingHours', {
              initialTimeSlots: formData.timeSlots,
              onSave: slots => setFormData({ ...formData, timeSlots: slots }),
              locationName: route.params?.locNAddr || '',
              queueName: formData.txtqname,
              compMobile: companyInfo.mobile,
              location,
            });
          }}
        >
          <Text style={styles.navText}>Add Working Hour Timings</Text>
          <MaterialIcons
            name="keyboard-arrow-right"
            size={24}
            color={theme.colors.textDark}
          />
        </TouchableOpacity>

        {isUpdate && queueId && queueId !== '-1' && (
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => {
              if (!formData.txtqname || !formData.mobile_number) {
                console.log('Please enter queue name & mobile number');
                ToastService.show({
                  message: 'Please enter queue name & mobile number',
                  type: 'error',
                });
                return;
              }
              if (mobileError) {
                ToastService.show({ message: mobileError, type: 'warning' });
                return;
              }
              navigation.navigate('CompHolidaysList', {
                queueId,
                locationId,
                companyId: companyInfo.logged_company_id,
                selectedCompName: companyInfo.name,
                selectedQueueName: formData.txtqname,
                location,
              });
            }}
          >
            <Text style={styles.navText}>Add Holidays</Text>
            <MaterialIcons
              name="keyboard-arrow-right"
              size={24}
              color={theme.colors.textDark}
            />
          </TouchableOpacity>
        )}
        {isUpdate && (
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() =>
              setFormData({ ...formData, isactive: !formData.isactive })
            }
          >
            <MaterialIcons
              name={formData.isactive ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={theme.colors.textDark}
            />
            <Text style={styles.checkboxLabel}>Active Queue</Text>
          </TouchableOpacity>
        )}
        {/* <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setIsDisplayScreen(!isDisplayScreen)}
        >
          <MaterialIcons
            name={isDisplayScreen ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={isDisplayScreen ? theme.colors.primary : theme.colors.textDark}
          />
          <Text style={styles.checkboxLabel}>
            Use this android device as queue display screen
          </Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSave('0')}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, { marginTop: 10 }]}
          onPress={() => handleSave('1')}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            Save and apply timings to all location
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  subHeader: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.m,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  subHeaderText: {
    fontSize: 13,
    color: theme.colors.textDark,
    textAlign: 'center',
  },
  content: { padding: 20 },
  label: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 15,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 50,
    backgroundColor: theme.colors.white,
  },
  leftIcon: { marginRight: 10 },
  input: { flex: 1, color: theme.colors.textDark, fontSize: 16 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  preBookContainer: {
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 13,
    color: theme.colors.textDark,
    fontWeight: 'bold',
  },
  daysSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 10,
    borderRadius: 4,
  },
  dayBtn: {
    padding: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
  },
  daysText: {
    marginHorizontal: 20,
    fontSize: 16,
    color: theme.colors.textDark,
    fontWeight: 'bold',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.border,
    padding: 15,
    marginTop: 15,
    borderRadius: 2,
  },
  navText: { fontSize: 15, color: theme.colors.textDark },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
  },
  checkboxLabel: { marginLeft: 10, fontSize: 16, color: theme.colors.textDark },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  ringGroupContainer: {
    padding: 10,
    backgroundColor: theme.colors.white,
  },
});
