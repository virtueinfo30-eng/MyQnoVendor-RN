import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { theme } from '../theme';

export const OTPDialog = ({ visible, onClose, onVerify, mobile, onResend }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter OTP');
      return;
    }

    setLoading(true);
    const success = await onVerify(otp);
    setLoading(false);

    if (success) {
      setOtp('');
      onClose();
    }
  };

  const handleResend = async () => {
    setLoading(true);
    await onResend();
    setLoading(false);
  };

  const handleClose = () => {
    setOtp('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Verify Mobile Number</Text>
          <Text style={styles.message}>An OTP has been sent to {mobile}</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.verifyButton]}
              onPress={handleVerify}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Verifying...' : 'Verify'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.resendButton]}
              onPress={handleResend}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.resendText]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.xl,
    width: '85%',
    maxWidth: 400,
  },
  title: {
    fontSize: theme.fontSize.xlarge,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.m,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.l,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.s,
    padding: theme.spacing.m,
    fontSize: theme.fontSize.medium,
    marginBottom: theme.spacing.l,
    textAlign: 'center',
    letterSpacing: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  button: {
    flex: 1,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: theme.colors.primary,
  },
  resendButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  resendText: {
    color: theme.colors.primary,
  },
  cancelButton: {
    padding: theme.spacing.s,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
  },
});
