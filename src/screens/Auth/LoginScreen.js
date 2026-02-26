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
import { loginUser, getCountriesList, forgotPassword } from '../api/auth';
import { theme } from '../../theme';
import { AuthHeader } from '../../components/common';
import { saveSession } from '../../utils/session';

export const LoginScreen = ({ navigation }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [countryId, setCountryId] = useState('');
  const [countryName, setCountryName] = useState('Select Country');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const list = await getCountriesList();
      setCountries(list);

      const defaultCountry =
        list.find(c => c.country_name === 'India') || list[0];
      if (defaultCountry) {
        setCountryId(defaultCountry.country_id);
        setCountryName(defaultCountry.country_name);
      }
    } catch (error) {
      console.log('Error fetching countries', error);
      Alert.alert('Error', 'Failed to load countries list');
    }
  };

  const handleLogin = async () => {
    if (!countryId) {
      Alert.alert('Validation', 'Please select a country');
      return;
    }
    if (!username.trim()) {
      Alert.alert('Validation', 'Please enter mobile number');
      return;
    }
    if (!password) {
      Alert.alert('Validation', 'Please enter password');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(countryId, username, password);
      console.log('response', response);
      if (
        response.success &&
        response.data?.found &&
        response.data?.type === 'SUCCESS'
      ) {
        const saved = await saveSession(response.data);
        if (saved) {
          // Parity fix: Redirect based on user type as in native MainActivity.java
          // If 'u' -> SearchScreen, else -> Main (CompanyLocation)
          if (response.data.logged_user_type?.toLowerCase() === 'u') {
            navigation.replace('Main', { screen: 'Search' });
          } else {
            navigation.replace('Main');
          }
        } else {
          Alert.alert('Error', 'Failed to save session');
        }
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Login request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!countryId || !username.trim()) {
      Alert.alert(
        'Required',
        'Please select country and enter mobile number first.',
      );
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword(countryId, username);
      Alert.alert('Result', res.message || 'Please check your SMS');
    } catch (e) {
      Alert.alert('Error', 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setCountryId(item.country_id);
        setCountryName(item.country_name);
        setModalVisible(false);
      }}
    >
      <Text style={styles.modalItemText}>
        {item.country_name} (+{item.country_code})
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AuthHeader
        activeTab="Login"
        onTabPress={tab => {
          if (tab === 'Signup') navigation.navigate('Signup');
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            {/* Country Picker */}
            <Text style={styles.label}>Country</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setModalVisible(true)}
            >
              <MaterialIcons
                name="public"
                size={24}
                color={theme.colors.placeholder}
                style={styles.inputIcon}
              />
              <View style={styles.inputTextContainer}>
                <Text
                  style={[
                    styles.inputText,
                    !countryId && { color: theme.colors.placeholder },
                  ]}
                >
                  {countryName}
                </Text>
              </View>
              <MaterialIcons
                name="arrow-drop-down"
                size={24}
                color={theme.colors.placeholder}
              />
            </TouchableOpacity>

            {/* Mobile Number */}
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="phone-android"
                size={24}
                color={theme.colors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Enter mobile number"
                placeholderTextColor={theme.colors.placeholder}
                keyboardType="phone-pad"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="vpn-key"
                size={24}
                color={theme.colors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor={theme.colors.placeholder}
                secureTextEntry={secureText}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                <MaterialIcons
                  name={secureText ? 'visibility-off' : 'visibility'}
                  size={24}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <FlatList
              data={countries}
              keyExtractor={item => item.country_id.toString()}
              renderItem={renderCountryItem}
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
    padding: theme.spacing.m,
  },
  formContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.l,
    borderRadius: theme.radius.m,
    marginTop: theme.spacing.m,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: theme.spacing.m,
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
  loginButton: {
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: theme.radius.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotText: {
    color: theme.colors.blue,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: theme.spacing.l,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.m,
    maxHeight: '70%',
    padding: theme.spacing.m,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.m,
    textAlign: 'center',
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
