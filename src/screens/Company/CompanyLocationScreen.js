import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { fetchCompanyLocations } from '../../api/company';
import { getSession } from '../../utils/session';
import { theme } from '../../theme';
import { CustomHeader } from '../../components/common/CustomHeader';
import { Loader, ToastService } from '../../components/common';

export const CompanyLocationScreen = ({ navigation }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState({ name: '', mobile: '' });
  const [globalRwMode, setGlobalRwMode] = useState('w');
  const [userType, setUserType] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const session = await getSession();
      if (session) {
        setCompanyInfo({
          name: session.company_name,
          mobile: session.logged_mobile,
        });
        setGlobalRwMode(session.rw_mode || 'w');
        setUserType(session.logged_user_type || '');
        const data = await fetchCompanyLocations(
          session.logged_company_id,
          session.logged_mobile,
        );
        if (data && Array.isArray(data.locations)) {
          setLocations(data.locations);
          // Auto-push for single read-only location
          if (
            data.locations.length === 1 &&
            data.locations[0].rw_mode?.toLowerCase() === 'r' &&
            data.locations[0].is_active === '1'
          ) {
            navigation.replace('CompanyQueue', {
              locationId:
                data.locations[0].location_id ||
                data.locations[0].company_locations_id,
              locationName: data.locations[0].name,
              location: data.locations[0].location_name,
            });
          }
        } else if (Array.isArray(data)) {
          // Fallback if API changes
          setLocations(data);
          if (
            data.length === 1 &&
            data[0].rw_mode?.toLowerCase() === 'r' &&
            data[0].is_active === '1'
          ) {
            navigation.replace('CompanyQueue', {
              locationId: data[0].location_id || data[0].company_locations_id,
              locationName: data[0].name,
              location: data[0].location_name,
            });
          }
        } else {
          setLocations([]);
        }
      }
    } catch (e) {
      console.error(e);
      ToastService.show({ message: 'Failed to load locations', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isActive = item.is_active === '1';
    const canEdit = item.rw_mode === 'w' || item.rw_mode === 'W';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (isActive) {
            navigation.navigate('CompanyQueue', {
              locationId: item.location_id || item.company_locations_id,
              locationName: item.name,
              location: item.location_name,
            });
          }
        }}
      >
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.address} numberOfLines={2}>
            {item.company_name} {item.address ? `, ${item.address}` : ''}
          </Text>
          <Text style={styles.mobile}>
            {item.location_mobile || item.company_mobile}
          </Text>
          {item.alert_msg ? (
            <Text style={styles.alertMsg}>{item.alert_msg}</Text>
          ) : null}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, !isActive && styles.disabledAction]}
            disabled={!isActive}
            onPress={() => {
              if (isActive) {
                navigation.navigate('CompanyQueue', {
                  locationId: item.location_id || item.company_locations_id,
                  locationName: item.name,
                  location: item.location_name,
                });
              }
            }}
          >
            <FontAwesome
              name="users"
              size={20}
              color={
                isActive ? theme.colors.primary : theme.colors.textSecondary
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, !isActive && styles.disabledAction]}
            disabled={!isActive}
            onPress={() => {
              if (isActive && item.qr_link) {
                import('react-native').then(({ Linking }) => {
                  Linking.openURL(item.qr_link);
                });
              }
            }}
          >
            <FontAwesome
              name="qrcode"
              size={20}
              color={
                isActive ? theme.colors.primary : theme.colors.textSecondary
              }
            />
          </TouchableOpacity>

          {canEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                navigation.navigate('AddLocation', { location: item });
              }}
            >
              <FontAwesome
                name="pencil-square-o"
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Company Locations"
        navigation={navigation}
        showBackIcon={false}
        showRightIcon={
          globalRwMode.toLowerCase() === 'w' && userType.toLowerCase() !== 'l'
        }
        rightIconName="add"
        rightIconPress={() => navigation.navigate('AddLocation')}
      />
      {/* Sub-header */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>
          {companyInfo.name}: {companyInfo.mobile}
        </Text>
      </View>

      {loading ? (
        <Loader visible={loading} />
      ) : (
        <FlatList
          data={locations}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            item.company_locations_id
              ? item.company_locations_id.toString()
              : index.toString()
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No locations found</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white }, // White background like native
  subHeader: {
    backgroundColor: theme.colors.backgroundLight, // Light gray
    padding: theme.spacing.m,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  subHeaderText: {
    fontWeight: 'bold',
    fontSize: theme.fontSize.medium,
    color: theme.colors.black,
  },
  loader: { marginTop: theme.spacing.xl },
  list: { paddingBottom: theme.spacing.l },
  card: {
    flexDirection: 'row',
    padding: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginRight: theme.spacing.m,
  },
  title: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.black,
    marginBottom: 4,
  },
  address: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  mobile: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textMuted,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: theme.spacing.s,
    marginLeft: theme.spacing.s,
    // Native icons are likely styled with borders or specific assets,
    // keeping it simple with just icons for now.
    // Native shows red icons.
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: theme.colors.textSecondary,
  },
});
