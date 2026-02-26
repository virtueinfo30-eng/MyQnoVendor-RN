import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
} from 'react-native';
import {
  viewVendorInvoice,
  downloadVendorInvoiceUrl,
} from '../../api/vendorInvoice';
import { theme } from '../../theme';
import { CustomHeader } from '../../components/common/CustomHeader';

export const VendorInvoiceDetailScreen = ({ navigation, route }) => {
  const { invoice } = route.params || {};
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoice?.id) {
      fetchDetails(invoice.id);
    }
  }, [invoice]);

  const fetchDetails = async id => {
    try {
      const res = await viewVendorInvoice(id);
      // Native app: res.VendorInvoiceData (List of 1 item usually)
      // and res.VendorPaymentData (List of payments)
      if (res) {
        setDetails(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (invoice?.id) {
      const url = downloadVendorInvoiceUrl(invoice.id);
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={styles.loader}
      />
    );
  }

  const invoiceData = details?.data?.vendor_invoice || invoice;
  const payments = details?.data?.vendor_invoice_payment || [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <CustomHeader
        title="Invoice Detail"
        showBackIcon={true}
        navigation={navigation}
      />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.header}>Invoice Details</Text>
          <DetailRow label="Month-Year" value={invoiceData?.month_year} />
          <DetailRow label="Amount" value={invoiceData?.amount_by_vendor} />
          <DetailRow label="Note" value={invoiceData?.note || 'N/A'} />
          <DetailRow
            label="Status"
            value={
              invoiceData?.approve_status_abb === 'Y'
                ? 'Approved'
                : invoiceData?.approve_status_abb === 'R'
                ? 'Rejected'
                : 'Pending'
            }
          />

          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
          >
            <Text style={styles.downloadText}>Download Invoice File</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.header}>Payment History</Text>
          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No payments recorded yet.</Text>
          ) : (
            payments.map((pay, index) => (
              <View key={index} style={styles.paymentCard}>
                <Text style={styles.paymentAmount}>₹{pay.paid_amount}</Text>
                <Text style={styles.paymentDate}>{pay.payment_date}</Text>
                <Text style={styles.paymentRef}>
                  {pay.transaction_mode} - {pay.transaction_ref_no}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}: </Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.m,
  },
  loader: { marginTop: theme.spacing.xl },
  section: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.radius.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.light,
  },
  header: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.s,
  },
  row: {
    flexDirection: 'row',
    marginBottom: theme.spacing.s,
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    width: 100,
  },
  value: {
    color: theme.colors.text,
    flex: 1,
  },
  downloadButton: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.m,
    borderRadius: theme.radius.s,
    alignItems: 'center',
    marginTop: theme.spacing.m,
  },
  downloadText: {
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  paymentCard: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.m,
    borderRadius: theme.radius.s,
    marginBottom: theme.spacing.s,
  },
  paymentAmount: {
    fontWeight: 'bold',
    fontSize: theme.fontSize.medium,
    color: theme.colors.primary,
  },
  paymentDate: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.small,
  },
  paymentRef: {
    color: theme.colors.text,
    marginTop: 4,
  },
  emptyText: {
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
  },
});
