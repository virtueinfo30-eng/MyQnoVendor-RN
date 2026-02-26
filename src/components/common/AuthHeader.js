import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';
import { theme } from '../../theme';

export const AuthHeader = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.headerContainer}>
      <SafeAreaView />
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Image
            source={require('../../assets/images/ic_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.vendorText}>VENDOR</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => onTabPress('Login')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Login' && styles.activeTabText,
            ]}
          >
            Sign In
          </Text>
          {activeTab === 'Login' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => onTabPress('Signup')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Signup' && styles.activeTabText,
            ]}
          >
            Sign Up
          </Text>
          {activeTab === 'Signup' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: theme.colors.primary,
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 60,
    height: 60,
  },
  vendorText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 10,
  },
  tabBar: {
    flexDirection: 'row',
    height: 50,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    color: theme.colors.textLightGray,
    fontWeight: '600',
    fontSize: 16,
  },
  activeTabText: {
    color: theme.colors.white,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 3,
    backgroundColor: theme.colors.white,
  },
});
