import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import { theme } from '../../theme';
import { getCompanyCategories } from '../../api/auth';
import { searchCompanies } from '../../api/user_api';
import { useNavigation } from '@react-navigation/native';
import { CustomHeader, Loader } from '../../components/common';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

export const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] =
    useState('Restaurants');

  // Filter states
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedPersons, setSelectedPersons] = useState('1');
  const [distance, setDistance] = useState(25);
  const [isExpanded, setIsExpanded] = useState(false);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock location
  const [latitude] = useState('23.0225');
  const [longitude] = useState('72.5714');
  const [locationName] = useState('Current Location');

  // Animation
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCategories();
    performSearch();
  }, []);

  const loadCategories = async () => {
    const result = await getCompanyCategories();
    console.log('Categories:', result);
    if (result.success) {
      setCategories(result.categories);
      if (result.categories.length > 0) {
        const firstCategory = result.categories[0];
        setSelectedCategoryId(firstCategory.company_category_id);
        setSelectedCategoryName(firstCategory.company_category_name);
      }
    }
  };

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    Animated.spring(animatedHeight, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  };

  const performSearch = async () => {
    setLoading(true);

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const searchParams = {
      category: selectedCategoryId || '',
      latitude,
      longitude,
      searchText,
      distance: distance.toString(),
      date: dateStr,
      persons: selectedPersons,
    };

    const result = await searchCompanies(searchParams);
    console.log('Search Result:', result);
    setLoading(false);

    if (result.success) {
      setResults(result.data);
    } else {
      setResults([]);
      if (searchText || selectedCategoryId) {
        ToastService.show({ message: result.message, type: 'info' });
      }
    }
  };

  const handleDone = () => {
    toggleExpand();
    performSearch();
  };

  const renderCompanyItem = ({ item }) => (
    <TouchableOpacity
      style={styles.companyCard}
      onPress={() => {
        console.log('Navigating with item:', item);
        ToastService.show({ message: 'Coming Soon...', type: 'info' });
        // navigation.navigate('ConfirmToken', {
        //   companyLocationId: item.company_locations_id,
        //   companyName: item.company_name,
        //   noOfPersons: selectedPersons,
        // });
      }}
    >
      <View style={styles.companyCardContent}>
        {/* Company Logo */}
        {item.company_logo && (
          <Image
            source={{ uri: `https://myqno.com/qapp/${item.company_logo}` }}
            style={styles.companyLogo}
            resizeMode="cover"
          />
        )}

        <View style={styles.companyInfo}>
          <View style={styles.companyHeader}>
            <Text style={styles.companyName}>{item.company_name}</Text>
            {item.distance && (
              <Text style={styles.distance}>{item.distance}</Text>
            )}
          </View>

          {item.location_name && (
            <Text style={styles.locationText}>{item.location_name}</Text>
          )}

          {item.category_name && (
            <Text style={styles.categoryText}>{item.category_name}</Text>
          )}

          <View style={styles.companyFooter}>
            {item.waiting_time && (
              <Text style={styles.waitingTime}>Wait: {item.waiting_time}</Text>
            )}
            {item.queue_count && (
              <Text style={styles.queueCount}>{item.queue_count} in queue</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const maxHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const personOptions = Array.from({ length: 100 }, (_, i) => ({
    label: i + 1 === 1 ? '1 Person' : `${i + 1} People`,
    value: (i + 1).toString(),
  }));

  const dateOptions = [
    { label: 'Today', value: 'Today' },
    { label: 'Tomorrow', value: 'Tomorrow' },
  ];

  return (
    <View style={styles.container}>
      <CustomHeader
        title=""
        navigation={navigation}
        showRightIcon={true}
        rightIconName="qr-code-scanner"
        rightIconPress={() => navigation.navigate('QrCodeScanner')}
      />
      {/* Location Header */}
      <View style={styles.locationHeader}>
        <TouchableOpacity style={styles.gpsIcon}>
          <Icon name="my-location" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.locationTextContainer}>
          <Icon name="location-on" size={24} color={theme.colors.white} />
          <Text style={styles.locationText}>{locationName}</Text>
        </View>
      </View>

      {/* Filter Summary Header */}
      <TouchableOpacity
        style={styles.filterSummaryHeader}
        onPress={toggleExpand}
      >
        <View style={styles.filterSummaryContent}>
          <Text style={styles.filterMainText}>
            Get {selectedCategoryName} token for {selectedPersons}{' '}
            {selectedPersons === '1' ? 'Person' : 'People'}
          </Text>
          <Text style={styles.filterSubText}>
            {selectedDate} - {distance} KM
          </Text>
        </View>

        {!isExpanded ? (
          <Text style={styles.arrowIcon}>🔽</Text>
        ) : (
          <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Expandable Filter Panel */}
      <Animated.View style={[styles.filterPanel, { maxHeight }]}>
        <View style={styles.filterContent}>
          {/* Search Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>📍 Location / Name</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter Name or Address"
              placeholderTextColor={theme.colors.textLight}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Pickers Section */}
          <View style={styles.pickersSection}>
            {/* Category Picker */}
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedCategoryId}
                  style={styles.picker}
                  dropdownIconColor={theme.colors.primary}
                  onValueChange={itemValue => {
                    setSelectedCategoryId(itemValue);
                    const category = categories.find(
                      c => c.company_category_id === itemValue,
                    );
                    if (category) {
                      setSelectedCategoryName(category.company_category_name);
                    }
                  }}
                >
                  {categories.map(cat => (
                    <Picker.Item
                      key={cat.company_category_id}
                      label={cat.company_category_name}
                      value={cat.company_category_id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Date Picker */}
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>Date</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedDate}
                  style={styles.picker}
                  dropdownIconColor={theme.colors.primary}
                  onValueChange={setSelectedDate}
                >
                  {dateOptions.map(date => (
                    <Picker.Item
                      key={date.value}
                      label={date.label}
                      value={date.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Person Picker */}
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>Persons</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedPersons}
                  style={styles.picker}
                  dropdownIconColor={theme.colors.primary}
                  onValueChange={setSelectedPersons}
                >
                  {personOptions.map(person => (
                    <Picker.Item
                      key={person.value}
                      label={person.label}
                      value={person.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* Distance Slider */}
          <View style={styles.sliderSection}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderTitle}>📏 Distance Range</Text>
              <Text style={styles.sliderValue}>{distance} KM</Text>
            </View>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>1</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={80}
                step={1}
                value={distance}
                onValueChange={setDistance}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />
              <Text style={styles.sliderLabel}>80</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Results List */}
      <FlatList
        data={results}
        renderItem={renderCompanyItem}
        keyExtractor={(item, index) => `${item.company_id}_${index}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading && <Loader visible={loading} />}
              {loading ? 'Searching...' : 'No companies found'}
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
  locationHeader: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    // paddingVertical: 12,
    paddingHorizontal: 10,
  },
  gpsIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsIconText: {
    fontSize: 24,
  },
  locationTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 40,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  locationText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.medium,
    fontWeight: '500',
    marginLeft: 5,
  },
  filterSummaryHeader: {
    backgroundColor: theme.colors.white,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterSummaryContent: {
    flex: 1,
    alignItems: 'center',
  },
  filterMainText: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  filterSubText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textPrimary,
    marginTop: 2,
    textAlign: 'center',
  },
  arrowIcon: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  doneText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.medium,
    fontWeight: '600',
  },
  filterPanel: {
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterContent: {
    padding: theme.spacing.l,
  },
  inputSection: {
    marginBottom: theme.spacing.l,
  },
  inputLabel: {
    fontSize: theme.fontSize.small,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.s,
  },
  searchInput: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    fontSize: theme.fontSize.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowcolor: theme.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    ...theme.shadows.light,
  },
  pickersSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.l,
  },
  pickerWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  pickerLabel: {
    fontSize: theme.fontSize.small,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    ...theme.shadows.light,
  },
  picker: {
    height: 120,
  },
  sliderSection: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowcolor: theme.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  sliderTitle: {
    fontSize: theme.fontSize.small,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  sliderValue: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    width: 30,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: theme.spacing.s,
  },
  listContainer: {
    padding: theme.spacing.m,
  },
  companyCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.light,
  },
  companyCardContent: {
    flexDirection: 'row',
  },
  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.s,
    marginRight: theme.spacing.m,
    backgroundColor: theme.colors.backgroundLight,
  },
  companyInfo: {
    flex: 1,
  },
  companyHeader: {
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
  distance: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
  },
  categoryText: {
    fontSize: theme.fontSize.small,
    color: theme.colors.primary,
    marginBottom: theme.spacing.s,
  },
  companyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.s,
    paddingTop: theme.spacing.s,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  waitingTime: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
  },
  queueCount: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
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
