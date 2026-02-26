import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { CustomHeader, Loader, CustomAlert } from '../../components/common';
import { theme } from '../../theme';

export const ConfirmPaymentScreen = ({ route, navigation }) => {
  const { packageInfo, paymentTypeLabel, packageIcon } = route.params;
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title, message, isSuccess = false) => {
    setAlertConfig({ visible: true, title, message, isSuccess });
  };

  const handleBuyNow = async () => {
    try {
      setLoading(true);
      const response = await paymentPayUMoneyConfiguration(
        packageInfo.package_id,
      );
      setLoading(false);

      if (response && response.found) {
        navigation.navigate('WebViewPayment', {
          paymentConfiInfo: response.paymentConfiInfo,
          packageInfo: packageInfo,
        });
      } else {
        showAlert(
          'Error',
          response?.message || 'Failed to fetch payment configuration.',
        );
      }
    } catch (error) {
      setLoading(false);
      showAlert(
        'Error',
        error.message || 'An error occurred during payment configuration.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Package Detail"
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Image source={packageIcon} style={styles.icon} />
          <Text style={styles.packageName}>{packageInfo.package_name}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Qty: </Text>
            <Text style={styles.detailValue}>
              {packageInfo.token_qty} {paymentTypeLabel}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount: </Text>
            <Text style={styles.detailValue}>
              {packageInfo.currency_symbol} {packageInfo.net_amount}
            </Text>
          </View>
        </View>

        <Text style={styles.termsText}>
          By tapping 'Buy Now', you agree to our terms and conditions.
        </Text>

        <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
          <Text style={styles.buyButtonText}>Buy Now</Text>
        </TouchableOpacity>
      </ScrollView>

      {loading && <Loader />}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        isSuccess={alertConfig.isSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    ...theme.shadows.medium,
    marginBottom: 20,
  },
  icon: {
    width: 60,
    height: 60,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    width: '100%',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textDark,
  },
  termsText: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  buyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  buyButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
