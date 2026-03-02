import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { theme } from '../../theme';
import { fetchPlacesVisited } from '../../api/user_api';
import { useNavigation } from '@react-navigation/native';
import { CustomInput } from '../../components/CustomInput';
import { CustomHeader, Loader, ToastService } from '../../components/common';

export const PlacesVisitedScreen = () => {
  const navigation = useNavigation();
  const [places, setPlaces] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [noOfPersons, setNoOfPersons] = useState('1');
  const [selectedDate, setSelectedDate] = useState('Today'); // Simplified specifically for this modal request

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadPlaces(searchText);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  const loadPlaces = async (search = '') => {
    setLoading(true);
    const result = await fetchPlacesVisited(1, 100, search);
    console.log('Places Result:', result);
    setLoading(false);

    if (result.success) {
      setPlaces(result.data);
    } else {
      setPlaces([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlaces(searchText);
    setRefreshing(false);
  };

  const handleSearch = () => {
    loadPlaces(searchText);
  };

  const handlePlaceClick = item => {
    setSelectedPlace(item);
    setNoOfPersons('1');
    setSelectedDate('Today');
    setModalVisible(true);
  };

  const handleGetToken = () => {
    setModalVisible(false);
    if (selectedPlace) {
      navigation.navigate('ConfirmToken', {
        companyLocationId: selectedPlace.company_locations_id,
        companyName: selectedPlace.company_name,
        noOfPersons: noOfPersons,
        date:
          selectedDate === 'Today'
            ? new Date().toISOString().split('T')[0]
            : selectedDate, // Handle 'Today' or specific date if picker used
      });
    }
  };

  const renderPlaceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.placeCard}
      onPress={() => handlePlaceClick(item)}
    >
      <View style={styles.placeHeader}>
        <Text style={styles.companyName}>{item.company_name}</Text>
        {item.category_name && (
          <Text style={styles.categoryBadge}>{item.category_name}</Text>
        )}
      </View>

      {item.location_name && (
        <Text style={styles.locationText}>{item.location_name}</Text>
      )}

      <View style={styles.placeDetails}>
        {item.address && (
          <Text style={styles.detailText} numberOfLines={2}>
            📍 {item.address}
          </Text>
        )}
        {item.distance && (
          <Text style={styles.detailText}>📏 {item.distance}</Text>
        )}
      </View>

      {item.last_visited_date && (
        <Text style={styles.visitedDate}>
          Last visited: {item.last_visited_date}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Loader visible={loading} />
      <CustomHeader title="Places Visited" navigation={navigation} />
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search visited places..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Places List */}
      <FlatList
        data={places}
        renderItem={renderPlaceItem}
        keyExtractor={(item, index) =>
          item.company_locations_id || `place_${index}`
        }
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyText}>
              loading ? '' : 'No places visited yet'
            </Text>
            <Text style={styles.emptySubtext}>
              Places you visit will appear here
            </Text>
          </View>
        }
      />

      {/* Get Token Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Get Token</Text>
              <Text style={styles.modalSubtitle}>
                of {selectedPlace?.company_name || 'Company'}
              </Text>
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.modalInput}
                  value={noOfPersons}
                  onChangeText={setNoOfPersons}
                  placeholder="No of Persons"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.modalInput}
                  value={selectedDate}
                  onChangeText={setSelectedDate}
                  placeholder="Date"
                  editable={false} // Read-only as per screenshot implication usually, or editable? Screenshot shows "Today". We'll keep it simple/editable for now or just display. User didn't ask for date picker in modal specifically, just fields.
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.okButton]}
                  onPress={handleGetToken}
                >
                  <Text style={styles.buttonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: theme.spacing.m,
    backgroundColor: theme.colors.white,
    gap: theme.spacing.s,
    ...theme.shadows.medium,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    fontSize: theme.fontSize.medium,
    color: theme.colors.textPrimary,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.l,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: theme.spacing.m,
  },
  placeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
    ...theme.shadows.light,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.s,
  },
  companyName: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.s,
  },
  categoryBadge: {
    fontSize: theme.fontSize.small,
    color: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.s,
  },
  locationText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.s,
    fontWeight: '500',
  },
  placeDetails: {
    marginTop: theme.spacing.s,
    paddingTop: theme.spacing.s,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  detailText: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  visitedDate: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.s,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 3,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.l,
  },
  emptyText: {
    fontSize: theme.fontSize.large,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.s,
  },
  emptySubtext: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  modalHeader: {
    backgroundColor: theme.colors.primary, // Red header
    padding: theme.spacing.l,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  modalSubtitle: {
    fontSize: theme.fontSize.small,
    color: theme.colors.white,
    opacity: 0.9,
  },
  modalBody: {
    padding: theme.spacing.l,
    backgroundColor: theme.colors.white,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.s,
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },
  modalInput: {
    height: 40,
    fontSize: theme.fontSize.medium,
    color: theme.colors.textPrimary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.s,
    gap: theme.spacing.m,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.primary, // Red as per screenshot likely? Or maybe grey. Screenshot shows red cancel too.
  },
  okButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: theme.fontSize.medium,
  },
});
