import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  TextInput,
} from 'react-native';
import Contacts from 'react-native-contacts';
import { theme } from '../../theme';
import { referFriends, importContacts } from '../../api/user_api';
import { CustomHeader, ToastService, Loader } from '../../components/common';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ReferScreen = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    requestContactsPermission();
  }, []);

  const requestContactsPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'This app needs access to your contacts to refer friends.',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          loadContacts();
        } else {
          ToastService.show({
            message: 'Cannot access contacts without permission',
            type: 'error',
          });
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      loadContacts();
    }
  };

  const loadContacts = () => {
    Contacts.getAll()
      .then(contactsList => {
        // Filter contacts that have phone numbers
        const contactsWithPhone = contactsList.filter(
          contact => contact.phoneNumbers && contact.phoneNumbers.length > 0,
        );
        setContacts(contactsWithPhone);
        importContactsToServer(contactsWithPhone);
      })
      .catch(error => {
        console.error('Error loading contacts:', error);
        ToastService.show({
          message: 'Failed to load contacts',
          type: 'error',
        });
      });
  };

  const importContactsToServer = async contactsList => {
    try {
      const userSession = await AsyncStorage.getItem('user_session');
      if (!userSession) return;
      const userData = JSON.parse(userSession);
      const userId = userData.logged_user_id || userData.user_master_id;
      if (!userId) return;

      const formatted = contactsList
        .map(c => ({
          mobile_number: c.phoneNumbers[0]?.number?.replace(/\D/g, '') || '',
          full_name: c.displayName || `${c.givenName} ${c.familyName}`,
        }))
        .filter(c => c.mobile_number.length > 0);

      await importContacts(userId, formatted);
      console.log('✅ [ReferScreen] Contacts imported to server');
    } catch (err) {
      console.warn('⚠️ [ReferScreen] Failed to import contacts:', err);
    }
  };

  const toggleContactSelection = contact => {
    const isSelected = selectedContacts.some(
      c => c.recordID === contact.recordID,
    );
    if (isSelected) {
      setSelectedContacts(
        selectedContacts.filter(c => c.recordID !== contact.recordID),
      );
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleRefer = async () => {
    if (selectedContacts.length === 0) {
      ToastService.show({
        message: 'Please select at least one contact to refer',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    const result = await referFriends(selectedContacts);
    setLoading(false);

    if (result.success) {
      ToastService.show({
        message: result.message,
        type: 'success',
        duration: 4000,
      });
      setSelectedContacts([]);
      navigation.goBack();
      ToastService.show({ message: result.message, type: 'error' });
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const text = searchText.toLowerCase();
    const name = (contact.displayName || contact.givenName || '').toLowerCase();
    const phone = (contact.phoneNumbers?.[0]?.number || '').toLowerCase();
    return name.includes(text) || phone.includes(text);
  });

  const renderContact = ({ item }) => {
    const isSelected = selectedContacts.some(c => c.recordID === item.recordID);
    const phoneNumber = item.phoneNumbers?.[0]?.number || 'No phone';

    return (
      <TouchableOpacity
        style={[styles.contactItem, isSelected && styles.selectedContact]}
        onPress={() => toggleContactSelection(item)}
      >
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>
            {item.displayName || item.givenName}
          </Text>
          <Text style={styles.contactPhone}>{phoneNumber}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Refer Friends" navigation={navigation} />
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          Select contacts to refer ({selectedContacts.length} selected)
        </Text>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {loading && <Loader visible={loading} />}
      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={item => item.recordID}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchText ? 'No matching contacts found' : 'No contacts found'}
            </Text>
          </View>
        }
      />

      {selectedContacts.length > 0 && (
        <TouchableOpacity
          style={styles.referButton}
          onPress={handleRefer}
          disabled={loading}
        >
          <Text style={styles.referButtonText}>
            {loading
              ? 'Sending...'
              : `Refer ${selectedContacts.length} Friend${
                  selectedContacts.length > 1 ? 's' : ''
                }`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.xlarge,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    marginTop: 12,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    padding: 10,
    borderRadius: theme.borderRadius.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: theme.fontSize.medium,
  },
  listContainer: {
    padding: theme.spacing.m,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.m,
    marginBottom: 8,
    borderRadius: theme.borderRadius.s,
    ...theme.shadows.light,
  },
  selectedContact: {
    backgroundColor: theme.colors.overlayLightGray,
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: theme.fontSize.medium,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  contactPhone: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
  },
  referButton: {
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  referButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
  },
});
