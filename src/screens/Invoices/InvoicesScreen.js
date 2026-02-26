import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/config';
import { getSession } from '../../utils/session';
import { theme } from '../../theme';
import { CustomHeader } from '../../components/common/CustomHeader';

export const InvoicesScreen = ({ navigation }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    await fetchInvoices();
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  const fetchInvoices = async () => {
    try {
      const session = await getSession();
      if (!session) return;

      // The native app uses FETCH_WALLET_INVOICES (api/wallet/fetchinvoice/0) for 'Vendor'
      // vs 'FetchUserInvoice' for 'c'
      const userType = session.logged_user_type;
      let url = ENDPOINTS.FETCH_WALLET_INVOICES;
      // If userType is 'c', it would use another URL, assuming we use the wallet one for vendors.

      const response = await apiClient.get(url);

      if (response.data && response.data.listInvoiceInfo) {
        setInvoices(response.data.listInvoiceInfo);
      } else if (Array.isArray(response.data)) {
        setInvoices(response.data);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Fetch Invoices Error:', error);
      Alert.alert('Error', 'Failed to fetch invoices');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (item.invoice_link) {
          import('react-native').then(({ Linking }) => {
            Linking.openURL(item.invoice_link);
          });
        }
      }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.invoiceNo}>Invoice #{item.id}</Text>
        <Text style={styles.dateText}>{item.cr_date}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.detailText}>
          Subscription: {item.subscription_name || 'N/A'}
        </Text>
        <Text style={styles.detailText}>
          Amount: {item.invoice_amount || '0'}
        </Text>
        <Text style={styles.detailText}>
          Status: {item.payment_status || 'Paid'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Invoices"
        navigation={navigation}
        showBackIcon={false}
      />
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderItem}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No invoices found</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
  listContent: {
    padding: theme.spacing.m,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.radius.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.light,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.s,
  },
  invoiceNo: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  dateText: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
  },
  cardContent: {
    marginTop: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fontSize.small,
    color: theme.colors.text,
    marginBottom: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    color: theme.colors.textSecondary,
  },
});
