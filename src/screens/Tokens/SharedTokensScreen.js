import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { theme } from '../../theme';
import { fetchSharedTokens, cancelSharedToken } from '../../api/user_api';
import { CustomHeader, ToastService, Loader } from '../../components/common';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SharedTokensScreen = () => {
  const navigation = useNavigation();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (userId) {
      loadTokens();
    }
  }, [userId]);

  const loadSession = async () => {
    try {
      const userSession = await AsyncStorage.getItem('user_session');
      if (userSession) {
        const userData = JSON.parse(userSession);
        setUserId(userData.user_master_id || userData.logged_user_id || '');
      }
    } catch (e) {
      console.error('Session load error:', e);
      ToastService.show({ message: 'An error occurred', type: 'error' });
    }
  };

  const loadTokens = async () => {
    if (!userId) return;
    setLoading(true);
    const result = await fetchSharedTokens(userId);
    setLoading(false);

    if (result.success) {
      setTokens(result.data);
    } else {
      // Quietly fail or show empty
      setTokens([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const result = await fetchSharedTokens();
    setRefreshing(false);
    if (result.success) {
      setTokens(result.data);
    }
  };

  const handleCancel = async token => {
    const result = await cancelSharedToken(userId, token.user_token_shared_id);
    if (result.success) {
      ToastService.show({ message: result.message, type: 'success' });
      loadTokens();
    } else {
      ToastService.show({ message: result.message, type: 'error' });
    }
  };

  const renderTokenItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.companyName}>{item.company_name}</Text>
        <View
          style={[
            styles.statusBadge,
            item.token_status === 'I'
              ? styles.statusActive
              : styles.statusInactive,
          ]}
        >
          <Text style={styles.statusText}>
            {item.token_status === 'I' ? 'Active' : 'Expired'}
          </Text>
        </View>
      </View>

      <Text style={styles.queueName}>{item.queue_name}</Text>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Token No</Text>
          <Text style={styles.detailValue}>{item.token_no}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{item.queue_date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Waiting</Text>
          <Text style={styles.detailValue}>{item.current_waiting}</Text>
        </View>
      </View>

      <Text style={styles.sharedBy}>
        Shared by: {item.shared_by_name || 'Unknown'}
      </Text>

      {item.token_status === 'I' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancel(item)}
          >
            <Text style={styles.cancelButtonText}>Remove Token</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader title="Shared Tokens" navigation={navigation} />
      {loading && <Loader visible={loading} />}
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
            <Text style={styles.emptyIcon}>🎟️</Text>
            <Text style={styles.emptyText}>No shared tokens found</Text>
            <Text style={styles.emptySubtext}>
              Tokens shared with you will appear here
            </Text>
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
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    elevation: 2,
    shadowcolor: theme.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  companyName: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.s,
  },
  statusActive: {
    backgroundColor: theme.colors.greenLight,
  },
  statusInactive: {
    backgroundColor: theme.colors.redLight,
  },
  statusText: {
    fontSize: theme.fontSize.small,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  queueName: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.m,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  sharedBy: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.s,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.s,
  },
  cancelButton: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    backgroundColor: theme.colors.redLight,
    borderRadius: theme.borderRadius.s,
  },
  cancelButtonText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.small,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.m,
  },
  emptyText: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.s,
  },
  emptySubtext: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
  },
});
