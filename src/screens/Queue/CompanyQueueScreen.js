import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { fetchCompanyQueues } from '../../api/company';
import { getSession } from '../../utils/session';
import { theme } from '../../theme';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { CustomHeader } from '../../components/common/CustomHeader';

export const CompanyQueueScreen = ({ navigation, route }) => {
  const { locationId, locationName, preventAutoPush, location } =
    route.params || {};
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    mobile: '',
    locMobile: '',
  });
  const [globalRwMode, setGlobalRwMode] = useState('w');
  const [userType, setUserType] = useState('');

  useEffect(() => {
    if (locationId) {
      loadQueues();
    }
  }, [locationId]);

  const loadQueues = async () => {
    try {
      const session = await getSession();
      if (session) {
        setCompanyInfo({
          name: session.company_name,
          mobile: session.logged_mobile,
          locMobile: '', // Ideally fetched or passed from the previous screen
        });
        const data = await fetchCompanyQueues(
          session.logged_company_id,
          locationId,
          session.logged_mobile,
        );
        setGlobalRwMode(session.rw_mode || 'w');
        setUserType(session.logged_user_type || '');

        if (data && Array.isArray(data.queues)) {
          setQueues(data.queues);
          if (data.queues.length > 0) {
            setCompanyInfo(prev => ({
              ...prev,
              name: data.queues[0].company_name || prev.name,
              mobile: data.queues[0].company_mobile || prev.mobile,
              locMobile: data.queues[0].location_mobile || '',
            }));
          }
          // Auto-push for single read-only queue
          if (
            !preventAutoPush &&
            data.queues.length === 1 &&
            data.queues[0].rw_mode?.toLowerCase() === 'r' &&
            data.queues[0].is_active === '1'
          ) {
            const item = data.queues[0];
            navigation.replace('CompActiveQueue', {
              queueId: item.queue_master_id,
              queueName: item.queue_name,
              locationId,
              locationName,
              compName: item.company_name || session.company_name,
              compMobile: item.company_mobile || session.logged_mobile,
              locMobile: item.location_mobile || '',
              qMobile: item.reg_mobile,
              qSTime: item.start_time,
              qETime: item.end_time,
            });
          }
        } else if (Array.isArray(data)) {
          setQueues(data);
        } else {
          setQueues([]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.infoContainer}
        onPress={() =>
          navigation.navigate('CompActiveQueue', {
            queueId: item.queue_master_id,
            queueName: item.queue_name,
            locationId,
            locationName,
            compName: companyInfo.name,
            compMobile: companyInfo.mobile,
            locMobile: companyInfo.locMobile,
            qMobile: item.reg_mobile,
            qSTime: item.start_time,
            qETime: item.end_time,
          })
        }
      >
        <Text style={styles.title}>{item.queue_name}</Text>
        <Text style={styles.detailsText}>
          {item.start_time} - {item.end_time}
        </Text>
        <Text style={styles.detailsText}>{item.reg_mobile}</Text>
        <Text
          style={[
            styles.status,
            {
              color:
                item.message_colour_code ||
                (item.is_active === '1' ? theme.colors.success : theme.colors.primary),
            },
          ]}
        >
          {item.queue_status_message ||
            (item.is_active === '1'
              ? 'Queue is active & running.'
              : 'Inactive')}
        </Text>
      </TouchableOpacity>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('CompActiveQueue', {
              locationId,
              locationName,
              queueId: item.queue_master_id,
              queueName: item.queue_name,
              compName: companyInfo.name,
              compMobile: companyInfo.mobile,
              locMobile: companyInfo.locMobile,
              qMobile: item.reg_mobile,
              qSTime: item.start_time,
              qETime: item.end_time,
            })
          }
        >
          <FontAwesome name="users" size={24} color="#d32f2f" />
        </TouchableOpacity>
        {globalRwMode.toLowerCase() === 'w' && (
          <TouchableOpacity
            style={styles.actionButton}
            disabled={userType.toLowerCase() === 'q'}
            onPress={() =>
              navigation.navigate('AddQueue', {
                locationId,
                locationName,
                queueId: item.queue_master_id,
                isUpdate: true,
                locMobile: companyInfo.locMobile,
                location,
              })
            }
          >
            <FontAwesome
              name="edit"
              size={24}
              color={userType.toLowerCase() === 'q' ? '#A9A9A9' : '#d32f2f'}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Queues"
        showBackIcon={
          userType.toLowerCase() === 'q' ? false : navigation.canGoBack()
        }
        navigation={navigation}
        showRightIcon={
          globalRwMode.toLowerCase() === 'w' && userType.toLowerCase() !== 'q'
        }
        rightIconName="add"
        rightIconPress={() =>
          navigation.navigate('AddQueue', {
            locationId,
            locationName,
            isUpdate: false,
            locMobile: companyInfo.locMobile,
            location,
          })
        }
      />
      {/* Sub-header matching CompanyLocationScreen and screenshot */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>
          {companyInfo.name}: {companyInfo.mobile}
        </Text>
        <Text style={styles.subHeaderText}>
          {locationName}: {companyInfo.locMobile}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={queues}
          renderItem={renderItem}
          keyExtractor={item => item.queue_master_id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No queues found</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white }, // White background
  subHeader: {
    backgroundColor: theme.colors.border, // Light gray background
    padding: theme.spacing.m,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  subHeaderText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.iconDark,
  },
  loader: { marginTop: theme.spacing.xl },
  list: { paddingBottom: theme.spacing.l },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    paddingRight: theme.spacing.s,
  },
  title: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.black,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: theme.fontSize.small,
    color: theme.colors.iconDark,
    marginBottom: 2,
  },
  status: {
    fontSize: theme.fontSize.small,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: theme.spacing.s,
    marginLeft: theme.spacing.s,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: theme.colors.textSecondary,
  },
});
