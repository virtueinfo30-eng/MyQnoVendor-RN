import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import { getSession } from '../../utils/session';
import { theme } from '../../theme';

export const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const checkSession = async () => {
      // Simulate splash delay if needed, or just check session
      const session = await getSession();

      // Artificial delay for better UX (optional)
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (session && session.logged_user_id) {
        // Basic check, might want to validate token validity via API later
        if (session.logged_user_type?.toLowerCase() === 'u') {
          navigation.replace('Main', { screen: 'Search' });
        } else {
          navigation.replace('Main', { screen: 'CompanyLocation' });
        }
      } else {
        navigation.replace('Login');
      }
    };

    checkSession();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      <Image
        source={require('../../assets/images/ic_logo_splash.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white, // White background as per native design
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 330, // Adjust size as needed based on the image aspect ratio
    height: 330,
  },
});
