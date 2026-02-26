import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { fetchPackageList, createInvoice } from '../api/wallet';

export const PackagesTabList = ({ packageType, onBalanceUpdate }) => {
  const navigation = useNavigation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, [packageType]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const res = await fetchPackageList(packageType);
      if (res && res.found) {
        setPackages(res.listPackageInfo || []);
      } else {
        setPackages([]);
      }
    } catch (e) {
      console.error(e);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async pkg => {
    if (!pkg.net_amount || parseInt(pkg.net_amount, 10) === 0) {
      // Free package -> Create Invoice Directly
      try {
        setLoading(true);
        const res = await createInvoice(pkg.package_id);
        if (res && res.found && res.type === 'Success') {
          Alert.alert(
            'Success',
            res.message || 'Invoice created successfully.',
          );
          if (onBalanceUpdate) onBalanceUpdate(); // Refresh the top balance in WalletScreen
        } else {
          Alert.alert('Error', res?.message || 'Failed to create invoice.');
        }
      } catch (e) {
        Alert.alert('Error', 'An error occurred while creating invoice.');
      } finally {
        setLoading(false);
      }
    } else {
      // Paid package -> Open Confirm Payment Screen
      let paymentTypeLabel = 'Items';
      let packageIcon = require('../assets/images/ic_logo.png'); // fallback
      switch (packageType) {
        case 'T':
          paymentTypeLabel = 'Tokens';
          break;
        case 'S':
          paymentTypeLabel = 'SMS';
          break;
        case 'C':
          paymentTypeLabel = 'Campaigns';
          break;
        case 'D':
          paymentTypeLabel = 'Security Deposit';
          break;
      }

      navigation.navigate('ConfirmPayment', {
        packageInfo: pkg,
        paymentTypeLabel: paymentTypeLabel,
        packageIcon: packageIcon,
      });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>{item.package_name}</Text>
        <Text style={styles.amount}>
          {parseInt(item.net_amount, 10) === 0 ? 'FREE' : `₹${item.net_amount}`}
        </Text>
      </View>
      {!!item.description && (
        <Text style={styles.desc}>{item.description}</Text>
      )}
      {!!item.validity_days && (
        <Text style={styles.validity}>Validity: {item.validity_days} days</Text>
      )}
      {!!item.service_provider && (
        <Text style={styles.provider}>Provider: {item.service_provider}</Text>
      )}

      <TouchableOpacity
        style={styles.buyButton}
        onPress={() => handleBuy(item)}
      >
        <Text style={styles.buyText}>Buy</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={packages}
        renderItem={renderItem}
        keyExtractor={item =>
          item.package_id?.toString() || Math.random().toString()
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No packages found.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: theme.spacing.m },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.radius.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.light,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  amount: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  desc: { color: theme.colors.textSecondary, marginBottom: 5 },
  validity: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.small,
    marginBottom: 2,
  },
  provider: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.small,
    marginBottom: 10,
  },
  buyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    borderRadius: theme.radius.s,
    alignItems: 'center',
    marginTop: 10,
  },
  buyText: { color: theme.colors.white, fontWeight: 'bold' },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: theme.colors.textSecondary,
  },
});
