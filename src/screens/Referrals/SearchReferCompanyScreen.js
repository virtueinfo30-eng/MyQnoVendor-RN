import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme';
import { CustomHeader } from '../../components/common';
import {
  searchReferCompanies,
  fetchReferQueues,
  referTokenAPI,
} from '../../api/user_api';

export const SearchReferCompanyScreen = ({ navigation, route }) => {
  const { companyName, compTokenId, companyId } = route.params || {};
  const [searchText, setSearchText] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [queues, setQueues] = useState([]);
  const [queuesLoading, setQueuesLoading] = useState(false);
  const [queueModalVisible, setQueueModalVisible] = useState(false);

  const handleSearch = async () => {
    if (searchText.length < 3) return;
    setLoading(true);
    const result = await searchReferCompanies(searchText);
    if (result.success) {
      setCompanies(result.data);
    } else {
      Alert.alert('Error', result.message);
    }
    setLoading(false);
  };

  const handleSelectCompany = async company => {
    setSelectedCompany(company);
    setQueuesLoading(true);
    setQueueModalVisible(true);
    const result = await fetchReferQueues(company.company_locations_id);
    if (result.success) {
      setQueues(result.data);
    } else {
      Alert.alert('Error', result.message);
    }
    setQueuesLoading(false);
  };

  const handleRefer = async queue => {
    const today = new Date().toISOString().split('T')[0];
    const result = await referTokenAPI(
      compTokenId,
      selectedCompany.company_id,
      queue.queue_master_id,
      today,
    );
    if (result.success) {
      Alert.alert('Success', result.message, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', result.message);
    }
    setQueueModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Refer Company List"
        showBackIcon={true}
        navigation={navigation}
      />
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Search Company..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <MaterialIcons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={companies}
          keyExtractor={item => item.company_locations_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSelectCompany(item)}
            >
              <Text style={styles.itemName}>{item.company_name}</Text>
              <Text style={styles.itemSub}>{item.location_name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Search to find companies</Text>
          }
        />
      )}

      {/* Queue Selection Modal */}
      <Modal
        visible={queueModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Queue</Text>
            {queuesLoading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <FlatList
                data={queues}
                keyExtractor={item => item.queue_master_id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.queueItem}
                    onPress={() => handleRefer(item)}
                  >
                    <Text style={styles.queueName}>{item.queue_name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text>No active queues found</Text>}
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setQueueModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchBox: {
    flexDirection: 'row',
    padding: theme.spacing.m,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    padding: 10,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    padding: 10,
    borderRadius: 4,
  },
  item: {
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  itemName: { fontWeight: 'bold', fontSize: 16 },
  itemSub: { color: theme.colors.gray, fontSize: 14 },
  empty: { textAlign: 'center', marginTop: 20, color: theme.colors.gray },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  queueItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  queueName: { fontSize: 16 },
  closeButton: {
    marginTop: 15,
    padding: 10,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  closeButtonText: { color: theme.colors.white, fontWeight: 'bold' },
});
