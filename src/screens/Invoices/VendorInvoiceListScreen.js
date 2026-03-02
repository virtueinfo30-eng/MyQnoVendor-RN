import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Loader, ToastService } from '../../components/common';
import {
  deleteVendorInvoice,
  addVendorInvoice,
  updateVendorInvoice,
  downloadVendorInvoiceUrl,
} from '../../api/vendorInvoice';
import { getSession } from '../../utils/session';
import { AddInvoiceModal } from '../../components/AddInvoiceModal';
import { theme } from '../../theme';
import { CustomHeader } from '../../components/common/CustomHeader';

export const VendorInvoiceListScreen = ({ navigation }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const session = await getSession();
      setUserSession(session);
      if (session?.logged_company_id) {
        // NOTE: Native app uses 'company_master_id' or 'logged_user_id' depending on structure
        // Client.js sends logged_company_id in headers, but list API might take ID in URL
        await fetchInvoices(session.logged_company_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async companyId => {
    try {
      const responseData = await fetchVendorInvoiceList(companyId);
      console.log('responseData', responseData);
      // Native app returns list in responseData.data (VendorInvoiceResp maps data -> listInvoiceInfo)
      if (Array.isArray(responseData)) {
        setInvoices(responseData);
      } else if (Array.isArray(responseData?.data)) {
        setInvoices(responseData.data);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      ToastService.show({ message: 'Failed to fetch invoices', type: 'error' });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (userSession?.logged_company_id) {
      await fetchInvoices(userSession.logged_company_id);
    }
    setRefreshing(false);
  };

  const handleAddInvoice = async formData => {
    setSubmitting(true);
    try {
      let res;
      if (formData.id) {
        // Edit mode
        res = await updateVendorInvoice(
          formData.id,
          formData.monthYear,
          formData.file,
          formData.amount,
          formData.note,
        );
      } else {
        // Add mode
        res = await addVendorInvoice(
          formData.monthYear,
          formData.file,
          formData.amount,
          formData.note,
          userSession?.logged_company_id,
        );
      }
      if (res && res.type === 'SUCCESS') {
        ToastService.show({
          message: `Invoice ${formData.id ? 'updated' : 'added'} successfully`,
          type: 'success',
        });
        setModalVisible(false);
        setEditingInvoice(null);
        handleRefresh();
      } else {
        ToastService.show({
          message: res?.message || 'Failed to add invoice',
          type: 'error',
        });
      }
    } catch (e) {
      ToastService.show({ message: 'Failed to submit invoice', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async invoiceId => {
    try {
      await deleteVendorInvoice(invoiceId);
      ToastService.show({ message: 'Invoice deleted', type: 'success' });
      handleRefresh();
    } catch (e) {
      ToastService.show({ message: 'Failed to delete invoice', type: 'error' });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.monthText}>{item.month_year}</Text>
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() =>
            navigation.navigate('VendorInvoiceDetail', { invoice: item })
          }
        >
          <Text style={styles.detailButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={styles.amountLabel}>Amount: </Text>
        <Text style={styles.amountText}>{item.amount_by_vendor}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.statusLabel}>Status: </Text>
        <Text
          style={[
            styles.statusText,
            item.approve_status_abb === 'Y'
              ? styles.statusApproved
              : styles.statusPending,
          ]}
        >
          {item.approve_status_abb === 'Y'
            ? 'Approved'
            : item.approve_status_abb === 'R'
            ? 'Rejected'
            : 'Pending'}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setEditingInvoice(item);
            setModalVisible(true);
          }}
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => {
            import('react-native').then(({ Linking }) => {
              Linking.openURL(downloadVendorInvoiceUrl(item.id));
            });
          }}
        >
          <Text style={styles.downloadText}>Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Vendor Invoices"
        navigation={navigation}
        showBackIcon={false}
        rightIconName="add"
        rightIconPress={() => {
          setEditingInvoice(null);
          setModalVisible(true);
        }}
      />
      {loading ? (
        <Loader visible={loading} />
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderItem}
          keyExtractor={item =>
            item.id ? item.id.toString() : Math.random().toString()
          }
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No invoices found</Text>
          }
        />
      )}

      {/* <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingInvoice(null);
          setModalVisible(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity> */}

      <AddInvoiceModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingInvoice(null);
        }}
        onSubmit={handleAddInvoice}
        loading={submitting}
        invoiceToEdit={editingInvoice}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
  listContent: {
    padding: theme.spacing.m,
    paddingBottom: 80, // space for FAB
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.radius.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.light,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  monthText: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  detailButton: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.l,
  },
  detailButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: theme.fontSize.small,
  },
  amountLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.medium,
  },
  amountText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
  },
  statusLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.medium,
  },
  statusText: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
  },
  statusApproved: { color: theme.colors.primary },
  statusPending: { color: theme.colors.warning },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.s,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.s,
  },
  editButton: {
    padding: theme.spacing.s,
    marginRight: theme.spacing.s,
  },
  editText: {
    color: theme.colors.blue,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: theme.spacing.s,
    marginRight: theme.spacing.s,
  },
  deleteText: {
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  downloadButton: {
    padding: theme.spacing.s,
  },
  downloadText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.l,
    right: theme.spacing.l,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  fabText: {
    fontSize: 32,
    color: theme.colors.white,
    marginTop: -4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    color: theme.colors.textSecondary,
  },
});
