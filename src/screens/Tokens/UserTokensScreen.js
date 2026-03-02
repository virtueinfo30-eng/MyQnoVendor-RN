import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { MyTokensTab } from '../../components/MyTokensTab';
import { SharedTokensTab } from '../../components/SharedTokensTab';
import { CustomHeader, Loader, ToastService } from '../../components/common';
import { useNavigation } from '@react-navigation/native';

const TABS = [
  { key: 'myTokens', title: ' My Tokens' },
  { key: 'sharedTokens', title: 'Shared Tokens' },
];

export const UserTokensScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('myTokens');
  const [loading, setLoading] = useState(false);

  return (
    <View style={styles.container}>
      <Loader visible={loading} />
      <CustomHeader title="Tokens" navigation={navigation} />
      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel,
              ]}
            >
              {tab.title}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'myTokens' ? (
          <MyTokensTab loading={loading} setLoading={setLoading} />
        ) : (
          <SharedTokensTab loading={loading} setLoading={setLoading} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    // highlighted via indicator
  },
  tabLabel: {
    fontSize: theme.fontSize.medium,
    fontWeight: '600',
    color: theme.colors.textLightGray,
  },
  activeTabLabel: {
    color: theme.colors.white,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.white,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
});
