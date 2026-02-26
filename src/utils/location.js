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
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message:
                'This app needs access to your location to show queues nearby.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            hasPermission = true;
          }
        }

        if (hasPermission) {
          Geolocation.getCurrentPosition(
            position => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            error => {
              console.error('Location Error:', error);
              reject(error);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
          );
        } else {
          reject(new Error('Location permission denied'));
        }
      } catch (err) {
        console.error('Unexpected location error:', err);
        reject(err);
      }
    })();
  });
};
