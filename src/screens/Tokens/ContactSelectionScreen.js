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
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme';
import { shareUserToken, importContacts } from '../../api/user_api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomHeader, Loader, ToastService } from '../../components/common';

export const ContactSelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userTokenId } = route.params;

  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'App needs access to your contacts to share tokens.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          fetchContacts();
        } else {
          ToastService.show({
            message: 'Cannot access contacts',
            type: 'error',
          });
          setLoading(false);
        }
      } catch (err) {
        console.warn(err);
        setLoading(false);
      }
    } else {
      fetchContacts();
    }
  };

  const fetchContacts = async () => {
    try {
      const allContacts = await Contacts.getAll();
      // Filter contacts with phone numbers
      const validContacts = allContacts
        .filter(c => c.phoneNumbers && c.phoneNumbers.length > 0)
        .map(c => ({
          recordID: c.recordID,
          displayName: c.displayName || `${c.givenName} ${c.familyName}`,
          phoneNumbers: c.phoneNumbers,
        }))
        .sort((a, b) =>
          (a.displayName || '').localeCompare(b.displayName || ''),
        );

      setContacts(validContacts);
      setFilteredContacts(validContacts);
      setLoading(false);

      // Import contacts to server (matching native Android behavior)
      importContactsToServer(validContacts);
    } catch (e) {
      console.log(e);
      setLoading(false);
      ToastService.show({ message: 'Failed to load contacts', type: 'error' });
    }
  };

  const importContactsToServer = async contactList => {
    try {
      const userSession = await AsyncStorage.getItem('user_session');
      if (!userSession) return;
      const userData = JSON.parse(userSession);
      const userId = userData.logged_user_id;
      if (!userId) return;

      // Format: [{mobile_number: "...", full_name: "..."}]
      const formatted = contactList
        .map(c => ({
          mobile_number: c.phoneNumbers[0]?.number?.replace(/\D/g, '') || '',
          full_name: c.displayName || '',
        }))
        .filter(c => c.mobile_number.length > 0);

      await importContacts(userId, formatted);
      console.log('✅ [ContactSelection] Contacts imported to server');
    } catch (err) {
      console.warn('⚠️ [ContactSelection] Failed to import contacts:', err);
    }
  };

  const handleSearch = text => {
    setSearch(text);
    if (text) {
      const filtered = contacts.filter(item =>
        item.displayName.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  };

  const toggleSelection = contact => {
    if (selectedContacts.some(c => c.recordID === contact.recordID)) {
      setSelectedContacts(
        selectedContacts.filter(c => c.recordID !== contact.recordID),
      );
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleShare = async () => {
    if (selectedContacts.length === 0) {
      ToastService.show({
        message: 'Please select at least one contact to share with.',
        type: 'warning',
      });
      return;
    }

    setSubmitting(true);
    // Read userId from user_session JSON (not the non-existent 'userId' key)
    const userSession = await AsyncStorage.getItem('user_session');
    const userData = userSession ? JSON.parse(userSession) : {};
    const userId = userData.logged_user_id || userData.user_master_id || '';

    // Format contacts for API: { mobile: "...", fullname: "..." }
    // Taking the first phone number for simplicity. In a real app, might let user choose.
    const contactsPayload = selectedContacts.map(c => ({
      mobile_number: c.phoneNumbers[0].number.replace(/\D/g, ''),
      full_name: c.displayName,
    }));

    const result = await shareUserToken(userId, userTokenId, contactsPayload);
    setSubmitting(false);

    if (result.success) {
      ToastService.show({
        message: 'Token shared successfully!',
        type: 'success',
        duration: 4000,
      });
      navigation.goBack();
    } else {
      ToastService.show({ message: result.message, type: 'error' });
    }
  };

  const renderContactItem = ({ item }) => {
    const isSelected = selectedContacts.some(c => c.recordID === item.recordID);
    return (
      <TouchableOpacity
        style={[styles.contactItem, isSelected && styles.selectedItem]}
        onPress={() => toggleSelection(item)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.displayName ? item.displayName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.displayName}</Text>
          <Text style={styles.contactPhone}>
            {item.phoneNumbers[0]?.number}
          </Text>
        </View>
        <View style={styles.checkbox}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loader visible={loading} message="Loading contacts…" />;
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Select Contacts"
        navigation={navigation}
        showBackIcon={true}
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Contacts"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderContactItem}
        keyExtractor={item => item.recordID}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          {selectedContacts.length} selected
        </Text>
        <TouchableOpacity
          style={[
            styles.shareButton,
            selectedContacts.length === 0 && styles.disabledButton,
          ]}
          onPress={handleShare}
          disabled={selectedContacts.length === 0 || submitting}
        >
          <Text style={styles.shareButtonText}>Share Token</Text>
        </TouchableOpacity>
        <Loader visible={submitting} message="Sharing token…" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.m,
    backgroundColor: theme.colors.white,
    ...theme.shadows.light,
  },
  backButton: {
    padding: theme.spacing.s,
  },
  backButtonText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.primary,
  },
  title: {
    fontSize: theme.fontSize.xlarge,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  searchContainer: {
    padding: theme.spacing.m,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  list: {
    paddingBottom: 100,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedItem: {
    backgroundColor: theme.colors.blueLight,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  contactPhone: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.dark,
  },
  selectedCount: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.m,
  },
  disabledButton: {
    backgroundColor: theme.colors.textSecondary,
  },
  shareButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: theme.fontSize.medium,
  },
});
