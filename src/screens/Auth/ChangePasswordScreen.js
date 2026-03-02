import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/config';
import { theme } from '../../theme';
import { getSession } from '../../utils/session';
import { CustomHeader } from '../../components/common/CustomHeader';
import { Loader, ToastService } from '../../components/common';

export const ChangePasswordScreen = ({ navigation }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (newPassword !== confirmPassword) {
      ToastService.show({
        message: 'New passwords do not match',
        type: 'error',
      });
      return;
    }
    if (!oldPassword || !newPassword) {
      ToastService.show({ message: 'Please fill all fields', type: 'warning' });
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

      const response = await apiClient.post(
        ENDPOINTS.CHANGE_PASSWORD,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      if (response.data && response.data.type === 'SUCCESS') {
        ToastService.show({
          message: 'Password changed successfully',
          type: 'success',
        });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        ToastService.show({
          message: response.data?.message || 'Failed to change password',
          type: 'error',
        });
      }
    } catch (e) {
      ToastService.show({
        message: 'Failed to change password',
        type: 'error',
      });
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
          <Text style={styles.buttonText}>Update Password</Text>
        </TouchableOpacity>
        <Loader visible={loading} message="Updating password…" />
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
