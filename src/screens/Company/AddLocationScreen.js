import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { Loader, ToastService } from '../../components/common';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { CustomHeader } from '../../components/common/CustomHeader';
import { theme } from '../../theme';
import {
  fetchStateList,
  fetchCityList,
  fetchLocationDetails,
} from '../../api/company';
import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/config';
import { getSession, saveTerminalDisplayIds } from '../../utils/session';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid } from 'react-native';

export const AddLocationScreen = ({ navigation, route }) => {
  const isEdit = !!route.params?.location;
  const [loading, setLoading] = useState(false);
  const [isDisplayScreen, setIsDisplayScreen] = useState(false);

  // OTP verification state
  const [otpDialogVisible, setOtpDialogVisible] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [serverOtp, setServerOtp] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [formData, setFormData] = useState({
    location_name: '',
    address: '',
    mobile: '',
    email: '',
    cmb_country: '101', // Default India
    cmb_state: '12', // Default state
    cmb_city: '',
    country_name: 'India',
    state_name: 'Gujarat',
    city_name: 'Ahmedabad',
    isactive: '1',
    latitude: '22.997554',
    longitude: '72.502071',
  });

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState('state'); // 'state' or 'city'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStates();
    if (isEdit) {
      loadLocationDetails();
    }
  }, []);

  const loadLocationDetails = async () => {
    const locId =
      route.params?.location?.company_locations_id ||
      route.params?.location?.location_id;
    if (!locId) return;

    setLoading(true);
    try {
      const resp = await fetchLocationDetails(locId);
      if (resp && resp.found && resp.location && resp.location.length > 0) {
        const details = resp.location[0];
        setFormData({
          location_name: details.location_name || '',
          address: details.address || '',
          mobile: details.location_mobile || '',
          email: details.location_email || '',
          cmb_country: details.country_id || '101',
          cmb_state: details.state_id || '',
          cmb_city: details.city_id || '',
          country_name: details.country_name || 'India',
          state_name: details.state_name || '',
          city_name: details.city_name || '',
          isactive: details.is_active || '1',
          latitude: details.latitude || '22.997554',
          longitude: details.longitude || '72.502071',
        });
      }
    } catch (e) {
      console.error('Fetch location details error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.cmb_state) {
      loadCities(formData.cmb_state);
    }
  }, [formData.cmb_state]);

  const loadStates = async () => {
    try {
      const resp = await fetchStateList(formData.cmb_country);
      if (resp && Array.isArray(resp)) {
        const mapped = resp.map(item => ({
          id: item.state_id,
          name: item.state_name,
        }));
        setStates(mapped);
      }
    } catch (e) {
      console.error('States load error:', e);
    }
  };

  const loadCities = async stateId => {
    try {
      const resp = await fetchCityList(stateId);
      if (resp && Array.isArray(resp)) {
        const mapped = resp.map(item => ({
          id: item.city_id,
          name: item.city_name,
        }));
        setCities(mapped);
      }
    } catch (e) {
      console.error('Cities load error:', e);
    }
  };

  const handleRegionSelect = item => {
    if (pickerType === 'state') {
      setFormData({
        ...formData,
        cmb_state: item.id,
        state_name: item.name,
        cmb_city: '',
        city_name: '',
      });
      // loadCities is now handled by useEffect
    } else {
      setFormData({
        ...formData,
        cmb_city: item.id,
        city_name: item.name,
      });
    }
    setShowPicker(false);
    setSearchQuery('');
  };

  const filteredRegions = (pickerType === 'state' ? states : cities).filter(
    item =>
      item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  };

  // Step 1: Check if mobile is duplicate
  const handleVerifyMobile = async () => {
    const mobile = formData.mobile.trim();
    if (!mobile || mobile.length < 10) {
      ToastService.show({
        message: 'Please enter a valid mobile number first',
        type: 'error',
      });
      return;
    }
    setOtpLoading(true);
    try {
      const session = await getSession();
      const companyId = session.logged_company_id;
      const ctryId = formData.cmb_country || '101';
      const locId = isEdit
        ? route.params?.location?.company_locations_id || '-1'
        : '-1';

      // Step 1: Check for duplicate mobile
      const dupUrl = `${ENDPOINTS.CHECK_DUPLICATE_MOBILE}/${mobile}/L/${ctryId}/${companyId}/${locId}/-1`;
      const dupResp = await apiClient.get(dupUrl);
      const dupData = dupResp.data;

      if (dupData?.code === '1') {
        // Mobile is already used elsewhere
        ToastService.show({
          message: dupData.message || 'Mobile number already in use',
          type: 'error',
        });
        return;
      }

      // Step 2: Generate OTP
      const otpUrl = `${ENDPOINTS.GENERATE_OTP}/${mobile}/L/${ctryId}/${companyId}/${locId}/-1`;
      const otpResp = await apiClient.get(otpUrl);

      if (otpResp.data?.type === 'SUCCESS') {
        setServerOtp(otpResp.data.OTP || '');
        setOtpValue('');
        setOtpDialogVisible(true);
      } else {
        ToastService.show({
          message: otpResp.data?.message || 'Failed to send OTP',
          type: 'error',
        });
      }
    } catch (e) {
      console.error(e);
      ToastService.show({ message: 'Failed to send OTP', type: 'error' });
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 3: Confirm OTP via API (matches native ConfirmOTP)
  const handleConfirmOtp = async () => {
    const otp = otpValue.trim();
    if (!otp) {
      ToastService.show({ message: 'Please enter OTP', type: 'warning' });
      return;
    }
    setOtpLoading(true);
    try {
      const session = await getSession();
      const mobile = formData.mobile.trim();
      const ctryId = formData.cmb_country || '101';
      const locId = isEdit
        ? route.params?.location?.company_locations_id || '-1'
        : '-1';

      const confirmUrl = `${ENDPOINTS.CONFIRM_OTP}/${mobile}/L/${ctryId}/${locId}/${otp}`;
      const resp = await apiClient.get(confirmUrl);

      if (resp.data?.type === 'SUCCESS') {
        setMobileVerified(true);
        setOtpDialogVisible(false);
        ToastService.show({
          message: resp.data.message || 'Mobile number verified successfully',
          type: 'success',
        });
      } else {
        ToastService.show({
          message: resp.data?.message || 'Incorrect OTP. Please try again.',
          type: 'error',
        });
      }
    } catch (e) {
      console.error(e);
      ToastService.show({ message: 'OTP verification failed', type: 'error' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSetLocation = async () => {
    setLoading(true);
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      ToastService.show({
        message: 'Location permission is required to fetch coordinates.',
        type: 'error',
      });
      setLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        let address = formData.address;

        try {
          // Attempt reverse geocoding via Nominatim API since we don't have a reliable mapping SDK built-in
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const json = await res.json();
          if (json && json.display_name) {
            address = json.display_name;
          }
        } catch (e) {
          console.warn('Reverse geocoding failed', e);
        }

        setFormData(prev => ({
          ...prev,
          latitude: String(latitude),
          longitude: String(longitude),
          address: address, // update address
        }));
        ToastService.show({
          message: 'Coordinates and address fetched successfully.',
          type: 'success',
        });
        setLoading(false);
      },
      error => {
        console.error('Location Error', error);
        ToastService.show({
          message: `Failed to get location: ${error.message}`,
          type: 'error',
        });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const handleSave = async () => {
    if (!formData.location_name || !formData.address || !formData.mobile) {
      ToastService.show({
        message: 'Please fill all required fields',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const session = await getSession();
      if (!session) return;

      const url = isEdit
        ? `api/company/updatecompanylocation/${session.logged_company_id}`
        : `api/company/insertcompanylocation/${session.logged_company_id}`;

      const data = new FormData();
      if (isEdit) {
        data.append(
          'comp_location',
          route.params?.location?.company_locations_id ||
            route.params?.location?.location_id,
        );
      } else {
        data.append('comp_location', '-1');
      }

      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      data.append('device_token', 'token');
      data.append('device_type', 'android');

      const response = await apiClient.post(url, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.type === 'SUCCESS') {
        const locationIdToSave = isEdit
          ? route.params?.location?.company_locations_id ||
            route.params?.location?.location_id
          : response.data?.location_id; // Assuming API returns this on insert

        if (isDisplayScreen) {
          if (locationIdToSave) {
            await saveTerminalDisplayIds(locationIdToSave, '-1');
          } else {
            console.warn('Could not save terminal IDs: location_id missing');
          }
        } else if (isEdit) {
          // If unchecking it while editing the currently active display screen
          // We'd ideally check if it matches the stored one to clear it, but for simplicity
          // we match the native app logic which resets it if specifically unchecked locally.
          await saveTerminalDisplayIds('', '');
        }

        ToastService.show({
          message: response.data.message || 'Location saved',
          type: 'success',
        });
        navigation.goBack();
      } else {
        ToastService.show({
          message: response.data?.message || 'Failed to save location',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Save location error', error);
      ToastService.show({
        message: 'An error occurred while saving the location',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title={isEdit ? 'Update Location' : 'Add Location'}
        showBackIcon={true}
        navigation={navigation}
      />
      {loading && <Loader visible={loading} />}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Country</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { color: theme.colors.black }]}
            value={formData.country_name}
            editable={false}
          />
          <MaterialIcons
            name="lock"
            size={20}
            color={theme.colors.iconLight}
            style={styles.rightIcon}
          />
        </View>

        <Text style={styles.label}>State</Text>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => {
            setPickerType('state');
            setShowPicker(true);
          }}
        >
          <TextInput
            style={[styles.input, { color: theme.colors.black }]}
            value={formData.state_name}
            editable={false}
            pointerEvents="none"
          />
          <MaterialIcons
            name="arrow-drop-down"
            size={24}
            color={theme.colors.iconLight}
            style={styles.rightIcon}
          />
        </TouchableOpacity>

        <Text style={styles.label}>City</Text>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => {
            if (!formData.cmb_state) {
              ToastService.show({
                message: 'Please select state first',
                type: 'info',
              });
              return;
            }
            setPickerType('city');
            setShowPicker(true);
          }}
        >
          <TextInput
            style={[styles.input, { color: theme.colors.black }]}
            value={formData.city_name}
            editable={false}
            pointerEvents="none"
          />
          <MaterialIcons
            name="arrow-drop-down"
            size={24}
            color={theme.colors.iconLight}
            style={styles.rightIcon}
          />
        </TouchableOpacity>

        <Text style={styles.label}>Location Name</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons
            name="location-on"
            size={24}
            color={theme.colors.iconLight}
            style={styles.leftIcon}
          />
          <TextInput
            style={styles.input}
            value={formData.location_name}
            onChangeText={text =>
              setFormData({ ...formData, location_name: text })
            }
            placeholder="Location Name"
            placeholderTextColor={theme.colors.iconLight}
          />
        </View>

        <Text style={styles.label}>Address</Text>
        <View
          style={[
            styles.inputContainer,
            { alignItems: 'flex-start', paddingTop: 8 },
          ]}
        >
          <MaterialIcons
            name="location-on"
            size={24}
            color={theme.colors.iconLight}
            style={styles.leftIcon}
          />
          <TextInput
            style={[styles.input, { minHeight: 60, marginTop: -4 }]}
            value={formData.address}
            onChangeText={text => setFormData({ ...formData, address: text })}
            placeholder="Address"
            placeholderTextColor={theme.colors.iconLight}
            multiline
          />
        </View>

        <Text style={styles.label}>Mobile Number</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons
            name="smartphone"
            size={24}
            color={theme.colors.iconLight}
            style={styles.leftIcon}
          />
          <TextInput
            style={styles.input}
            value={formData.mobile}
            onChangeText={text => {
              setFormData({ ...formData, mobile: text });
              setMobileVerified(false);
            }}
            placeholder="Mobile Number"
            placeholderTextColor={theme.colors.iconLight}
            keyboardType="phone-pad"
          />
          {mobileVerified ? (
            <MaterialIcons
              name="verified"
              size={22}
              color="green"
              style={styles.rightIcon}
            />
          ) : (
            <TouchableOpacity
              onPress={handleVerifyMobile}
              disabled={otpLoading}
              style={styles.verifyBtn}
            >
              <Text style={styles.otpButtonText}>Send OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.label}>Email ID</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons
            name="mail-outline"
            size={24}
            color={theme.colors.iconLight}
            style={styles.leftIcon}
          />
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={text => setFormData({ ...formData, email: text })}
            placeholder="email@domain.com"
            placeholderTextColor={theme.colors.iconLight}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {isEdit ? (
          /* Edit mode: show existing lat/lng, with an option to update */
          <TouchableOpacity
            style={styles.locationViewContainer}
            onPress={handleSetLocation}
          >
            <MaterialIcons
              name="location-on"
              size={20}
              color={theme.colors.primary}
              style={styles.leftIcon}
            />
            <Text style={styles.locationText}>
              {formData.latitude} , {formData.longitude}
            </Text>
            <MaterialIcons
              name="keyboard-arrow-right"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        ) : (
          /* Add mode: button to fetch GPS coordinates */
          <TouchableOpacity
            style={styles.locationPickerContainer}
            onPress={handleSetLocation}
          >
            <MaterialIcons
              name="location-on"
              size={20}
              color={theme.colors.primary}
              style={styles.leftIcon}
            />
            {!formData.latitude || formData.latitude === '22.997554' ? (
              <Text style={styles.locationText}>Set Latitude - Longitude</Text>
            ) : (
              <Text style={styles.locationText}>
                {formData.latitude} , {formData.longitude}
              </Text>
            )}
            <MaterialIcons
              name="keyboard-arrow-right"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        )}

        {isEdit && (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() =>
              setFormData({
                ...formData,
                isactive: formData.isactive === '1' ? '0' : '1',
              })
            }
          >
            <MaterialIcons
              name={
                formData.isactive === '1'
                  ? 'check-box'
                  : 'check-box-outline-blank'
              }
              size={24}
              color={
                formData.isactive === '1'
                  ? theme.colors.black
                  : theme.colors.iconGray
              }
            />
            <Text style={styles.checkboxLabel}>Active Location</Text>
          </TouchableOpacity>
        )}

        {/* <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setIsDisplayScreen(!isDisplayScreen)}
        >
          <MaterialIcons
            name={isDisplayScreen ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={isDisplayScreen ? theme.colors.primary : theme.colors.iconGray}
          />
          <Text style={styles.checkboxLabel}>
            Use this android device as location display screen
          </Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal
        visible={otpDialogVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setOtpDialogVisible(false)}
      >
        <View style={styles.otpOverlay}>
          <View style={styles.otpContainer}>
            <Text style={styles.otpTitle}>Verify Mobile Number</Text>
            <Text style={styles.otpSubtitle}>
              An OTP has been sent to {formData.mobile}
            </Text>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter OTP"
              value={otpValue}
              onChangeText={setOtpValue}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <View style={styles.otpBtnRow}>
              <TouchableOpacity
                style={[
                  styles.otpBtn,
                  { backgroundColor: theme.colors.iconGray },
                ]}
                onPress={() => setOtpDialogVisible(false)}
              >
                <Text style={styles.otpBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.otpBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleConfirmOtp}
              >
                <Text style={styles.otpBtnText}>Verify</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={{ marginTop: 12, alignItems: 'center' }}
              onPress={handleVerifyMobile}
            >
              <Text style={{ color: theme.colors.primary, fontSize: 14 }}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {pickerType === 'state' ? 'State' : 'City'}
              </Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.colors.iconDark}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <MaterialIcons
                name="search"
                size={20}
                color={theme.colors.iconGray}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredRegions}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.regionItem}
                  onPress={() => handleRegionSelect(item)}
                >
                  <Text style={styles.regionItemText}>{item.name}</Text>
                  {(pickerType === 'state'
                    ? formData.cmb_state === item.id
                    : formData.cmb_city === item.id) && (
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={theme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No data mapping found</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.l },
  label: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 4,
    marginTop: 12,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    minHeight: 48,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    color: theme.colors.textDark,
    fontSize: 16,
    paddingVertical: 8,
  },
  // Verify button
  verifyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: 6,
  },
  verifyBtnText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    padding: 12,
    marginTop: 20,
    borderRadius: 4,
  },
  locationText: {
    flex: 1,
    color: theme.colors.textDark,
    fontSize: 16,
    marginLeft: 8,
  },
  locationViewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    padding: 12,
    marginTop: 20,
    borderRadius: 4,
  },
  updateLocBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  updateLocBtnText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    color: theme.colors.textDark,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 2,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'normal',
  },
  otpButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textDark,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.textDark,
  },
  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  regionItemText: {
    fontSize: 16,
    color: theme.colors.textDark,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: theme.colors.textDark,
  },
  // OTP Modal
  otpOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  otpContainer: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: 24,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.iconDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    padding: 12,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 20,
  },
  otpBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  otpBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  otpBtnText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
