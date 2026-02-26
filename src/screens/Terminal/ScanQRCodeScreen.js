import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';

export const ScanQRCodeScreen = () => {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to scan QR codes',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
        } else {
          Alert.alert(
            'Permission Denied',
            'Camera permission is required to scan QR codes',
          );
          navigation.goBack();
        }
      } catch (err) {
        console.warn(err);
        navigation.goBack();
      }
    } else {
      setHasPermission(true);
    }
  };

  const onReadCode = event => {
    // rawValue usually contains the string scanned
    const scannedValue = event.nativeEvent.codeStringValue;
    console.log('Scanned QR:', scannedValue);

    // Native code logic: String locationId = rawResult.getText().replace("{", "").replace("}", "").trim();
    // Assuming the QR code contains just the ID or {ID}
    let locationId = scannedValue.replace('{', '').replace('}', '').trim();

    if (locationId) {
      // Navigate to ConfirmTokenScreen with the scanned ID
      navigation.replace('ConfirmToken', {
        companyLocationId: locationId,
        companyName: 'Loading...', // Temporary name until fetched
        noOfPersons: '1',
      });
    } else {
      Alert.alert('Invalid QR', 'Could not read location ID from QR');
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting Camera Permission...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        cameraType={CameraType.Back}
        scanBarcode={true}
        onReadCode={onReadCode}
        showFrame={true}
        laserColor={theme.colors.primary}
        frameColor={theme.colors.white}
      />
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundcolor: theme.colors.black,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.overlayLight,
    borderRadius: 20,
    borderWidth: 1,
    bordercolor: theme.colors.white,
  },
  cancelButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    color: theme.colors.white,
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
  },
});
