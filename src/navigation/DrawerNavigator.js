import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { theme } from '../theme';
import { getSession, clearSession } from '../utils/session';
import {
  CompanyLocationScreen,
  VendorInvoiceListScreen,
  WalletScreen,
  CompCustomersScreen,
  ViewFeedbackScreen,
  ReportsScreen,
  ChangePasswordScreen,
  SettingsScreen,
  ProfileScreen,
  TerminalScreen,
  InvoicesScreen,
  EditProfileScreen,
  SearchScreen,
  ScanQRCodeScreen,
  UserTokensScreen,
  SharedTokensScreen,
  PlacesVisitedScreen,
  ReferScreen,
  UserWalletInvoicesScreen,
  TermsConditionsScreen,
  QueueFilterScreen,
  AddLocationScreen,
  AddQueueScreen,
  WorkingHoursScreen,
  CompHolidaysListScreen,
  AddUpdateCompHolidayScreen,
  CompanyQueueScreen,
  CompActiveQueueScreen,
} from '../screens';
import { API_CONFIG } from '../api/config';
import { requestForDemo, getCallSupport } from '../api/company';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const CompanyStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CompanyLocation" component={CompanyLocationScreen} />
    <Stack.Screen name="CompanyQueue" component={CompanyQueueScreen} />
    <Stack.Screen name="CompActiveQueue" component={CompActiveQueueScreen} />
    <Stack.Screen name="QueueFilter" component={QueueFilterScreen} />
    <Stack.Screen name="AddLocation" component={AddLocationScreen} />
    <Stack.Screen name="AddQueue" component={AddQueueScreen} />
    <Stack.Screen name="WorkingHours" component={WorkingHoursScreen} />
    <Stack.Screen name="CompHolidaysList" component={CompHolidaysListScreen} />
    <Stack.Screen
      name="AddUpdateCompHoliday"
      component={AddUpdateCompHolidayScreen}
    />
  </Stack.Navigator>
);

const DrawerSectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const DrawerItem = ({
  label,
  icon,
  onPress,
  Component = MaterialIcons,
  active,
}) => (
  <TouchableOpacity
    style={[styles.drawerItem, active && styles.activeDrawerItem]}
    onPress={onPress}
  >
    <Component
      name={icon}
      size={24}
      color={active ? theme.colors.white : theme.colors.textSecondary}
      style={styles.drawerIcon}
    />
    <Text style={[styles.drawerLabel, active && styles.activeDrawerLabel]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const CustomDrawerContent = props => {
  const [user, setUser] = useState(null);
  const [terminalModalVisible, setTerminalModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [supportInfo, setSupportInfo] = useState({ mobile: '', skype: '' });
  const [isLoading, setIsLoading] = useState(false);

  const currentRouteName = props.state
    ? props.state.routeNames[props.state.index]
    : '';

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    const session = await getSession();
    if (session) {
      // Normalize session if it was saved as a nested response object
      if (session.listLoginInfo && Array.isArray(session.listLoginInfo)) {
        setUser({ ...session.listLoginInfo[0], ...session.listLoginInfo[1] });
      } else {
        setUser(session);
      }
    }
  };

  const handleLogout = async () => {
    await clearSession();
    props.navigation.replace('Auth');
  };

  const handleRequestDemo = async () => {
    try {
      setIsLoading(true);
      const res = await requestForDemo();
      console.log('Demo request response:', res);
      if (res && res.found) {
        Alert.alert(
          'Success',
          res.message || 'Demo request submitted successfully.',
        );
      } else {
        Alert.alert('Error', res?.message || 'Failed to request demo.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to request demo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallSupport = async () => {
    try {
      setIsLoading(true);
      const res = await getCallSupport();
      if (res && res.found) {
        setSupportInfo({ mobile: res.mobile || '', skype: res.skype || '' });
        setSupportModalVisible(true);
      } else {
        Alert.alert('Error', res?.message || 'Failed to get support info.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to get support info.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigate = screen => {
    // If navigating to a Company screen, ensure we target the Stack
    if (
      ['CompanyLocation', 'CompanyQueue', 'CompActiveQueue'].includes(screen)
    ) {
      props.navigation.navigate('CompanyStack', { screen });
    } else {
      props.navigation.navigate(screen);
    }
  };

  const BASE_URL = 'https://myqno.com/qapp/'; // Assuming production as per native code's default
  const userImage =
    user?.profile_pic || user?.company_logo || user?.user_pic
      ? {
          uri:
            BASE_URL +
            (user?.profile_pic || user?.company_logo || user?.user_pic),
        }
      : require('../assets/images/ic_logo.png');

  return (
    <View style={styles.drawerContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileRow}
          onPress={() => navigate('EditProfile')}
        >
          {userImage ? (
            <Image source={{ uri: userImage.uri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.company_name?.charAt(0) || 'V'}
              </Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.logged_user_type?.toLowerCase() === 'c'
                ? user?.company_name
                : user?.user_full_name || 'Vendor'}
            </Text>
            <Text style={styles.userMobile}>{user?.logged_mobile}</Text>
            <Text style={styles.userRole}>
              {user?.logged_user_type?.toLowerCase() === 'u'
                ? 'User'
                : user?.logged_user_type?.toLowerCase() === 'c'
                ? 'Company User'
                : user?.logged_user_type?.toLowerCase() === 'q'
                ? 'Queue User'
                : user?.logged_user_type?.toLowerCase() === 'l'
                ? 'Location User'
                : 'User'}
            </Text>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={theme.colors.white}
          />
        </TouchableOpacity>
        {user?.logged_user_type?.toLowerCase() === 'c' && (
          <View style={styles.balanceRow}>
            <Text style={styles.balanceText}>
              Token Balance :{' '}
              <Text style={styles.balanceValue}>
                {user?.available_balance_qty || '0'}
              </Text>
            </Text>
            <Text style={styles.balanceText}>
              SMS Balance :{' '}
              <Text style={styles.balanceValue}>
                {user?.available_sms_balance_qty || '0'}
              </Text>
            </Text>
          </View>
        )}
      </View>

      <ScrollView>
        {/* Vendor Account Section */}
        {user?.logged_user_type?.toLowerCase() !== 'u' && (
          <DrawerSectionHeader title="Vendor Account" />
        )}

        {user?.logged_user_type?.toLowerCase() !== 'u' && (
          <>
            <DrawerItem
              label="Location Queue"
              icon="location-on"
              Component={MaterialIcons}
              onPress={() => navigate('CompanyLocation')}
              active={currentRouteName === 'CompanyStack'}
            />

            <DrawerItem
              label="Customers"
              icon="users"
              Component={FontAwesome}
              onPress={() => navigate('Customers')}
              active={currentRouteName === 'Customers'}
            />
          </>
        )}
        {user?.logged_user_type?.toLowerCase() !== 'u' && (
          <DrawerItem
            label="Terminal"
            icon="th-large"
            Component={FontAwesome}
            onPress={() => {
              props.navigation.closeDrawer();
              setTerminalModalVisible(true);
            }}
            active={currentRouteName === 'Terminal'}
          />
        )}
        {user?.logged_user_type?.toLowerCase() === 'c' && (
          <DrawerItem
            label="Vendor Invoice"
            icon="file-text-o"
            Component={FontAwesome}
            onPress={() => navigate('VendorInvoices')}
            active={currentRouteName === 'VendorInvoices'}
          />
        )}
        {user?.logged_user_type?.toLowerCase() !== 'u' && (
          <>
            <DrawerItem
              label="Invoices"
              icon="file-text"
              Component={FontAwesome}
              onPress={() => navigate('Invoices')}
              active={currentRouteName === 'Invoices'}
            />
            <DrawerItem
              label="Reports"
              icon="clipboard" // Close match for 'Reports'
              Component={FontAwesome}
              onPress={() => navigate('Reports')}
              active={currentRouteName === 'Reports'}
            />
            {/* <DrawerItem
              label="Contacts"
              icon="contacts"
              Component={MaterialIcons}
              onPress={() => navigate('ContactSelection')}
              active={currentRouteName === 'ContactSelection'}
            /> */}
            {/* {user?.logged_user_type?.toLowerCase() === 'c' && (
              <DrawerItem
                label="Feedbacks"
                icon="feedback"
                Component={MaterialIcons}
                onPress={() => navigate('ViewFeedback')}
                active={currentRouteName === 'ViewFeedback'}
              />
            )} */}
          </>
        )}

        {/* User Account Section */}
        <DrawerSectionHeader title="User Account" />
        <DrawerItem
          label="Take Token"
          icon="home"
          Component={MaterialIcons}
          onPress={() => navigate('Search')}
          active={currentRouteName === 'Search'}
        />
        <DrawerItem
          label="Scan QR Code"
          icon="qrcode"
          Component={FontAwesome}
          onPress={() => navigate('ScanQRCode')}
          active={currentRouteName === 'ScanQRCode'}
        />
        <DrawerItem
          label="My Tokens"
          icon="money"
          Component={FontAwesome}
          onPress={() => navigate('UserTokens')}
          active={currentRouteName === 'UserTokens'}
        />
        <DrawerItem
          label="Places Visited"
          icon="heart-o"
          Component={FontAwesome}
          onPress={() => navigate('PlacesVisited')}
          active={currentRouteName === 'PlacesVisited'}
        />
        <DrawerItem
          label="Refer"
          icon="bullhorn"
          Component={FontAwesome}
          onPress={() => navigate('Refer')}
          active={currentRouteName === 'Refer'}
        />

        {/* General Section */}
        <DrawerSectionHeader title="General" />
        <DrawerItem
          label="Change Password"
          icon="key"
          Component={FontAwesome}
          onPress={() => navigate('ChangePassword')}
          active={currentRouteName === 'ChangePassword'}
        />
        <DrawerItem
          label="Settings"
          icon="cog"
          Component={FontAwesome}
          onPress={() => navigate('Settings')}
          active={currentRouteName === 'Settings'}
        />
        {user?.logged_user_type?.toLowerCase() === 'c' && (
          <DrawerItem
            label="Request For Demo/Setup"
            icon="mobile-phone"
            Component={FontAwesome}
            onPress={handleRequestDemo}
          />
        )}
        {user?.logged_user_type?.toLowerCase() !== 'u' && (
          <DrawerItem
            label="Call Support"
            icon="headset-mic"
            Component={MaterialIcons}
            onPress={handleCallSupport}
          />
        )}
        {/* <DrawerItem
          label="Terms & Conditions"
          icon="description"
          Component={MaterialIcons}
          onPress={() => navigate('TermsConditions')}
          active={currentRouteName === 'TermsConditions'}
        /> */}
        <DrawerItem
          label="Logout"
          icon="logout"
          Component={MaterialIcons}
          onPress={handleLogout}
        />

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Terminal Mode Dialog */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={terminalModalVisible}
        onRequestClose={() => setTerminalModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTerminalModalVisible(false)}
        >
          <View
            style={[styles.modalContainer, { paddingTop: theme.spacing.l }]}
          >
            <Text style={styles.modalTitle}>Switch to Terminal mode?</Text>
            <Text style={styles.modalSubtitle}>
              You needs to re-login on back to user mode.
            </Text>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setTerminalModalVisible(false);
                navigate('TerminalSettings');
              }}
            >
              <Text style={styles.modalButtonTextBlue}>Setup Terminal</Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setTerminalModalVisible(false);
                navigate('Terminal'); // Currently pointing to placeholder TerminalScreen.js
              }}
            >
              <Text style={styles.modalButtonTextBlue}>Display Terminal</Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setTerminalModalVisible(false)}
            >
              <Text style={styles.modalButtonTextBlue}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Support Dialog */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={supportModalVisible}
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSupportModalVisible(false)}
        >
          <View style={[styles.modalContainer, { width: '80%' }]}>
            <Text style={styles.supportTitle}>Call Support</Text>
            <View
              style={{
                width: '100%',
                // paddingVertical: 20,
                alignItems: 'center',
              }}
            >
              {!!supportInfo.mobile && (
                <TouchableOpacity
                  style={{
                    width: '100%',
                    padding: 15,
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  }}
                  onPress={() => Linking.openURL(`tel:${supportInfo.mobile}`)}
                >
                  <Text style={{ fontSize: 16, color: theme.colors.blue }}>
                    Call {supportInfo.mobile}
                  </Text>
                </TouchableOpacity>
              )}
              {!!supportInfo.skype && (
                <TouchableOpacity
                  style={{
                    width: '100%',
                    padding: 15,
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  }}
                  onPress={() =>
                    Linking.openURL(`skype:${supportInfo.skype}?chat`)
                  }
                >
                  <Text style={{ fontSize: 16, color: theme.colors.blue }}>
                    Skype {supportInfo.skype}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{ width: '100%', padding: 15, alignItems: 'center' }}
                onPress={() => setSupportModalVisible(false)}
              >
                <Text style={{ fontSize: 16, color: theme.colors.blue }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Loading Overlay */}
      {isLoading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme.colors.overlay,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
};

export const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="CompanyStack"
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.colors.white, // Native seems white or very light gray
          width: '80%',
        },
      }}
    >
      <Drawer.Screen
        name="CompanyStack"
        component={CompanyStack}
        options={{ title: 'Company Locations' }}
      />
      <Drawer.Screen
        name="VendorInvoices"
        component={VendorInvoiceListScreen}
        options={{ title: 'Vendor Invoices' }}
      />
      <Drawer.Screen
        name="Invoices"
        component={InvoicesScreen}
        options={{ title: 'Invoices' }}
      />
      <Drawer.Screen
        name="Terminal"
        component={TerminalScreen}
        options={{ title: 'Terminal' }}
      />
      <Drawer.Screen
        name="Customers"
        component={CompCustomersScreen}
        options={{ title: 'Customers' }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
      <Drawer.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      {/* User Account Screens */}
      <Drawer.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Drawer.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Take Token' }}
      />
      <Drawer.Screen
        name="ScanQRCode"
        component={ScanQRCodeScreen}
        options={{ title: 'Scan QR Code' }}
      />
      <Drawer.Screen
        name="UserTokens"
        component={UserTokensScreen}
        options={{ title: 'My Tokens' }}
      />
      <Drawer.Screen
        name="SharedTokens"
        component={SharedTokensScreen}
        options={{ title: 'Shared Tokens' }}
      />
      <Drawer.Screen
        name="PlacesVisited"
        component={PlacesVisitedScreen}
        options={{ title: 'Places Visited' }}
      />
      <Drawer.Screen
        name="Refer"
        component={ReferScreen}
        options={{ title: 'Refer' }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    padding: theme.spacing.l,
    backgroundColor: theme.colors.backgroundDark, // Dark background like screenshot
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.m,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
    borderWidth: 2,
    borderColor: theme.colors.gold, // Gold border like screenshot
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  userMobile: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textLight,
  },
  userRole: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textLight,
  },
  balanceRow: {
    marginTop: theme.spacing.s,
  },
  balanceText: {
    color: theme.colors.blue, // Blue for balance labels
    fontSize: theme.fontSize.small,
    fontWeight: '600',
    marginBottom: 2,
  },
  balanceValue: {
    color: theme.colors.blue,
  },
  sectionHeader: {
    backgroundColor: theme.colors.backgroundDark, // Dark gray section header
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.l,
  },
  sectionHeaderText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: theme.fontSize.medium,
  },
  supportTitle: {
    width: '100%',
    fontSize: 16,
    color: theme.colors.black,
    fontWeight: 'bold',
    textAlign: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 15,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activeDrawerItem: {
    backgroundColor: theme.colors.primary, // Red background for active
  },
  drawerIcon: {
    width: 30,
    textAlign: 'center',
    marginRight: theme.spacing.m,
  },
  drawerLabel: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.text,
  },
  activeDrawerLabel: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    width: '85%',
    // paddingTop: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  modalTitle: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.l,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.m,
  },
  modalDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    width: '100%',
  },
  modalButton: {
    width: '100%',
    paddingVertical: theme.spacing.l,
    alignItems: 'center',
  },
  modalButtonTextBlue: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.blue, // Matches the blue in the screenshot
    fontWeight: '500',
  },
});
