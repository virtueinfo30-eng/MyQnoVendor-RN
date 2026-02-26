import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  Linking,
} from 'react-native';
import { fetchCompanyCustomers } from '../../api/company';
import { getSession } from '../../utils/session';
import { theme } from '../../theme';
import { API_CONFIG } from '../../api/config';
import { CustomHeader } from '../../components/common/CustomHeader';

export const CompCustomersScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Action Modal State
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const session = await getSession();
      if (session) {
        // Note: fetchCompanyCustomers might need checking response structure
        const data = await fetchCompanyCustomers(
          session.logged_company_id,
          1,
          search,
        );
        setCustomers(Array.isArray(data?.contacts) ? data.contacts : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const defaultAvatar = 'V';
    const initName = item.full_name
      ? item.full_name.charAt(0).toUpperCase()
      : defaultAvatar;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSelectedItem(item);
          setActionModalVisible(true);
        }}
      >
        {item.user_pic ? (
          <Image
            source={{ uri: `${API_CONFIG.BASE_URL}${item.user_pic}` }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{initName}</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.name}>{item.full_name || 'Unknown User'}</Text>
          <Text style={styles.mobile}>
            {item.primary_mobile || 'No Number'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Customers"
        navigation={navigation}
        showBackIcon={false}
      />
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Customers..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadCustomers}
        />
      </View>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={customers}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No customers found</Text>
          }
        />
      )}

      {/* User Action Modal (Bottom Sheet Style) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={actionModalVisible}
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.bottomSheetOverlay}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetContent}>
              {selectedItem && (
                <>
                  <View style={styles.actionHeader}>
                    <Text style={styles.actionTitle}>
                      {selectedItem.full_name}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => {
                      if (selectedItem.primary_mobile) {
                        Linking.openURL(`tel:${selectedItem.primary_mobile}`);
                      }
                    }}
                  >
                    <Text style={styles.actionText}>
                      {selectedItem.primary_mobile}
                    </Text>
                  </TouchableOpacity>

                  {selectedItem.primary_email_id ? (
                    <TouchableOpacity
                      style={styles.actionItem}
                      onPress={() => {
                        if (selectedItem.primary_email_id) {
                          Linking.openURL(
                            `mailto:${selectedItem.primary_email_id}`,
                          );
                        }
                      }}
                    >
                      <Text style={styles.actionText}>
                        {selectedItem.primary_email_id}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.closeActionBtn}
              onPress={() => setActionModalVisible(false)}
            >
              <Text style={styles.closeActionText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchContainer: {
    padding: theme.spacing.m,
    backgroundColor: theme.colors.surface,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.s,
    padding: theme.spacing.m,
  },
  loader: { marginTop: theme.spacing.xl },
  list: { padding: theme.spacing.m },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.radius.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.light,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.m,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  mobile: { color: theme.colors.textSecondary, marginTop: 4 },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: theme.colors.textSecondary,
  },
  // Bottom Sheet Action Modal Styles
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    padding: theme.spacing.xl,
  },
  bottomSheetContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: theme.spacing.m,
  },
  actionHeader: {
    padding: theme.spacing.m,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  actionTitle: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.iconDark,
    textAlign: 'center',
  },
  actionItem: {
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    alignItems: 'center',
  },
  actionText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.primary, // Using primary color to match the blue in screenshot closely
  },
  closeActionBtn: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: theme.spacing.m,
    alignItems: 'center',
  },
  closeActionText: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});
