import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthNavigator } from './AuthNavigator';
import { DrawerNavigator } from '../navigation/DrawerNavigator';
import { theme } from '../theme';
import { CustomHeader } from '../components/common';
import {
  CompanyQueueScreen,
  CompActiveQueueScreen,
  QueueUsersScreen,
  QueueFilterScreen,
  VendorInvoiceDetailScreen,
  AddLocationScreen,
  AddQueueScreen,
  TerminalSettingsScreen,
  WorkingHoursScreen,
  CompHolidaysListScreen,
  AddUpdateCompHolidayScreen,
  ReportDetailScreen,
  RequestEReportScreen,
  ConfirmTokenScreen,
  MapScreen,
  ContactSelectionScreen,
  NotificationScreen,
  ConfirmPaymentScreen,
  WebViewPaymentScreen,
  SearchReferCompanyScreen,
  TermsConditionsScreen,
  ViewFeedbackScreen,
} from '../screens';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Auth"
        component={AuthNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Main"
        component={DrawerNavigator}
        options={{ headerShown: false }}
      />

      <Stack.Screen name="QueueUsers" component={QueueUsersScreen} />
      <Stack.Screen
        name="TerminalSettings"
        component={TerminalSettingsScreen}
      />
      <Stack.Screen
        name="VendorInvoiceDetail"
        component={VendorInvoiceDetailScreen}
        options={{
          title: 'Invoice Detail',
        }}
      />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="RequestEReport" component={RequestEReportScreen} />
      <Stack.Screen name="ConfirmToken" component={ConfirmTokenScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen
        name="ContactSelection"
        component={ContactSelectionScreen}
      />
      <Stack.Screen
        name="Notification"
        component={NotificationScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="ConfirmPayment"
        component={ConfirmPaymentScreen}
        options={{ title: 'Confirm Payment' }}
      />
      <Stack.Screen
        name="WebViewPayment"
        component={WebViewPaymentScreen}
        options={{ title: 'Payment Processing', headerShown: false }}
      />
      <Stack.Screen
        name="SearchReferCompany"
        component={SearchReferCompanyScreen}
        options={{ title: 'Refer Company List' }}
      />
      <Stack.Screen
        name="TermsConditions"
        component={TermsConditionsScreen}
        options={{ title: 'Terms & Conditions' }}
      />
      <Stack.Screen
        name="ViewFeedback"
        component={ViewFeedbackScreen}
        options={{ title: 'Feedbacks' }}
      />
    </Stack.Navigator>
  );
};
