import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../theme';
import { fetchActiveQueues, queueMeIn } from '../../api/user_api';
import { getCurrentLocation } from '../../utils/location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { CustomHeader } from '../../components/common';

export const ConfirmTokenScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {
    companyLocationId,
    companyName,
    date = new Date().toISOString().split('T')[0],
    noOfPersons,
  } = route.params || {};

  console.log('ConfirmToken Params:', route.params);

  if (!companyLocationId) {
    console.warn('Missing companyLocationId in ConfirmTokenScreen');
    // We handle this alert in loadQueues, but good to know early
  }

  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);

  useEffect(() => {
    loadQueues();
  }, []);

  const loadQueues = async () => {
    setLoading(true);
    let lat = 0;
    let long = 0;
    try {
      // Temporary debugging: Skip real location to check if it's the cause of crash
      console.log('📍 Requesting Location...');
      const location = await getCurrentLocation();
      lat = location.latitude;
      long = location.longitude;
      console.log('📍 Current Location:', lat, long);
    } catch (error) {
      console.warn('⚠️ Could not get location, checking session...', error);
      try {
        const userSession = await AsyncStorage.getItem('user_session');
        if (userSession) {
          const session = JSON.parse(userSession);
          if (session.latitude && session.longitude) {
            lat = session.latitude;
            long = session.longitude;
            console.log('📍 Using Session Location:', lat, long);
          }
        }
      } catch (sessionError) {
        console.warn('⚠️ Error reading session location:', sessionError);
      }
    }

    const result = await fetchActiveQueues(companyLocationId, date, lat, long);
    setLoading(false);

    if (result.success) {
      setQueues(result.data);
      setCompanyInfo(result.companyInfo);

      // Auto-select if only one queue
      if (result.data.length === 1) {
        setSelectedQueue(result.data[0]);
      }
    } else {
      Alert.alert('Error', result.message || 'Failed to fetch queues');
    }
  };

  const handleBookToken = async () => {
    if (!selectedQueue) {
      Alert.alert('Selection Required', 'Please select a queue first.');
      return;
    }

    setBookingLoading(true);
    const result = await queueMeIn(
      selectedQueue.queue_master_id,
      date,
      noOfPersons,
    );
    setBookingLoading(false);

    if (result.success) {
      Alert.alert('Success', result.message, [
        { text: 'OK', onPress: () => navigation.navigate('UserTokens') }, // Navigate to UserTokens on success
      ]);
    } else {
      Alert.alert('Booking Failed', result.message);
    }
  };

  const renderQueueItem = item => {
    const isSelected = selectedQueue?.queue_master_id === item.queue_master_id;
    return (
      <TouchableOpacity
        key={item.queue_master_id}
        style={[styles.queueCard, isSelected && styles.queueCardSelected]}
        onPress={() => setSelectedQueue(item)}
      >
        <View style={styles.queueHeader}>
          <Text style={[styles.queueName, isSelected && styles.textSelected]}>
            {item.queue_name}
          </Text>
          {isSelected && <View style={styles.radioButton} />}
        </View>

        <View style={styles.queueStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, isSelected && styles.textSelected]}>
              Waiting
            </Text>
            <Text style={[styles.statValue, isSelected && styles.textSelected]}>
              {item.current_waiting || '0'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, isSelected && styles.textSelected]}>
              Avg Wait
            </Text>
            <Text style={[styles.statValue, isSelected && styles.textSelected]}>
              {item.average_waiting_time || '0'} min
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Queues...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Confirm Token"
        showBackIcon={true}
        navigation={navigation}
      />
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.companyName}>
          {companyName || companyInfo?.company_name || 'Loading...'}
        </Text>
        <Text style={styles.address}>{companyInfo?.address || ''}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{date}</Text>
          <Text style={[styles.infoLabel, { marginLeft: theme.spacing.l }]}>
            Persons:
          </Text>
          <Text style={styles.infoValue}>{noOfPersons}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Select Queue</Text>
        {queues.length > 0 ? (
          queues.map(renderQueueItem)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active queues found.</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!selectedQueue || bookingLoading) && styles.bookButtonDisabled,
          ]}
          onPress={handleBookToken}
          disabled={!selectedQueue || bookingLoading}
        >
          {bookingLoading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.bookButtonText}>Get Token</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.m,
    color: theme.colors.textSecondary,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.l,
    paddingBottom: theme.spacing.xl,
  },
  companyName: {
    fontSize: theme.fontSize.xlarge,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.s,
  },
  address: {
    fontSize: theme.fontSize.small,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.spacing.m,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.overlayLight,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
  },
  infoLabel: {
    color: theme.colors.white,
    fontWeight: 'bold',
    marginRight: theme.spacing.s,
  },
  infoValue: {
    color: theme.colors.white,
  },
  mapButton: {
    marginTop: theme.spacing.m,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.overlayLight,
    borderRadius: theme.borderRadius.s,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  mapButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: theme.fontSize.small,
  },
  content: {
    flex: 1,
    padding: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.m,
  },
  queueCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderWidth: 2,
    borderColor: theme.colors.transparent,
    ...theme.shadows.light,
  },
  queueCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  queueName: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  textSelected: {
    color: theme.colors.primary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
  },
  queueStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.s,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  footer: {
    padding: theme.spacing.l,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bookButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.medium,
  },
});
