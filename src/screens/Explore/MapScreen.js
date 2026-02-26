import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';

const { width, height } = Dimensions.get('window');

export const MapScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { companyName, latitude, longitude } = route.params || {};

  // Default region (if lat/long invalid, use specific coordinates or user location)
  const initialRegion = {
    latitude: parseFloat(latitude) || 23.0225,
    longitude: parseFloat(longitude) || 72.5714,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <Marker
          coordinate={{
            latitude: parseFloat(latitude) || 23.0225,
            longitude: parseFloat(longitude) || 72.5714,
          }}
          title={companyName}
          description="Company Location"
        />
      </MapView>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  map: {
    width: width,
    height: height,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    ...theme.shadows.medium,
  },
  backButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
});
