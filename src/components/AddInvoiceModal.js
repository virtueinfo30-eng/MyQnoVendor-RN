import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  pick,
  types,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';
import { theme } from '../theme';
import { Loader, ToastService } from './common';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const AddInvoiceModal = ({
  visible,
  onClose,
  onSubmit,
  loading,
  invoiceToEdit,
}) => {
  const [monthYear, setMonthYear] = useState('');
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [tempMonth, setTempMonth] = useState('01');
  const [tempYear, setTempYear] = useState(new Date().getFullYear().toString());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => (currentYear - 5 + i).toString());
  const months = [
    { label: 'Jan', value: '01' },
    { label: 'Feb', value: '02' },
    { label: 'Mar', value: '03' },
    { label: 'Apr', value: '04' },
    { label: 'May', value: '05' },
    { label: 'Jun', value: '06' },
    { label: 'Jul', value: '07' },
    { label: 'Aug', value: '08' },
    { label: 'Sep', value: '09' },
    { label: 'Oct', value: '10' },
    { label: 'Nov', value: '11' },
    { label: 'Dec', value: '12' },
  ];

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);

  // Animation values
  const [renderComponent, setRenderComponent] = useState(visible);
  const translateY = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setRenderComponent(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setRenderComponent(false);
      });
    }
  }, [visible, translateY, opacity]);

  React.useEffect(() => {
    if (invoiceToEdit) {
      setMonthYear(invoiceToEdit.month_year || '');
      if (invoiceToEdit.month_year) {
        const parts = invoiceToEdit.month_year.split('-');
        if (parts.length === 2) {
          setTempMonth(parts[0]);
          setTempYear(parts[1]);
        }
      }
      setAmount(invoiceToEdit.amount_by_vendor?.toString() || '');
      setNote(invoiceToEdit.note || '');
      setFile(null); // Require picking a new file or backend ignores if unset
    } else {
      setMonthYear('');
      const d = new Date();
      setTempMonth((d.getMonth() + 1).toString().padStart(2, '0'));
      setTempYear(d.getFullYear().toString());
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

  const openPicker = () => {
    if (monthYear) {
      const parts = monthYear.split('-');
      if (parts.length === 2) {
        setTempMonth(parts[0]);
        setTempYear(parts[1]);
      }
    } else {
      const d = new Date();
      setTempMonth((d.getMonth() + 1).toString().padStart(2, '0'));
      setTempYear(d.getFullYear().toString());
    }
    setShowMonthYearPicker(true);
  };

  if (!renderComponent) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[{ flex: 1, justifyContent: 'center', padding: theme.spacing.l }, { transform: [{ translateY }] }]}>
          {/* Main Form Container */}
          <View style={[styles.container, showMonthYearPicker && { display: 'none' }]}>
            <Text style={styles.title}>
              {invoiceToEdit ? 'Edit Invoice' : 'Add New Invoice'}
            </Text>

            <Text style={styles.label}>Month-Year</Text>
            <TouchableOpacity
              style={[styles.input, { justifyContent: 'center' }]}
              onPress={openPicker}
            >
              <Text style={{ color: monthYear ? theme.colors.text : theme.colors.textSecondary }}>
                {monthYear ? monthYear : "Select MM-YYYY"}
              </Text>
            </TouchableOpacity>

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
                  : invoiceToEdit && invoiceToEdit.invoice_file_name
                    ? `Current: ${invoiceToEdit.invoice_file_name} (Tap to change)`
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

          {/* Month Year Picker Overlay - shown conditionally inside the same overlay */}
          {showMonthYearPicker && (
            <View style={styles.pickerModalContainer}>
              <Text style={styles.pickerTitle}>Select Month and Year</Text>

              <View style={styles.pickerRow}>
                <ScrollView style={styles.customPickerScroll} showsVerticalScrollIndicator={false}>
                  {months.map(m => (
                    <TouchableOpacity
                      key={m.value}
                      style={[styles.pickerItem, tempMonth === m.value && styles.pickerItemActive]}
                      onPress={() => setTempMonth(m.value)}
                    >
                      <Text style={[styles.pickerItemText, tempMonth === m.value && styles.pickerItemTextActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView style={styles.customPickerScroll} showsVerticalScrollIndicator={false}>
                  {years.map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.pickerItem, tempYear === y && styles.pickerItemActive]}
                      onPress={() => setTempYear(y)}
                    >
                      <Text style={[styles.pickerItemText, tempYear === y && styles.pickerItemTextActive]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowMonthYearPicker(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => {
                    setMonthYear(`${tempMonth}-${tempYear}`);
                    setShowMonthYearPicker(false);
                  }}
                >
                  <Text style={styles.submitText}>Select</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
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
  pickerModalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.m,
    padding: theme.spacing.l,
    width: '90%',
    alignSelf: 'center',
  },
  pickerTitle: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    marginBottom: theme.spacing.m,
    color: theme.colors.text,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 180,
  },
  customPickerScroll: {
    flex: 1,
    paddingHorizontal: theme.spacing.s,
  },
  pickerItem: {
    paddingVertical: theme.spacing.m,
    alignItems: 'center',
    borderRadius: theme.radius.s,
  },
  pickerItemActive: {
    backgroundColor: theme.colors.primary + '20',
  },
  pickerItemText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
  },
  pickerItemTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.m,
  },
});
