import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Image,
  Linking,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  fetchActivityGrid,
  assignManualToken,
  fetchUserByMobileAddress,
  setTokenArrivedStatus,
  swapToken,
  reissueToken,
  sendTokenNotification,
} from '../../api/company';
import { calculateDistance } from '../../utils/distance';
import { getSession } from '../../utils/session';
import { theme } from '../../theme';
import { CustomHeader } from '../../components/common/CustomHeader';
import { Loader, ToastService } from '../../components/common';

export const CompActiveQueueScreen = ({ navigation, route }) => {
  const {
    queueId,
    queueName,
    locationId,
    locationName,
    compName,
    compMobile,
    locMobile,
    qMobile,
    qSTime,
    qETime,
  } = route.params || {};
  const [gridData, setGridData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    mobile_number: '',
    fullname: '',
    persons: '1',
  });
  const [issuing, setIssuing] = useState(false);

  // Action Modal State
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [route.params]);

  const handleMobileChange = async text => {
    setFormData(prev => ({ ...prev, mobile_number: text }));
    if (text.length === 10) {
      try {
        const userData = await fetchUserByMobileAddress(text);
        if (userData && userData.user_full_name) {
          setFormData(prev => ({ ...prev, fullname: userData.user_full_name }));
        }
      } catch (e) {
        // Silently fail or log
      }
    }
  };

  const handleIssueToken = async () => {
    if (!formData.mobile_number || !formData.fullname || !formData.persons) {
      ToastService.show({ message: 'Please fill all fields', type: 'warning' });
      return;
    }

    setIssuing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await assignManualToken({
        ...formData,
        queue_master_id: queueId,
        queue_date: today,
      });

      if (result.found) {
        ToastService.show({
          message: result.message || 'Token issued successfully',
          type: 'success',
        });
        setModalVisible(false);
        setFormData({ mobile_number: '', fullname: '', persons: '1' });
        loadData();
      } else {
        ToastService.show({
          message: result.message || 'Failed to issue token',
          type: 'error',
        });
      }
    } catch (e) {
      console.error(e);
      ToastService.show({
        message: 'An unexpected error occurred',
        type: 'error',
      });
    } finally {
      setIssuing(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const session = await getSession();
      if (session) {
        let data = await fetchActivityGrid(
          session.logged_company_id,
          locationId,
          queueId,
          route.params, // Pass all params including viewType, token_status, fromdate, etc.
        );

        // Calculate distance locally
        if (data && data.activitygrid_data) {
          const compLat = parseFloat(data.company_latitude);
          const compLon = parseFloat(data.company_longitude);

          if (!isNaN(compLat) && !isNaN(compLon)) {
            data.activitygrid_data = data.activitygrid_data.map(item => {
              const uLat = parseFloat(item.user_latitude);
              const uLon = parseFloat(item.user_longitude);
              if (!isNaN(uLat) && !isNaN(uLon)) {
                const dist = calculateDistance(compLat, compLon, uLat, uLon);
                if (dist !== null) {
                  item.computed_distance = dist.toFixed(2) + ' km';
                }
              }
              return item;
            });
          }
        }

        setGridData(data);
      }
    } catch (e) {
      console.error(e);
      ToastService.show({
        message: 'Failed to load queue activity',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetStatus = async (item, status) => {
    try {
      setLoading(true);
      const session = await getSession();
      const result = await setTokenArrivedStatus(session.logged_company_id, {
        txtctid: item.company_token_id,
        status: status, // 'A' for Arrived, 'N' for Not Arrived
      });
      if (result.found) {
        ToastService.show({ message: result.message, type: 'success' });
        loadData();
      } else {
        ToastService.show({
          message: result.message || 'Failed to update status',
          type: 'error',
        });
      }
    } catch (e) {
      console.error(e);
      ToastService.show({ message: 'Failed to update status', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async (item, newNo) => {
    try {
      setLoading(true);
      const session = await getSession();
      const result = await swapToken(
        session.logged_company_id,
        item.company_token_id,
        newNo,
      );
      if (result.found) {
        ToastService.show({ message: result.message, type: 'success' });
        loadData();
      } else {
        ToastService.show({
          message: result.message || 'Failed to swap token',
          type: 'error',
        });
      }
    } catch (e) {
      console.error(e);
      ToastService.show({ message: 'Failed to swap token', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async item => {
    try {
      setLoading(true);
      const session = await getSession();
      const result = await sendTokenNotification(session.logged_company_id, {
        txtctid: item.company_token_id,
        comp_id: session.logged_company_id,
      });
      if (result.found) {
        ToastService.show({ message: result.message, type: 'success' });
      } else {
        ToastService.show({
          message: result.message || 'Failed to send notification',
          type: 'error',
        });
      }
    } catch (e) {
      console.error(e);
      ToastService.show({
        message: 'Failed to send notification',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const todayDate = new Date().toISOString().split('T')[0];
  const balance = gridData?.balance_details?.available_balance_qty || '0';

  const getSections = data => {
    if (!data) return [];

    const order = ['B', 'I', 'A', 'N', 'C'];
    const statusMap = {
      B: 'Called',
      I: 'Active',
      A: 'Arrived',
      N: 'Not Arrived',
      C: 'Cancelled',
    };

    const sections = [];
    order.forEach(key => {
      const filtered = data.filter(item => item.custom_token_status === key);
      if (filtered.length > 0) {
        sections.push({
          title: statusMap[key],
          data: filtered,
        });
      }
    });
    return sections;
  };

  const sections = getSections(gridData?.activitygrid_data);

  const { isFilterResult, ...otherParams } = route.params || {};

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <CustomHeader
        title={isFilterResult ? 'Filter Result' : 'Active Queue'}
        showBackIcon={true}
        navigation={navigation}
        onLeftPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('CompanyQueue', {
              locationId,
              locationName,
              preventAutoPush: true,
            });
          }
        }}
        rightButtons={
          isFilterResult
            ? []
            : [
                {
                  iconName: 'people',
                  onPress: () => setModalVisible(true),
                },
                {
                  iconName: 'filter-list',
                  onPress: () =>
                    navigation.navigate('QueueFilter', {
                      queueId,
                      queueName,
                      locationId,
                      locationName,
                      compName,
                      compMobile,
                      locMobile,
                      qMobile,
                    }),
                },
              ]
        }
      />
      <ScrollView style={styles.container}>
        <View style={styles.subHeader}>
          <Text style={styles.subHeaderText}>
            {compName}: {compMobile}
          </Text>
          <Text style={styles.subHeaderText}>
            {locationName}: {locMobile}
          </Text>
          <Text style={styles.subHeaderText}>
            {queueName}: {qMobile}
          </Text>
          {!isFilterResult && (
            <>
              <Text style={styles.subHeaderText}>
                Time: {qSTime} - {qETime} Balance: {balance} Token
              </Text>
              <Text style={styles.subHeaderText}>Date: {todayDate}</Text>
            </>
          )}
        </View>

        {loading && !gridData && <Loader visible={loading} />}

        {gridData &&
        gridData.activitygrid_data &&
        gridData.activitygrid_data.length > 0 ? (
          <View style={styles.listContainer}>
            {sections.map((section, index) => (
              <View key={index}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{section.title}</Text>
                </View>
                {section.data.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.listItem}
                    onPress={() => {
                      setSelectedItem(item);
                      setActionModalVisible(true);
                    }}
                  >
                    <View style={styles.tokenCircle}>
                      <Text style={styles.tokenNo}>{item.token_no}</Text>
                    </View>

                    {/* Placeholder for User Pic - Natively uses rounded image view */}
                    <View style={styles.userPicPlaceholder}>
                      <MaterialIcons
                        name="person"
                        size={30}
                        color={theme.colors.textLight}
                      />
                    </View>

                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.user_full_name}</Text>
                      <Text style={styles.issuedTime}>{item.token_date}</Text>
                      <Text style={styles.issuedTime}>
                        Issued {item.created_datetime}
                      </Text>
                    </View>

                    <View style={styles.personCountContainer}>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Text style={styles.personCount}>{item.persons}</Text>
                        <Text style={styles.personLabel}> person</Text>
                      </View>
                    </View>

                    <MaterialIcons
                      name="more-vert"
                      size={24}
                      color={theme.colors.textLight}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        ) : !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.noDataText}>No records found</Text>
          </View>
        ) : null}

        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
            <Text style={styles.refreshText}>Refresh Status</Text>
          </TouchableOpacity>
        </View>

        {/* Issue Token Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Issue Token</Text>
                <Text style={styles.modalSubtitle}>
                  Issue manual token to person
                </Text>
              </View>

              <View style={styles.modalBody}>
                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number"
                  keyboardType="phone-pad"
                  value={formData.mobile_number}
                  onChangeText={handleMobileChange}
                  maxLength={10}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Person Name"
                  value={formData.fullname}
                  onChangeText={text =>
                    setFormData(prev => ({ ...prev, fullname: text }))
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="No of Persons"
                  keyboardType="number-pad"
                  value={formData.persons}
                  onChangeText={text =>
                    setFormData(prev => ({ ...prev, persons: text }))
                  }
                />
                <View style={[styles.input, styles.disabledInput]}>
                  <Text style={styles.inputText}>Today</Text>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.okButton]}
                  onPress={handleIssueToken}
                  disabled={issuing}
                >
                  <Text style={styles.buttonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Loader visible={issuing} message="Issuing token…" />

        {/* User Action Modal (Bottom Sheet Style) */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={actionModalVisible}
          onRequestClose={() => setActionModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.bottomSheetOverlay}
            activeOpacity={1}
            onPress={() => setActionModalVisible(false)}
          >
            <View style={styles.bottomSheetContainer}>
              <View style={styles.bottomSheetContent}>
                {selectedItem && (
                  <>
                    <View style={styles.actionHeader}>
                      <Text style={styles.actionTitle}>
                        {selectedItem.user_full_name} ({selectedItem.token_no})
                      </Text>
                      <Text style={styles.actionSubtitle}>
                        {selectedItem.queue_name}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.actionItem}
                      onPress={() => {
                        if (selectedItem.user_reg_mobile) {
                          Linking.openURL(
                            `tel:${selectedItem.user_reg_mobile}`,
                          );
                        }
                      }}
                    >
                      <Text style={styles.actionText}>
                        {selectedItem.user_reg_mobile}
                      </Text>
                    </TouchableOpacity>

                    {selectedItem.user_reg_email_id ? (
                      <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => {
                          if (selectedItem.user_reg_email_id) {
                            Linking.openURL(
                              `mailto:${selectedItem.user_reg_email_id}`,
                            );
                          }
                        }}
                      >
                        <Text style={styles.actionText}>
                          {selectedItem.user_reg_email_id}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </>
                )}
              </View>

              <TouchableOpacity
                style={styles.closeActionBtn}
                onPress={() => setActionModalVisible(false)}
              >
                <Text style={styles.closeActionText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  subHeader: {
    backgroundColor: theme.colors.border,
    padding: theme.spacing.m,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  subHeaderText: {
    fontSize: theme.fontSize.small,
    color: theme.colors.iconDark,
    textAlign: 'center',
    marginBottom: 2,
  },
  content: {
    flex: 1,
    padding: theme.spacing.l,
  },
  listContainer: {
    flex: 1,
    paddingBottom: theme.spacing.xl,
  },
  sectionHeader: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  sectionHeaderText: {
    fontWeight: 'bold',
    color: theme.colors.iconDark,
    fontSize: theme.fontSize.medium,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    backgroundColor: theme.colors.white,
  },
  tokenCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  tokenNo: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: theme.fontSize.large,
  },
  userPicPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
    backgroundColor: theme.colors.surface,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    color: theme.colors.iconDark,
    fontSize: theme.fontSize.medium,
    marginBottom: 2,
  },
  issuedTime: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.small,
  },
  personCountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.s,
  },
  personCount: {
    fontWeight: 'bold',
    color: theme.colors.iconDark,
    fontSize: theme.fontSize.small,
  },
  personLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.small,
  },
  noDataText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: 20,
  },
  emptyContainer: {
    height: 200, // Provides some space below header as seen in image
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    padding: theme.spacing.l,
  },
  refreshButton: {
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  refreshText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.l,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: 4,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  modalHeader: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.l,
    alignItems: 'center',
  },
  modalTitle: {
    color: theme.colors.white,
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: theme.colors.white,
    fontSize: theme.fontSize.small,
    marginTop: 2,
  },
  modalBody: {
    padding: theme.spacing.l,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    fontSize: theme.fontSize.medium,
    color: theme.colors.iconDark,
  },
  disabledInput: {
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
  },
  inputText: {
    color: theme.colors.iconDark,
    fontSize: theme.fontSize.medium,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.l,
  },
  modalButton: {
    flex: 1,
    padding: theme.spacing.m,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.s,
  },
  okButton: {
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.s,
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: theme.fontSize.medium,
  },
  // Bottom Sheet Action Modal Styles
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    padding: theme.spacing.xl,
  },
  bottomSheetContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: theme.spacing.m,
  },
  actionHeader: {
    padding: theme.spacing.m,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  actionTitle: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.iconDark,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  actionItem: {
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    alignItems: 'center',
  },
  actionText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.primary, // Using primary color to match the blue in screenshot closely
  },
  closeActionBtn: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: theme.spacing.m,
    alignItems: 'center',
  },
  closeActionText: {
    fontSize: theme.fontSize.medium,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});
