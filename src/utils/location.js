import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        let hasPermission = false;

        if (Platform.OS === 'ios') {
          const auth = await Geolocation.requestAuthorization('whenInUse');
          if (auth === 'granted') {
            hasPermission = true;
          }
        } else if (Platform.OS === 'android') {
          console.log(
            '📍 [utils/location] Android: Requesting Multiple Permissions...',
          );
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          ]);

          console.log(
            '📍 [utils/location] Android: Permission results:',
            granted,
          );

          const fineGranted =
            granted['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED;
          const coarseGranted =
            granted['android.permission.ACCESS_COARSE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED;

          if (fineGranted || coarseGranted) {
            hasPermission = true;
          }
        }

        if (hasPermission) {
          console.log(
            '📍 [utils/location] Permission GRANTED, calling getCurrentPosition...',
          );
          Geolocation.getCurrentPosition(
            position => {
              console.log(
                '📍 [utils/location] SUCCESS:',
                position.coords.latitude,
                position.coords.longitude,
              );
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            error => {
              console.error(
                '📍 [utils/location] ERROR:',
                error.code,
                error.message,
              );
              reject(error);
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 10000,
              showLocationDialog: false,
              forceRequestLocation: false,
            },
          );
        } else {
          console.warn('📍 [utils/location] Permission DENIED');
          reject(new Error('Location permission denied'));
        }
      } catch (err) {
        console.error('📍 [utils/location] CRITICAL ERROR:', err);
        reject(err);
      }
    })();
  });
};
