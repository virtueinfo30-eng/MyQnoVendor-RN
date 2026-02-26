import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/config';
import { theme } from '../../theme';
import { getSession } from '../../utils/session';
import { CustomHeader } from '../../components/common/CustomHeader';

export const ChangePasswordScreen = ({ navigation }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (!oldPassword || !newPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const session = await getSession();
      const formData = new FormData();
      formData.append('username', session.logged_mobile);
      formData.append('opassword', oldPassword);
      formData.append('npassword', newPassword);
      formData.append('rnpassword', confirmPassword);
      // Native app might use different params or user_id, adjusting based on standard pattern

      const response = await apiClient.post(
        ENDPOINTS.CHANGE_PASSWORD,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      if (response.data && response.data.type === 'SUCCESS') {
        Alert.alert('Success', 'Password changed successfully');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert(
          'Error',
          response.data?.message || 'Failed to change password',
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Change Password"
        navigation={navigation}
        showBackIcon={false}
      />
      <View style={styles.content}>
        <Text style={styles.label}>Old Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder="Enter Old Password"
        />

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter New Password"
        />

        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Enter Confirm New Password"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleChange}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.l,
  },
  label: { marginBottom: 8, color: theme.colors.textSecondary },
  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.radius.s,
    marginBottom: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.radius.s,
    alignItems: 'center',
  },
  buttonText: { color: theme.colors.white, fontWeight: 'bold' },
});
