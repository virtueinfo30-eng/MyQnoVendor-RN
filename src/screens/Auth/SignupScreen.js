import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  getCountriesList,
  getStatesList,
  getCitiesList,
  getCompanyCategories,
  registerVendor,
} from '../api/auth';
import { theme } from '../../theme';
import { AuthHeader } from '../../components/common';

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

export const SignupScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);

  // Form State
  const [form, setForm] = useState({
    comp_name: '',
    comp_cat: '',
    categoryName: 'Select Category',
    first_name: '',
    last_name: '',
    mobile_number: '',
    email_id: '',
    cmb_country: '',
    countryName: 'Select Country',
    invoice_state_id: '',
    stateName: 'Select State',
    invoice_city_id: '',
    cityName: 'Select City',
    queue: 'S', // S for Single, M for Multiple
    multi_loca: '0', // 0 for Single, 1 for Multiple
  });

  // Modal States
  const [modalType, setModalType] = useState(null); // 'country', 'state', 'city', 'category'
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [countriesList, categoriesData] = await Promise.all([
        getCountriesList(),
        getCompanyCategories(),
      ]);
      setCountries(countriesList || []);
      console.log('countriesList', countriesList);
      console.log('categoriesData', categoriesData);
      if (categoriesData && categoriesData.found) {
        console.log('categoriesData', categoriesData);
        setCategories(categoriesData.categories || []);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
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

  const handleSignup = async () => {
    // Validation
    if (
      !form.comp_name ||
      !form.comp_cat ||
      !form.first_name ||
      !form.last_name ||
      !form.mobile_number ||
      !form.cmb_country ||
      !form.invoice_state_id ||
      !form.invoice_city_id
    ) {
      Alert.alert('Validation', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await registerVendor({
        ...form,
        latitude: '0.0',
        longitude: '0.0',
        device_token: 'dummy_token',
        device_type: 'android',
        isactive: '1',
      });

      if (response.found && response.type === 'SUCCESS') {
        Alert.alert(
          'Success',
          response.message || 'Account created successfully',
          [{ text: 'OK', onPress: () => navigation.replace('Auth') }],
        );
      } else {
        Alert.alert(
          'Registration Failed',
          response.message || 'Something went wrong',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Signup request failed');
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

  const getModalData = () => {
    if (modalType === 'country') return countries;
    if (modalType === 'state') return states;
    if (modalType === 'city') return cities;
    if (modalType === 'category') return categories;
    return [];
  };

  return (
    <View style={styles.container}>
      <AuthHeader
        activeTab="Signup"
        onTabPress={tab => {
          if (tab === 'Login') navigation.navigate('Login');
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
            <Text style={styles.label}>Company Name *</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="business"
                size={24}
                color={theme.colors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Enter company name"
                placeholderTextColor={theme.colors.placeholder}
                value={form.comp_name}
                onChangeText={text =>
                  setForm(prev => ({ ...prev, comp_name: text }))
                }
              />
            </View>

            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => {
                setModalType('category');
                setModalVisible(true);
              }}
            >
              <MaterialIcons
                name="category"
                size={24}
                color={theme.colors.placeholder}
                style={styles.inputIcon}
              />
              <View style={styles.inputTextContainer}>
                <Text
                  style={[
                    styles.inputText,
                    !form.comp_cat && { color: theme.colors.placeholder },
                  ]}
                >
                  {form.categoryName}
                </Text>
              </View>
              <MaterialIcons
                name="arrow-drop-down"
                size={24}
                color={theme.colors.placeholder}
              />
            </TouchableOpacity>

            <Text style={styles.label}>Owner First Name</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="person"
                size={24}
                color={theme.colors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="First name"
                placeholderTextColor={theme.colors.placeholder}
                value={form.first_name}
                onChangeText={text =>
                  setForm(prev => ({ ...prev, first_name: text }))
                }
              />
            </View>

            <Text style={styles.label}>Owner Last Name</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="person"
                size={24}
                color={theme.colors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Last name"
                placeholderTextColor={theme.colors.placeholder}
                value={form.last_name}
                onChangeText={text =>
                  setForm(prev => ({ ...prev, last_name: text }))
                }
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
                name="my-location"
                size={24}
                color={theme.colors.placeholder}
                style={styles.inputIcon}
              />
              <View style={styles.inputTextContainer}>
                <Text
                  style={[
                    styles.inputText,
                    !form.cmb_country && { color: theme.colors.placeholder },
                  ]}
                >
                  {form.countryName}
                </Text>
              </View>
              <MaterialIcons
                name="arrow-drop-down"
                size={24}
                color={theme.colors.placeholder}
              />
            </TouchableOpacity>

            <Text style={styles.label}>State</Text>
            <TouchableOpacity
              style={[
                styles.inputContainer,
                !form.cmb_country && {
                  backgroundColor: theme.colors.lightGray,
                },
              ]}
              disabled={!form.cmb_country}
              onPress={() => {
                setModalType('state');
                setModalVisible(true);
              }}
            >
              <MaterialIcons
                name="my-location"
                size={24}
                color={theme.colors.placeholder}
                style={styles.inputIcon}
              />
              <View style={styles.inputTextContainer}>
                <Text
                  style={[
                    styles.inputText,
                    !form.invoice_state_id && {
                      color: theme.colors.placeholder,
                    },
                  ]}
                >
                  {form.stateName}
                </Text>
              </View>
              <MaterialIcons
                name="arrow-drop-down"
                size={24}
                color={theme.colors.placeholder}
              />
            </TouchableOpacity>

            <Text style={styles.label}>City</Text>
            <TouchableOpacity
              style={[
                styles.inputContainer,
                !form.invoice_state_id && {
                  backgroundColor: theme.colors.lightGray,
                },
              ]}
              disabled={!form.invoice_state_id}
              onPress={() => {
                setModalType('city');
                setModalVisible(true);
              }}
            >
              <MaterialIcons
                name="my-location"
                size={24}
                color={theme.colors.placeholder}
                style={styles.inputIcon}
              />
              <View style={styles.inputTextContainer}>
                <Text
                  style={[
                    styles.inputText,
                    !form.invoice_city_id && {
                      color: theme.colors.placeholder,
                    },
                  ]}
                >
                  {form.cityName}
                </Text>
              </View>
              <MaterialIcons
                name="arrow-drop-down"
                size={24}
                color={theme.colors.placeholder}
              />
            </TouchableOpacity>

            <Text style={styles.label}>Owner Mobile Number</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="phone-android"
                size={24}
                color={theme.colors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Mobile Number"
                placeholderTextColor={theme.colors.placeholder}
                keyboardType="phone-pad"
                value={form.mobile_number}
                onChangeText={text =>
                  setForm(prev => ({ ...prev, mobile_number: text }))
                }
              />
            </View>

            <Text style={styles.label}>Email ID</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="email"
                size={24}
                color={theme.colors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Email ID"
                placeholderTextColor={theme.colors.placeholder}
                keyboardType="email-address"
                value={form.email_id}
                onChangeText={text =>
                  setForm(prev => ({ ...prev, email_id: text }))
                }
              />
            </View>

            <View style={styles.radioWrapper}>
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
            </View>

            <View style={styles.radioWrapper}>
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
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.lightGray,
  },
  scrollContent: {
    padding: 15,
  },
  formCard: {
    backgroundColor: theme.colors.white,
    padding: 20,
    borderRadius: theme.radius.m,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 8,
    marginTop: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.s,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: theme.colors.white,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputTextContainer: {
    flex: 1,
  },
  inputText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    height: '100%',
  },
  radioWrapper: {
    marginTop: 10,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    flex: 1,
  },
  radioButtonLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.text,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: theme.radius.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.m,
    maxHeight: '70%',
    padding: 15,
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
