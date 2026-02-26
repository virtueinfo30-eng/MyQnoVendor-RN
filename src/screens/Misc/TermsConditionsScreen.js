import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CustomHeader } from '../../components/common';
import { theme } from '../../theme';

export const TermsConditionsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <CustomHeader title="Terms & Conditions" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms and Conditions</Text>
        <Text style={styles.text}>
          Welcome to MyQno. By using our service, you agree to comply with and
          be bound by the following terms and conditions of use...
        </Text>
        <Text style={styles.subtitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By accessing or using the MyQno application, you acknowledge that you
          have read, understood, and agree to be bound by these Terms.
        </Text>
        {/* Add more sections as needed matching native app content */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.m,
  },
  title: {
    fontSize: theme.fontSize.xlarge,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.m,
  },
  subtitle: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  text: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.m,
  },
});
