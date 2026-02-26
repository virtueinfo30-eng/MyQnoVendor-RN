import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CustomHeader } from '../../components/common/CustomHeader';
import { theme } from '../../theme';

export const QueueFilterScreen = ({ navigation, route }) => {
  const {
    queueId,
    queueName,
    locationId,
    locationName,
    compName,
    compMobile,
    locMobile,
    qMobile,
  } = route.params || {};

  const filterOptions = [
    { label: 'Last Active 25 Tokens', value: '25' },
    { label: 'User Defined Filter', value: 'filter' },
  ];

  const [selectedOption, setSelectedOption] = useState(filterOptions[0]);
  const [showOptions, setShowOptions] = useState(false);

  // User Defined Filter State
  const [tokenStatus, setTokenStatus] = useState('I');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');

  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  const tokenStatusOptions = [
    { label: 'Active', value: 'I' },
    { label: 'Used', value: 'A' },
    { label: 'Not Arrived', value: 'N' },
  ];

  const handleSearch = () => {
    const searchParams = {
      ...route.params,
      viewType: selectedOption.value,
      refresh: true,
      isFilterResult: true, // Pass flag to indicate this is a search result
    };

    if (selectedOption.value === 'filter') {
      searchParams.token_status = tokenStatus;
      searchParams.fromdate = fromDate.toISOString().split('T')[0];
      searchParams.todate = toDate.toISOString().split('T')[0];
      searchParams.from_token = fromToken;
      searchParams.to_token = toToken;
    } else {
      searchParams.token_status = 'I';
      searchParams.fromdate = '';
      searchParams.todate = '';
      searchParams.from_token = '';
      searchParams.to_token = '';
    }

    navigation.push('CompActiveQueue', searchParams);
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Filter"
        showBackIcon={true}
        navigation={navigation}
      />

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>
          {compName}: {compMobile}
        </Text>
        <Text style={styles.subHeaderText}>
          {locationName}: {locMobile}
        </Text>
        <Text style={styles.subHeaderText}>
          {queueName}: {qMobile}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowOptions(true)}
        >
          <Text style={styles.dropdownText}>{selectedOption.label}</Text>
          <MaterialIcons
            name="arrow-drop-down"
            size={32}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        {selectedOption.value === 'filter' && (
          <View style={styles.userFilterSection}>
            <Text style={styles.sectionTitle}>Tokens status</Text>
            <View style={styles.radioGroup}>
              {tokenStatusOptions.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.radioButton}
                  onPress={() => setTokenStatus(opt.value)}
                >
                  <MaterialIcons
                    name={
                      tokenStatus === opt.value
                        ? 'radio-button-checked'
                        : 'radio-button-unchecked'
                    }
                    size={24}
                    color={
                      tokenStatus === opt.value ? theme.colors.primary : theme.colors.textLight
                    }
                  />
                  <Text
                    style={[
                      styles.radioLabel,
                      tokenStatus === opt.value && styles.radioLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>From Date</Text>
                <TouchableOpacity
                  style={styles.inputBox}
                  onPress={() => setShowFromDatePicker(true)}
                >
                  <MaterialIcons name="calendar-today" size={20} color={theme.colors.textLight} />
                  <Text style={styles.inputText}>
                    {fromDate.toISOString().split('T')[0]}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>To Date</Text>
                <TouchableOpacity
                  style={styles.inputBox}
                  onPress={() => setShowToDatePicker(true)}
                >
                  <MaterialIcons name="calendar-today" size={20} color={theme.colors.textLight} />
                  <Text style={styles.inputText}>
                    {toDate.toISOString().split('T')[0]}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>From Token</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="calendar-today" size={20} color={theme.colors.textLight} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Token No."
                    keyboardType="number-pad"
                    value={fromToken}
                    onChangeText={setFromToken}
                    placeholderTextColor={theme.colors.textLight}
                  />
                </View>
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.inputLabel}>To Token</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="calendar-today" size={20} color={theme.colors.textLight} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Token No."
                    keyboardType="number-pad"
                    value={toToken}
                    onChangeText={setToToken}
                    placeholderTextColor={theme.colors.textLight}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>

        {(showFromDatePicker || showToDatePicker) && (
          <DateTimePicker
            value={showFromDatePicker ? fromDate : toDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              if (showFromDatePicker) {
                setShowFromDatePicker(false);
                if (selectedDate) setFromDate(selectedDate);
              } else {
                setShowToDatePicker(false);
                if (selectedDate) setToDate(selectedDate);
              }
            }}
          />
        )}
      </ScrollView>

      <Modal
        visible={showOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={filterOptions}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    setSelectedOption(item);
                    setShowOptions(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  subHeader: {
    backgroundColor: theme.colors.border,
    padding: theme.spacing.m,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  subHeaderText: {
    fontSize: theme.fontSize.small,
    color: theme.colors.iconDark,
    textAlign: 'center',
    marginBottom: 2,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.xl,
  },
  dropdownText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.iconDark,
  },
  userFilterSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.m,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.l,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    marginLeft: theme.spacing.s,
    fontSize: theme.fontSize.medium,
    color: theme.colors.textLight,
  },
  radioLabelActive: {
    color: theme.colors.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
  },
  inputCol: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.s,
    height: 45,
    backgroundColor: theme.colors.white,
  },
  inputText: {
    marginLeft: theme.spacing.s,
    fontSize: theme.fontSize.small,
    color: theme.colors.iconDark,
  },
  textInput: {
    flex: 1,
    marginLeft: theme.spacing.s,
    fontSize: theme.fontSize.small,
    color: theme.colors.iconDark,
    padding: 0,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.l,
    borderRadius: 4,
    alignItems: 'center',
  },
  searchButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: 4,
    padding: theme.spacing.s,
    maxHeight: '50%',
  },
  optionItem: {
    padding: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  optionText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.iconDark,
  },
});
