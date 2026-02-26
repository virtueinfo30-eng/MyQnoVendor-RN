import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CustomHeader } from '../../components/common';
import { fetchTokensReport } from '../../api/reports';
import { getSession } from '../../utils/session';
import { theme } from '../../theme';

const ReportItem = ({ item }) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <Text style={styles.userName}>{item.user_full_name}</Text>
      <Text style={styles.userMobile}>({item.user_reg_mobile})</Text>
    </View>

    <View style={styles.divider} />

    <View style={styles.contentRow}>
      <View style={styles.column}>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{item.location_name}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.label}>Queue</Text>
        <Text style={styles.value}>{item.queue_name}</Text>
      </View>
    </View>

    <View style={styles.contentRow}>
      <View style={styles.column}>
        <Text style={styles.label}>Token No</Text>
        <Text style={styles.value}>#{item.token_no}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>{item.token_date}</Text>
      </View>
    </View>

    {item.referred_by_location_name ? (
      <>
        <View style={styles.subHeader}>
          <Text style={styles.subHeaderText}>Referred From</Text>
        </View>
        <View style={styles.contentRow}>
          <View style={styles.column}>
            <Text style={styles.label}>Loc</Text>
            <Text style={styles.value}>{item.referred_by_location_name}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Que</Text>
            <Text style={styles.value}>{item.referred_by_queue_name}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Token</Text>
            <Text style={styles.value}>#{item.referred_by_token_no}</Text>
          </View>
        </View>
      </>
    ) : null}
  </View>
);

export const ReportDetailScreen = ({ navigation, route }) => {
  const { reportType } = route.params;
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const title =
    reportType === 'A' ? 'Referred Tokens Reports' : 'Reissued Tokens Reports';

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const session = await getSession();
      if (!session) return;

      const response = await fetchTokensReport({
        report_type: reportType,
        company_id: session.logged_company_id,
        company_locations_id: '',
        queue_master_id: '',
        from_date: '',
        to_date: '',
      });

      if (response.found) {
        setReports(response.reports || []);
      } else {
        Alert.alert('Info', response.message || 'No reports found');
      }
    } catch (error) {
      console.error('Load Reports Error:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title={title}
        navigation={navigation}
        showBackIcon={true}
        onBackPress={() => navigation.goBack()}
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={({ item }) => <ReportItem item={item} />}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No reports available</Text>
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
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 10,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    ...theme.shadows.light,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.iconDark,
  },
  userMobile: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginBottom: 10,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: theme.colors.iconGray,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: theme.colors.iconDark,
    fontWeight: '500',
  },
  subHeader: {
    backgroundColor: '#F9F9F9',
    padding: 5,
    marginBottom: 8,
    borderRadius: 4,
  },
  subHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
});
