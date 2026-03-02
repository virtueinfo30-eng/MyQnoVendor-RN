import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Loader, ToastService } from '../../components/common';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme';
import { CustomHeader } from '../../components/common/CustomHeader';
import { getSession } from '../../utils/session';

export const ReportsScreen = ({ navigation }) => {
  const [userType, setUserType] = useState('');

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    const session = await getSession();
    if (session) {
      setUserType(session.logged_user_type || '');
    }
  };

  const reportOptions = [
    {
      id: '1',
      title: 'Reissued Tokens Reports',
      type: 'R',
      screen: 'ReportDetail',
    },
    {
      id: '2',
      title: 'Referred Tokens Reports',
      type: 'A',
      screen: 'ReportDetail',
    },
    ...(userType.toLowerCase() !== 'q' && userType.toLowerCase() !== 'l'
      ? [
          {
            id: '3',
            title: 'Request Reports by email',
            type: null,
            screen: 'RequestEReport',
          },
        ]
      : []),
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        navigation.navigate(item.screen, { reportType: item.type });
      }}
    >
      <View style={styles.menuLeft}>
        <Text style={styles.menuText}>{item.title}</Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={24}
        color={theme.colors.textLight}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Reports"
        navigation={navigation}
        showBackIcon={false}
      />
      <FlatList
        data={reportOptions}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.lightGray,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    backgroundColor: theme.colors.white,
  },
  menuLeft: {
    flex: 1,
  },
  menuText: {
    fontSize: 17,
    color: theme.colors.black,
  },
});
