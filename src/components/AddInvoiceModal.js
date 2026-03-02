import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  pick,
  types,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';
import { theme } from '../theme';
import { Loader, ToastService } from './common';

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
      const res = await pick({
        type: [types.allFiles],
      });
      console.log('File Picked:', res);
      setFile(res[0]);
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        // User cancelled the picker - do nothing
      } else {
        console.log('Error picking file:', err);
        ToastService.show({ message: 'Failed to pick file', type: 'error' });
      }
    }
  };

  const handleSubmit = () => {
    if (!monthYear || !amount) {
      ToastService.show({
        message: 'Please fill all required fields.',
        type: 'warning',
      });
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
              <>
                <Text style={styles.submitText}>
                  {invoiceToEdit ? 'Update' : 'Submit'}
                </Text>
                <Loader visible={loading} />
              </>
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
    backgroundColor: theme.colors.backgroundLight,
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
