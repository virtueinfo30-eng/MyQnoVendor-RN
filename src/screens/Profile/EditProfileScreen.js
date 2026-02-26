import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { CustomHeader } from '../../components/common/CustomHeader';
import { theme } from '../../theme';
import {
  fetchCompanyProfile,
  updateCompanyProfile,
  fetchCompanyCategories,
} from '../../api/company';
import { fetchUserProfile, updateUserProfile } from '../../api/user_api';
import { getCountriesList, getStatesList, getCitiesList } from '../../api/auth';
import { getSession } from '../../utils/session';
import { API_CONFIG } from '../../api/config';

export const EditProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [user, setUser] = useState(null);
  const [isUserProfile, setIsUserProfile] = useState(false);

  const [showBankDetails, setShowBankDetails] = useState(false);
  const [chequeImage, setChequeImage] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  const [form, setForm] = useState({
    comp_name: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    mobile_number: '',
    email_id: '',
    gender: 'M',
    birth_date: '',
    address: '',
    cmb_country: '',
    countryName: 'Select Country',
    invoice_state_id: '',
    stateName: 'Select State',
    invoice_city_id: '',
    cityName: 'Select City',
    // Company Specific
    comp_cat: '',
    categoryName: 'Select Category',
    short_desc: '',
    multi_loca: '0',
    queue: 'S',
    isactive: '1',
    allow_paid_tokens: '0',
    bank_name: '',
    branch_name: '',
    ifsc_code: '',
    ac_no: '',
    ac_name: '',
    cheque_copy: null,
  });

  const [modalType, setModalType] = useState(null); // 'country', 'state', 'city', 'category'
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const session = await getSession();
      if (session) {
        setUser(session);
        const userType = session.logged_user_type?.toLowerCase();
        const isUser = ['u', 'q', 'l'].includes(userType);
        setIsUserProfile(isUser);

        if (isUser) {
          const [profileResp, countriesResp] = await Promise.all([
            fetchUserProfile(session.logged_user_id),
            getCountriesList(),
          ]);

          if (profileResp.success && profileResp.data) {
            const profile = profileResp.data;
            setForm(prev => ({
              ...prev,
              first_name: profile.first_name || '',
              middle_name: profile.middle_name || '',
              last_name: profile.last_name || '',
              mobile_number: profile.mobile_number || profile.reg_mobile || '',
              email_id: profile.email_id || profile.reg_email_id || '',
              gender: profile.gender || 'M',
              birth_date: profile.birth_date || '',
              address: profile.address || '',
              cmb_country: profile.country_id || '',
              countryName: profile.country_name || 'Select Country',
              invoice_state_id: profile.state_id || '',
              stateName: profile.state_name || 'Select State',
              invoice_city_id: profile.city_id || '',
              cityName: profile.city_name || 'Select City',
            }));

            if (profile.country_id) {
              const statesResp = await getStatesList(profile.country_id);
              setStates(statesResp || []);
            }
            if (profile.state_id) {
              const citiesResp = await getCitiesList(profile.state_id);
              setCities(citiesResp || []);
            }
          }
          setCountries(countriesResp || []);
        } else {
          const compId = session.logged_company_id;
          const [profileResp, categoriesResp, countriesResp] =
            await Promise.all([
              fetchCompanyProfile(compId),
              fetchCompanyCategories(),
              getCountriesList(),
            ]);

          if (profileResp && profileResp.found && profileResp.company) {
            const profile = profileResp.company[0];
            setForm(prev => ({
              ...prev,
              comp_name: profile.company_name || '',
              first_name: profile.owner_first_name || '',
              last_name: profile.owner_last_name || '',
              mobile_number: profile.owner_mobile || '',
              email_id: profile.owner_emailid || '',
              comp_cat: profile.company_category_id || '',
              categoryName: profile.company_category_name || 'Select Category',
              short_desc: profile.short_desc || '',
              cmb_country: profile.country_id || '',
              countryName: profile.country_name || 'Select Country',
              invoice_state_id: profile.state_id || '',
              stateName: profile.state_name || 'Select State',
              invoice_city_id: profile.city_id || '',
              cityName: profile.city_name || 'Select City',
              multi_loca: profile.is_multi_location || '0',
              queue: profile.queue_type || 'S',
              isactive: profile.is_active || '1',
              allow_paid_tokens: profile.allow_paid_tokens || '0',
              bank_name: profile.bank_name || '',
              branch_name: profile.branch_name || '',
              ifsc_code: profile.ifsc_code || '',
              ac_no: profile.ac_no || '',
              ac_name: profile.ac_name || '',
            }));

            if (profile.country_id) {
              const statesResp = await getStatesList(profile.country_id);
              setStates(statesResp || []);
            }
            if (profile.state_id) {
              const citiesResp = await getCitiesList(profile.state_id);
              setCities(citiesResp || []);
            }
          }

          if (categoriesResp && categoriesResp.found) {
            setCategories(categoriesResp.listCompCategory || []);
          }
          setCountries(countriesResp || []);
        }
      }
    } catch (error) {
      console.error('Load Profile Data Error:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleCountrySelect = async (id, name) => {
    setForm(prev => ({
      ...prev,
      cmb_country: id,
      countryName: name,
      invoice_state_id: '',
      stateName: 'Select State',
      invoice_city_id: '',
      cityName: 'Select City',
    }));
    setModalVisible(false);
    setLoading(true);
    try {
      const statesList = await getStatesList(id);
      setStates(statesList || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load states');
    } finally {
      setLoading(false);
    }
  };

  const handleStateSelect = async (id, name) => {
    setForm(prev => ({
      ...prev,
      invoice_state_id: id,
      stateName: name,
      invoice_city_id: '',
      cityName: 'Select City',
    }));
    setModalVisible(false);
    setLoading(true);
    try {
      const citiesList = await getCitiesList(id);
      setCities(citiesList || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load cities');
    } finally {
      setLoading(false);
    }
  };
  const handleUpdate = async () => {
    const isPersonal = isUserProfile;
    if (!isPersonal && !form.comp_name) {
      Alert.alert('Validation', 'Please enter company name');
      return;
    }
    if (!form.first_name || !form.last_name || !form.mobile_number) {
      Alert.alert('Validation', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      let resp;
      if (isPersonal) {
        const profileData = {
          first_name: form.first_name,
          middle_name: form.middle_name,
          last_name: form.last_name,
          mobile_number: form.mobile_number,
          email_id: form.email_id,
          address: form.address,
          country_id: form.cmb_country,
          state_id: form.invoice_state_id,
          city_id: form.invoice_city_id,
          gender: form.gender,
          birth_date: form.birth_date,
        };
        resp = await updateUserProfile(user.logged_user_id, profileData);
      } else {
        resp = await updateCompanyProfile(user.logged_company_id, form);
      }

      if (resp && (resp.found || resp.success) && resp.type !== 'ERROR') {
        Alert.alert('Success', resp.message || 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', resp?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update Profile Error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const renderModalItem = ({ item }) => {
    let id, name;
    if (modalType === 'country') {
      id = item.country_id;
      name = item.country_name;
    } else if (modalType === 'state') {
      id = item.state_id;
      name = item.state_name;
    } else if (modalType === 'city') {
      id = item.city_id;
      name = item.city_name;
    } else if (modalType === 'category') {
      id = item.company_category_id;
      name = item.company_category_name;
    }

    return (
      <TouchableOpacity
        style={styles.modalItem}
        onPress={() => {
          if (modalType === 'country') handleCountrySelect(id, name);
          else if (modalType === 'state') handleStateSelect(id, name);
          else if (modalType === 'city') {
            setForm(prev => ({ ...prev, invoice_city_id: id, cityName: name }));
            setModalVisible(false);
          } else if (modalType === 'category') {
            setForm(prev => ({ ...prev, comp_cat: id, categoryName: name }));
            setModalVisible(false);
          }
        }}
      >
        <Text style={styles.modalItemText}>{name}</Text>
      </TouchableOpacity>
    );
  };

  const selectImageSource = () => {
    setUploadModalVisible(true);
  };

  const handleImageSelect = async source => {
    setUploadModalVisible(false);
    const options = {
      mediaType: 'photo',
      quality: 1,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    const result =
      source === 'camera'
        ? await launchCamera(options)
        : await launchImageLibrary(options);

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setChequeImage(asset);
      setForm(prev => ({
        ...prev,
        cheque_copy: {
          uri:
            Platform.OS === 'android'
              ? asset.uri
              : asset.uri.replace('file://', ''),
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'cheque_copy.jpg',
        },
      }));
    }
  };

  const getModalData = () => {
    if (modalType === 'country') return countries;
    if (modalType === 'state') return states;
    if (modalType === 'city') return cities;
    if (modalType === 'category') return categories;
    return [];
  };

  const profileImage =
    user?.profile_pic || user?.company_logo || user?.user_pic;

  const RadioButton = ({ label, selected, onPress }) => (
    <TouchableOpacity style={styles.radioButtonContainer} onPress={onPress}>
      <MaterialIcons
        name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
        size={24}
        color={selected ? theme.colors.primary : theme.colors.placeholder}
      />
      <Text style={styles.radioButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Profile"
        showBackIcon={true}
        navigation={navigation}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoHeader}>
          {profileImage ? (
            <Image
              source={{ uri: API_CONFIG.BASE_URL + profileImage }}
              style={styles.logo}
            />
          ) : (
            <View style={[styles.logo, styles.logoPlaceholder]}>
              <MaterialIcons
                name="business"
                size={40}
                color={theme.colors.white}
              />
            </View>
          )}
        </View>

        <View style={styles.formCard}>
          {!isUserProfile && (
            <>
              <Text style={styles.label}>Company Name</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="business"
                  size={24}
                  color={theme.colors.iconLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={form.comp_name}
                  onChangeText={text =>
                    setForm(prev => ({ ...prev, comp_name: text }))
                  }
                />
              </View>

              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => {
                  setModalType('category');
                  setModalVisible(true);
                }}
              >
                <MaterialIcons
                  name="list"
                  size={24}
                  color={theme.colors.iconLight}
                  style={styles.inputIcon}
                />
                <Text style={styles.textInput}>{form.categoryName}</Text>
                <MaterialIcons
                  name="arrow-drop-down"
                  size={24}
                  color={theme.colors.iconLight}
                />
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.label}>
            {isUserProfile ? 'First Name' : 'Owner First Name'}
          </Text>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="person-outline"
              size={24}
              color={theme.colors.iconLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              value={form.first_name}
              onChangeText={text =>
                setForm(prev => ({ ...prev, first_name: text }))
              }
              placeholder="Enter First Name"
            />
          </View>

          {isUserProfile && (
            <>
              <Text style={styles.label}>Middle Name</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="person-outline"
                  size={24}
                  color={theme.colors.iconLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={form.middle_name}
                  onChangeText={text =>
                    setForm(prev => ({ ...prev, middle_name: text }))
                  }
                  placeholder="Enter Middle Name"
                />
              </View>
            </>
          )}

          <Text style={styles.label}>
            {isUserProfile ? 'Last Name' : 'Owner Last Name'}
          </Text>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="person-outline"
              size={24}
              color={theme.colors.iconLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              value={form.last_name}
              onChangeText={text =>
                setForm(prev => ({ ...prev, last_name: text }))
              }
              placeholder="Enter Last Name"
            />
          </View>

          <Text style={styles.label}>Country</Text>
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => {
              setModalType('country');
              setModalVisible(true);
            }}
          >
            <MaterialIcons
              name="location-on"
              size={24}
              color={theme.colors.iconLight}
              style={styles.inputIcon}
            />
            <Text style={styles.textInput}>{form.countryName}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.iconLight} />
          </TouchableOpacity>

          <Text style={styles.label}>State</Text>
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => {
              setModalType('state');
              setModalVisible(true);
            }}
          >
            <MaterialIcons
              name="location-on"
              size={24}
              color={theme.colors.iconLight}
              style={styles.inputIcon}
            />
            <Text style={styles.textInput}>{form.stateName}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.iconLight} />
          </TouchableOpacity>

          <Text style={styles.label}>City</Text>
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => {
              setModalType('city');
              setModalVisible(true);
            }}
          >
            <MaterialIcons
              name="location-on"
              size={24}
              color={theme.colors.iconLight}
              style={styles.inputIcon}
            />
            <Text style={styles.textInput}>{form.cityName}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.colors.iconLight} />
          </TouchableOpacity>

          <Text style={styles.label}>
            {isUserProfile ? 'Mobile Number' : 'Owner Mobile Number'}
          </Text>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="smartphone"
              size={24}
              color={theme.colors.iconLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInput, isUserProfile && { color: theme.colors.iconGray }]}
              value={form.mobile_number}
              keyboardType="phone-pad"
              editable={!isUserProfile} // Matches native ProfileUserFragment behavior
              onChangeText={text =>
                setForm(prev => ({ ...prev, mobile_number: text }))
              }
              placeholder="Enter Mobile Number"
            />
          </View>

          <Text style={styles.label}>Email ID</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="mail-outline"
              size={24}
              color={theme.colors.iconLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInput, isUserProfile && { color: theme.colors.iconGray }]}
              value={form.email_id}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isUserProfile}
              onChangeText={text =>
                setForm(prev => ({ ...prev, email_id: text }))
              }
              placeholder="Enter Email ID"
            />
          </View>

          {isUserProfile && (
            <>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.radioRow}>
                <RadioButton
                  label="Male"
                  selected={form.gender === 'M' || form.gender === 'Male'}
                  onPress={() => setForm(prev => ({ ...prev, gender: 'M' }))}
                />
                <RadioButton
                  label="Female"
                  selected={form.gender === 'F' || form.gender === 'Female'}
                  onPress={() => setForm(prev => ({ ...prev, gender: 'F' }))}
                />
              </View>

              <Text style={styles.label}>Birth Date (YYYY-MM-DD)</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="cake"
                  size={24}
                  color={theme.colors.iconLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={form.birth_date}
                  placeholder="e.g. 1990-01-01"
                  onChangeText={text =>
                    setForm(prev => ({ ...prev, birth_date: text }))
                  }
                />
              </View>
            </>
          )}

          <Text style={styles.label}>Address</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="location-on"
              size={24}
              color={theme.colors.iconLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              value={form.address}
              placeholder="Enter Address"
              onChangeText={text =>
                setForm(prev => ({ ...prev, address: text }))
              }
            />
          </View>

          {!isUserProfile && (
            <>
              <Text style={styles.label}>Business Description</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="list"
                  size={24}
                  color={theme.colors.iconLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={form.short_desc}
                  placeholder="Enter Business Description"
                  placeholderTextColor={theme.colors.iconLight}
                  onChangeText={text =>
                    setForm(prev => ({ ...prev, short_desc: text }))
                  }
                />
              </View>

              <Text style={styles.label}>Location Option</Text>
              <View style={styles.radioRow}>
                <RadioButton
                  label="Single Location"
                  selected={form.multi_loca === '0'}
                  onPress={() =>
                    setForm(prev => ({ ...prev, multi_loca: '0' }))
                  }
                />
                <RadioButton
                  label="Multiple Location"
                  selected={form.multi_loca === '1'}
                  onPress={() =>
                    setForm(prev => ({ ...prev, multi_loca: '1' }))
                  }
                />
              </View>

              <Text style={styles.label}>Same Time Slots</Text>
              <View style={styles.radioRow}>
                <RadioButton
                  label="Single Queue"
                  selected={form.queue === 'S'}
                  onPress={() => setForm(prev => ({ ...prev, queue: 'S' }))}
                />
                <RadioButton
                  label="Multiple Queue"
                  selected={form.queue === 'M'}
                  onPress={() => setForm(prev => ({ ...prev, queue: 'M' }))}
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  setForm(prev => ({
                    ...prev,
                    isactive: prev.isactive === '1' ? '0' : '1',
                  }))
                }
              >
                <MaterialIcons
                  name={
                    form.isactive === '1'
                      ? 'check-box'
                      : 'check-box-outline-blank'
                  }
                  size={24}
                  color="#000"
                />
                <Text style={styles.checkboxLabel}>Active Company</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  setForm(prev => ({
                    ...prev,
                    allow_paid_tokens:
                      prev.allow_paid_tokens === '1' ? '0' : '1',
                  }))
                }
              >
                <MaterialIcons
                  name={
                    form.allow_paid_tokens === '1'
                      ? 'check-box'
                      : 'check-box-outline-blank'
                  }
                  size={24}
                  color="#000"
                />
                <Text style={styles.checkboxLabel}>Allow Paid Token</Text>
              </TouchableOpacity>

              <View style={styles.bankDetailWrapper}>
                <TouchableOpacity
                  style={styles.bankDetailHeader}
                  onPress={() => setShowBankDetails(!showBankDetails)}
                >
                  <Text style={styles.bankDetailText}>Add Bank Detail</Text>
                  <MaterialIcons
                    name={showBankDetails ? 'remove' : 'add'}
                    size={24}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>

                {showBankDetails && (
                  <View style={styles.bankDetailContent}>
                    <Text style={styles.fieldLabel}>Bank Name</Text>
                    <View style={styles.bankInputContainer}>
                      <TextInput
                        style={styles.bankInput}
                        placeholder="Enter Bank Name"
                        value={form.bank_name}
                        onChangeText={text =>
                          setForm(prev => ({ ...prev, bank_name: text }))
                        }
                      />
                    </View>

                    <Text style={styles.fieldLabel}>Branch Name</Text>
                    <View style={styles.bankInputContainer}>
                      <TextInput
                        style={styles.bankInput}
                        placeholder="Enter Branch Name"
                        value={form.branch_name}
                        onChangeText={text =>
                          setForm(prev => ({ ...prev, branch_name: text }))
                        }
                      />
                    </View>

                    <Text style={styles.fieldLabel}>IFSC Code</Text>
                    <View style={styles.bankInputContainer}>
                      <TextInput
                        style={styles.bankInput}
                        placeholder="Enter IFSC Code"
                        value={form.ifsc_code}
                        onChangeText={text =>
                          setForm(prev => ({ ...prev, ifsc_code: text }))
                        }
                      />
                    </View>

                    <Text style={styles.fieldLabel}>A/C No.</Text>
                    <View style={styles.bankInputContainer}>
                      <TextInput
                        style={styles.bankInput}
                        placeholder="Enter A/C No."
                        value={form.ac_no}
                        keyboardType="numeric"
                        onChangeText={text =>
                          setForm(prev => ({ ...prev, ac_no: text }))
                        }
                      />
                    </View>

                    <Text style={styles.fieldLabel}>A/C Name</Text>
                    <View style={styles.bankInputContainer}>
                      <TextInput
                        style={styles.bankInput}
                        placeholder="Enter A/C Holder's Name"
                        value={form.ac_name}
                        onChangeText={text =>
                          setForm(prev => ({ ...prev, ac_name: text }))
                        }
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={selectImageSource}
                    >
                      {chequeImage ? (
                        <Image
                          source={{ uri: chequeImage.uri }}
                          style={styles.chequePreview}
                        />
                      ) : (
                        <MaterialIcons
                          name="folder-open"
                          size={40}
                          color={theme.colors.textMuted}
                          style={{ marginBottom: 5 }}
                        />
                      )}
                      <Text style={styles.uploadText}>
                        {chequeImage
                          ? 'Change Cheque Copy'
                          : 'Upload Cancel Cheque Copy'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select {modalType}</Text>
            <FlatList
              data={getModalData()}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderModalItem}
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

      <Modal
        visible={uploadModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setUploadModalVisible(false)}
        >
          <View style={styles.uploadModalContent}>
            <Text style={styles.modalTitle}>Choose Image Source</Text>
            <TouchableOpacity
              style={styles.uploadOption}
              onPress={() => handleImageSelect('camera')}
            >
              <MaterialIcons
                name="photo-camera"
                size={30}
                color={theme.colors.primary}
              />
              <Text style={styles.uploadOptionText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadOption}
              onPress={() => handleImageSelect('gallery')}
            >
              <MaterialIcons
                name="photo-library"
                size={30}
                color={theme.colors.primary}
              />
              <Text style={styles.uploadOptionText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setUploadModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  logoHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: theme.colors.white,
  },
  logo: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  logoPlaceholder: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    paddingHorizontal: 15,
  },
  label: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 15,
    marginBottom: 5,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.backgroundLight,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 55,
    backgroundColor: theme.colors.white,
  },
  inputIcon: {
    marginRight: 15,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.iconDark,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 40,
    paddingVertical: 8,
  },
  radioButtonLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: theme.colors.iconDark,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: theme.colors.iconDark,
  },
  bankDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backgroundLight,
    paddingHorizontal: 15,
    height: 60,
    backgroundColor: theme.colors.white,
  },
  bankDetailText: {
    fontSize: 15,
    color: theme.colors.iconDark,
  },
  saveButton: {
    backgroundColor: '#D32F2F', // Specific red from screenshot
    height: 50,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginHorizontal: 10,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
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
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    textTransform: 'capitalize',
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
    marginTop: 20,
    alignItems: 'center',
  },
  modalCloseText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  bankDetailWrapper: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
  },
  bankDetailContent: {
    padding: 15,
    backgroundColor: theme.colors.white,
  },
  fieldLabel: {
    fontSize: 12,
    color: theme.colors.iconDark,
    marginTop: 15,
    marginBottom: 8,
    fontWeight: '500',
  },
  bankInputContainer: {
    borderWidth: 1,
    borderColor: theme.colors.backgroundLight,
    borderRadius: 6,
    paddingHorizontal: 15,
    height: 50,
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
  bankInput: {
    fontSize: 15,
    color: theme.colors.iconDark,
  },
  uploadButton: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 20,
  },
  uploadText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 5,
  },
  chequePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  uploadModalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 25,
    width: '80%',
    alignItems: 'center',
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backgroundLight,
  },
  uploadOptionText: {
    fontSize: 16,
    color: theme.colors.iconDark,
    marginLeft: 15,
    fontWeight: '500',
  },
});
