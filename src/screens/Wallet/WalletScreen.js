import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Loader } from '../../components/common';
import { fetchAvailableBalance } from '../../api/wallet';
import { theme } from '../../theme';
import { CustomHeader } from '../../components/common/CustomHeader';
import { PackagesTabList } from '../../components/PackagesTabList';

export const WalletScreen = ({ navigation }) => {
  const [balance, setBalance] = useState({});
  const [activeTab, setActiveTab] = useState('T');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const balData = await fetchAvailableBalance();
      if (balData) {
        setBalance(
          Array.isArray(balData) ? balData[0] : balData.walletInfo || balData,
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'T', title: 'TOKENS' },
    { key: 'S', title: 'SMS' },
    { key: 'C', title: 'CAMPAIGN' },
    { key: 'SD', title: 'SECURITY DEPOSIT' },
  ];

  return (
    <View style={styles.container}>
      <CustomHeader
        title="My Wallet"
        navigation={navigation}
        showBackIcon={false}
      />
      <View style={styles.topSection}>
        <Text style={styles.availableBalText}>Available Balance</Text>
        <View style={styles.balanceBoxes}>
          <View style={styles.balanceBox}>
            <Text style={styles.boxTitle}>TOKENS</Text>
            <Text style={styles.boxValue}>
              {balance?.available_balance_qty || '0'}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.boxTotalLabel}>
              {balance?.total_purchased_tokens || '0'}
            </Text>
          </View>
          <View style={styles.balanceBox}>
            <Text style={styles.boxTitle}>SMS</Text>
            <Text style={styles.boxValue}>
              {balance?.available_sms_balance_qty || '0'}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.boxTotalLabel}>
              {balance?.total_purchased_sms || '0'}
            </Text>
          </View>
          <View style={styles.balanceBox}>
            <Text style={styles.boxTitle}>CAMPAIGN</Text>
            <Text style={styles.boxValue}>
              {balance?.available_camgain_balance_qty || '0'}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.boxTotalLabel}>
              {balance?.total_purchased_campaign || '0'}
            </Text>
          </View>
          <View style={styles.balanceBox}>
            <Text style={styles.boxTitle}>SEC DEP</Text>
            <Text style={styles.boxValue}>
              {balance?.recurity_deposite
                ? parseInt(balance.recurity_deposite, 10)
                : '0'}
            </Text>
            <View style={styles.dividerTransparent} />
            <Text style={styles.boxTotalLabelTransparent}>0</Text>
          </View>
        </View>
        <Text style={styles.buyPackagesTitle}>Buy Packages</Text>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Loader visible={loading} />
      <PackagesTabList packageType={activeTab} onBalanceUpdate={loadData} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topSection: {
    backgroundColor: theme.colors.divider,
    padding: theme.spacing.m,
  },
  availableBalText: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
  },
  balanceBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
  },
  balanceBox: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.s,
    padding: theme.spacing.s,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  boxTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.small,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  boxValue: {
    color: theme.colors.white,
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    width: '100%',
    marginVertical: 5,
  },
  dividerTransparent: {
    height: 1,
    backgroundColor: theme.colors.transparent,
    width: '100%',
    marginVertical: 5,
  },
  boxTotalLabel: {
    color: theme.colors.border,
    fontSize: theme.fontSize.small,
    fontWeight: 'bold',
  },
  boxTotalLabelTransparent: {
    color: theme.colors.transparent,
    fontSize: theme.fontSize.small,
  },
  buyPackagesTitle: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.m,
  },
  tabContainer: {
    backgroundColor: theme.colors.divider,
    ...theme.shadows.light,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.transparent,
  },
  activeTabButton: {
    borderBottomColor: theme.colors.red,
  },
  tabText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.colors.text,
  },
});
