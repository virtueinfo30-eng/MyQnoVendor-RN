import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Loader, ToastService } from '../../components/common';
import apiClient from '../../api/client';
import { ENDPOINTS } from '../../api/config';
import { theme } from '../../theme';
import { getSession } from '../../utils/session';

export const ViewFeedbackScreen = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const session = await getSession();
      // Assuming GET viewfeedback or similar
      const response = await apiClient.get(ENDPOINTS.VIEW_FEEDBACK);
      setFeedbacks(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.rating}>{item.rating} ⭐</Text>
        <Text style={styles.date}>{item.created_at}</Text>
      </View>
      <Text style={styles.comment}>{item.comment}</Text>
      <Text style={styles.user}>- {item.user_name || 'Anonymous'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Loader visible={loading} />
      {!loading && (
        <FlatList
          data={feedbacks}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={
            <Text style={styles.empty}>No feedback received yet</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.m,
  },
  card: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.m,
    borderRadius: 8,
    marginBottom: theme.spacing.m,
    ...theme.shadows.light,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rating: { fontSize: 16, fontWeight: 'bold', color: '#FFD700' },
  date: { color: theme.colors.gray, fontSize: 12 },
  comment: { fontSize: 14, color: theme.colors.text, marginBottom: 8 },
  user: { textAlign: 'right', fontStyle: 'italic', color: theme.colors.gray },
  empty: { textAlign: 'center', marginTop: 20, color: theme.colors.gray },
});
