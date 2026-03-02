import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { CustomHeader } from '../../components/common/CustomHeader';
import { Loader, ToastService } from '../../components/common';
import { theme } from '../../theme';
import { fetchActivityGrid } from '../../api/company';
import { getSession } from '../../utils/session';

export const QueueUsersScreen = ({ navigation, route }) => {
  const { queueId, queueName, locationId } = route.params || {};
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const session = await getSession();
      if (session) {
        const data = await fetchActivityGrid(
          session.logged_company_id,
          locationId,
          queueId,
        );
        console.log('data=========', data);
        // Based on native CompActivityResp, data contains listCompActivityInfo
        setUsers(data?.activitygrid_data || []);
      }
    } catch (e) {
      console.error(e);
      ToastService.show({
        message: 'Failed to load users in queue',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  const getStatusColor = status => {
    switch (status) {
      case 'B':
        return theme.colors.blue; // Called/Buzz
      case 'I':
        return theme.colors.success; // Active
      case 'A':
        return theme.colors.warning; // Arrived
      case 'N':
        return theme.colors.error; // Not Arrived
      case 'C':
        return theme.colors.textSecondary; // Cancelled
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = status => {
    switch (status) {
      case 'B':
        return 'Called';
      case 'I':
        return 'Active';
      case 'A':
        return 'Arrived';
      case 'N':
        return 'Not Arrived';
      case 'C':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.tokenBadge}>
        <Text style={styles.tokenNo}>{item.token_no}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.user_full_name}</Text>
        <Text style={styles.userSubInfo}>
          {item.persons} Persons •{' '}
          {item.distance ? `Dist: ${item.distance}` : ''}
        </Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.custom_token_status) },
        ]}
      >
        <Text style={styles.statusText}>
          {getStatusLabel(item.custom_token_status)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        title={queueName || 'Queue Users'}
        showBackIcon={true}
        navigation={navigation}
      />

      {loading && !refreshing ? (
        <Loader visible={loading} />
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={item =>
            item.company_token_id?.toString() || Math.random().toString()
          }
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No users in this queue</Text>
            </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: theme.spacing.m,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.radius.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.light,
  },
  tokenBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  tokenNo: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: theme.fontSize.large,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  userSubInfo: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 4,
    borderRadius: theme.radius.s,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.medium,
  },
});
