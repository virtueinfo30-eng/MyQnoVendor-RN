import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { theme } from '../theme';
import { ToastService, Loader } from './common';
import { fetchSharedTokens, cancelSharedToken } from '../api/user_api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

export const SharedTokensTab = ({ loading, setLoading }) => {
  const [tokens, setTokens] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState('');
  const isFocused = useIsFocused();

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId && isFocused) {
      loadTokens();
      // Auto-refresh every 30 seconds, matching native Android TimeManager
      const interval = setInterval(() => {
        loadTokens();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, isFocused]);

  const loadUserId = async () => {
    try {
      const vendorSession = await AsyncStorage.getItem('vendor_session');
      if (vendorSession) {
        const userData = JSON.parse(vendorSession);
        setUserId(userData.user_master_id || userData.logged_user_id || '');
      }
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

  const loadTokens = async () => {
    if (!userId) return;
    setLoading(true);
    const result = await fetchSharedTokens(userId);
    console.log("Shared Tokens Result", result)
    setLoading(false);

    if (result.success) {
      setTokens(result.data);
    } else {
      setTokens([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTokens();
    setRefreshing(false);
  };

  const handleCancelSharedToken = async token => {
    const result = await cancelSharedToken(userId, token.user_token_shared_id);
    if (result.success) {
      ToastService.show({
        message: result.message,
        type: 'success',
        duration: 4000,
      });
      loadTokens();
    } else {
      ToastService.show({ message: result.message, type: 'error' });
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'I':
        return theme.colors.green; // Active - Green
      case 'C':
        return theme.colors.primaryDark; // Cancelled - Red
      case 'S':
        return theme.colors.blue; // Served - Blue
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'I':
        return 'Active';
      case 'C':
        return 'Cancelled';
      case 'S':
        return 'Served';
      default:
        return 'Unknown';
    }
  };

  const renderTokenItem = ({ item }) => (
    <View style={styles.tokenCard}>
      <View style={styles.tokenHeader}>
        <View>
          <Text style={styles.tokenNumber}>Token #{item.token_no}</Text>
          <Text style={styles.companyName}>{item.company_name}</Text>
          <Text style={styles.sharedBy}>
            Shared by: {item.shared_by_user_name}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.token_status) },
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusText(item.token_status)}
          </Text>
        </View>
      </View>

      <View style={styles.tokenDetails}>
        <Text style={styles.detailText}>📍 {item.location_name}</Text>
        <Text style={styles.detailText}>📅 {item.queue_date}</Text>
        <Text style={styles.detailText}>👥 {item.persons} Person(s)</Text>
      </View>

      {item.token_status === 'I' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => handleCancelSharedToken(item)}
        >
          <Text style={styles.actionButtonText}>Cancel Shared Token</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Loader visible={loading} />
      <FlatList
        data={tokens}
        renderItem={renderTokenItem}
        keyExtractor={item => item.user_token_shared_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No shared tokens found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.m,
  },
  tokenCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.light,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.m,
  },
  tokenNumber: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  companyName: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  sharedBy: {
    fontSize: theme.fontSize.small,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.s,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.small,
    fontWeight: '600',
  },
  tokenDetails: {
    marginBottom: theme.spacing.m,
  },
  detailText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  actionButton: {
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.primaryDark,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.medium,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    fontSize: theme.fontSize.large,
    color: theme.colors.textSecondary,
  },
});
