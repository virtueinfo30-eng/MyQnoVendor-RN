import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DocumentPicker from '@react-native-documents/picker';
import { theme } from '../theme';

export const AddInvoiceModal = ({
  visible,
  onClose,
  onSubmit,
  loading,
  invoiceToEdit,
}) => {
  const [monthYear, setMonthYear] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);

  React.useEffect(() => {
    if (invoiceToEdit) {
      setMonthYear(invoiceToEdit.month_year || '');
      setAmount(invoiceToEdit.amount_by_vendor || '');
      setNote(invoiceToEdit.note || '');
      setFile(null); // Require picking a new file or backend ignores if unset
    } else {
      setMonthYear('');
      setAmount('');
      setNote('');
      setFile(null);
    }
  }, [invoiceToEdit, visible]);

  const handleFilePick = async () => {
    try {
      const DocumentPicker = require('@react-native-documents/picker').default;
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      console.log('File Picked:', res);
      setFile(res[0]);
    } catch (err) {
      const DocumentPicker = require('@react-native-documents/picker').default;
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
      } else {
        Alert.alert('Error', 'Failed to pick file');
      }
    }
  };

  const handleSubmit = () => {
    if (!monthYear || !amount) {
      Alert.alert('Validation', 'Please fill all required fields.');
      return;
    }
    onSubmit({ monthYear, amount, note, file, id: invoiceToEdit?.id });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {invoiceToEdit ? 'Edit Invoice' : 'Add New Invoice'}
          </Text>

          <Text style={styles.label}>Month-Year (e.g. 05-2024)</Text>
          <TextInput
            style={styles.input}
            placeholder="MM-YYYY"
            value={monthYear}
            onChangeText={setMonthYear}
          />

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Note (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Note"
            value={note}
            onChangeText={setNote}
            multiline
          />

          <TouchableOpacity style={styles.fileButton} onPress={handleFilePick}>
            <Text style={styles.fileButtonText}>
              {file
                ? `File: ${file.name}`
                : invoiceToEdit
                ? 'Attach New File (Optional)'
                : 'Attach Invoice File'}
            </Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.submitText}>
                  {invoiceToEdit ? 'Update' : 'Submit'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
    padding: theme.spacing.l,
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.m,
    padding: theme.spacing.l,
  },
  title: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    marginBottom: theme.spacing.l,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  label: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.s,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    color: theme.colors.text,
  },
  fileButton: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.m,
    borderRadius: theme.radius.s,
    alignItems: 'center',
    marginBottom: theme.spacing.l,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
  },
  fileButtonText: {
    color: theme.colors.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.m,
    alignItems: 'center',
    marginRight: theme.spacing.s,
  },
  cancelText: {
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.radius.s,
    alignItems: 'center',
    marginLeft: theme.spacing.s,
  },
  submitText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
});
