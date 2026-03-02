import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { CustomAlert } from '../../components/common';
import { theme } from '../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export const WebViewPaymentScreen = ({ route, navigation }) => {
  const { paymentConfiInfo } = route.params;
  const webViewRef = useRef(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  // Native dynamically posts parameters via standard android Intent extras to load URL.
  // In React Native `react-native-webview`, we can supply a localized HTML string with an auto-submit form to simulate native WebView `postUrl` behavior exactly across iOS and Android perfectly.
  const buildHTMLForm = () => {
    const actionUrl = paymentConfiInfo.action;

    const fields = {
      key: paymentConfiInfo.key,
      hash: paymentConfiInfo.hash,
      txnid: paymentConfiInfo.txnid,
      amount: paymentConfiInfo.amount,
      firstname: paymentConfiInfo.firstname,
      email: paymentConfiInfo.email,
      phone: paymentConfiInfo.phone,
      productinfo: paymentConfiInfo.productInfo,
      surl: paymentConfiInfo.surl,
      furl: paymentConfiInfo.furl,
      service_provider: paymentConfiInfo.service_provider || 'payu_paisa',
      logo: 'https://myqno.com/images/logo.png',
    };

    let inputs = '';
    for (const [key, value] of Object.entries(fields)) {
      inputs += `<input type="hidden" name="${key}" value="${value}" />\n`;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Loading Checkout...</title>
      </head>
      <body onload="document.forms['paymentForm'].submit()">
        <div style="display:flex; justify-content:center; align-items:center; height:100vh;">
            <h2>Loading Payment Details...</h2>
        </div>
        <form name="paymentForm" action="${actionUrl}" method="POST">
          ${inputs}
        </form>
      </body>
      </html>
    `;
  };

  const handleNavigationStateChange = navState => {
    const url = navState.url.toLowerCase();

    // Check if redirect hits success or failure URL hooks
    if (url.includes(paymentConfiInfo.surl.toLowerCase())) {
      // Navigating back cleanly on Success
      navigation.navigate('Wallet', { paymentResult: 'success' });
    } else if (url.includes(paymentConfiInfo.furl.toLowerCase())) {
      navigation.navigate('Wallet', { paymentResult: 'fail' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Secure Payment</Text>
        <View style={styles.spacer} />
      </View>

      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: buildHTMLForm() }}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        startInLoadingState={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: theme.colors.textLight,
    fontSize: 16,
  },
  title: {
    color: theme.colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
  },
  spacer: {
    width: 50, // Balances off the exact width of header item
  },
});
