import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Share,
  Modal,
  TextInput,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { theme } from '../theme';
import { ToastService, Loader } from './common';
import { fetchMyTokens, cancelToken, addFeedback } from '../api/user_api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { getCurrentLocation } from '../utils/location';

export const MyTokensTab = ({ loading, setLoading }) => {
  const navigation = useNavigation();
  const [tokens, setTokens] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  // Feedback State
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);

  const isMounted = useRef(true);
  const permissionRequestInProgress = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    console.log('🔄 [MyTokensTab] Mounting...');
    loadUserId();
    // Small delay to ensure Activity is ready for permission dialog
    setTimeout(() => {
      if (isMounted.current) {
        requestLocationPermission();
      }
    }, 1000);

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (userId) {
      loadTokens();
      // Auto-refresh every 30 seconds, matching native Android TimeManager
      const interval = setInterval(() => {
        loadTokens();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadUserId = async () => {
    try {
      const userSession = await AsyncStorage.getItem('user_session');
      if (userSession) {
        const userData = JSON.parse(userSession);
        console.log('User session data:', userData);
        const id = userData.user_master_id || userData.logged_user_id || '';
        console.log('Using user ID:', id);
        setUserId(id);
      }
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };
  const requestLocationPermission = async () => {
    if (permissionRequestInProgress.current) {
      console.log(
        '📍 [MyTokensTab] Permission request already in progress, skipping...',
      );
      return;
    }

    console.log(
      '📍 [MyTokensTab] requestLocationPermission START (via utility)',
    );
    permissionRequestInProgress.current = true;

    try {
      const location = await getCurrentLocation();
      console.log('📍 [MyTokensTab] Utility returned location:', location);

      if (isMounted.current && location) {
        setUserLocation({
          lat: location.latitude,
          lng: location.longitude,
        });
      }
    } catch (err) {
      console.error('📍 [MyTokensTab] Error using location utility:', err);
      if (isMounted.current) {
        ToastService.show({
          message:
            'Unable to get current location. Please check your GPS settings.',
          type: 'warning',
        });
      }
    } finally {
      permissionRequestInProgress.current = false;
    }
  };

  const getDistance = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
  };

  const loadTokens = async () => {
    console.log('Loading tokens for userId:', userId);
    setLoading(true);
    const result = await fetchMyTokens(userId);
    console.log(
      '🔍 [MyTokensTab] Fetch Result:',
      JSON.stringify(result, null, 2),
    );
    setLoading(false);

    if (result.success) {
      // Sort: Active tokens (I) first, then others
      const active = result.data.filter(t => t.token_status === 'I');
      const others = result.data.filter(t => t.token_status !== 'I');
      setTokens([...active.reverse(), ...others.reverse()]);
    } else {
      setTokens([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTokens();
    setRefreshing(false);
  };

  const handleCancelToken = async token => {
    const result = await cancelToken(token.user_token_id);
    if (result.success) {
      ToastService.show({
        message: result.message,
        type: 'success',
        duration: 4000,
      });
      loadTokens();
    } else {
      ToastService.show({ message: result.message, type: 'error' });
    }
  };

  const handleShareOption = token => {
    // Show a simple UI choice — navigate to contacts or do social share
    navigation.navigate('ContactSelection', {
      userTokenId: token.user_token_id,
    });
  };

  const handleSocialShare = async token => {
    try {
      const shareUrl = `https://myqno.com/qapp/static/general/sharetoken/${token.token_no}`;
      await Share.share({
        message: `Check out my token: ${shareUrl}`,
        url: shareUrl,
        title: 'Share Token',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleFeedback = token => {
    setSelectedToken(token);
    setFeedbackVisible(true);
  };

  const submitFeedback = async () => {
    if (rating === 0) {
      ToastService.show({ message: 'Please select a rating', type: 'warning' });
      return;
    }

    const result = await addFeedback(
      selectedToken.company_id,
      rating,
      comment,
      selectedToken.user_token_id,
    );

    if (result.success) {
      ToastService.show({
        message: 'Feedback submitted successfully',
        type: 'success',
        duration: 4000,
      });
      setFeedbackVisible(false);
      setRating(0);
      setComment('');
      setSelectedToken(null);
    } else {
      ToastService.show({ message: result.message, type: 'error' });
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'I':
        return theme.colors.green; // Active - Green
      case 'C':
        return theme.colors.primaryDark; // Cancelled - Red
      case 'S':
        return theme.colors.blue; // Served - Blue
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'I':
        return 'Active';
      case 'C':
        return 'Cancelled';
      case 'S':
        return 'Served';
      default:
        return 'Unknown';
    }
  };

  const renderTokenItem = ({ item }) => (
    <View style={styles.tokenCard}>
      <View style={styles.tokenHeader}>
        <View>
          <Text style={styles.tokenNumber}>Token #{item.token_no}</Text>
          <Text style={styles.companyName}>{item.company_name}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.token_status) },
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusText(item.token_status)}
          </Text>
        </View>
      </View>

      <View style={styles.tokenDetails}>
        <Text style={styles.detailText}>📍 {item.location_name}</Text>
        <Text style={styles.detailText}>📅 {item.queue_date}</Text>
        <Text style={styles.detailText}>👥 {item.persons} Person(s)</Text>
        {userLocation && item.latitude && item.longitude && (
          <Text style={styles.detailText}>
            🗺️{' '}
            {getDistance(
              userLocation.lat,
              userLocation.lng,
              parseFloat(item.latitude),
              parseFloat(item.longitude),
            )}
          </Text>
        )}
      </View>

      {item.token_status === 'I' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelToken(item)}
          >
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={() => handleShareOption(item)}
          >
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.token_status === 'S' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.feedbackButton]}
          onPress={() => handleFeedback(item)}
        >
          <Text style={styles.actionButtonText}>Give Feedback</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Loader visible={loading} />
      <FlatList
        data={tokens}
        renderItem={renderTokenItem}
        keyExtractor={item => item.user_token_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tokens found</Text>
          </View>
        }
      />

      {/* Feedback Modal */}
      <Modal
        visible={feedbackVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFeedbackVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Give Feedback</Text>

            <Text style={styles.ratingLabel}>Rating:</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Text style={styles.starText}>
                    {star <= rating ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.commentLabel}>Comment:</Text>
            <TextInput
              style={styles.commentInput}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              placeholder="Enter your feedback..."
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setFeedbackVisible(false);
                  setRating(0);
                  setComment('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitFeedback}
              >
                <Text style={styles.modalButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.m,
  },
  tokenCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.light,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.m,
  },
  tokenNumber: {
    fontSize: theme.fontSize.large,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  companyName: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.s,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.small,
    fontWeight: '600',
  },
  tokenDetails: {
    marginBottom: theme.spacing.m,
  },
  detailText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.m,
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.primaryDark,
  },
  shareButton: {
    backgroundColor: theme.colors.blue,
  },
  feedbackButton: {
    backgroundColor: theme.colors.warning,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.medium,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    fontSize: theme.fontSize.large,
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.fontSize.xlarge,
    fontWeight: 'bold',
    marginBottom: theme.spacing.l,
    textAlign: 'center',
  },
  ratingLabel: {
    fontSize: theme.fontSize.medium,
    fontWeight: '600',
    marginBottom: theme.spacing.s,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.l,
  },
  starButton: {
    padding: theme.spacing.s,
  },
  starText: {
    fontSize: 32,
  },
  commentLabel: {
    fontSize: theme.fontSize.medium,
    fontWeight: '600',
    marginBottom: theme.spacing.s,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.s,
    padding: theme.spacing.m,
    fontSize: theme.fontSize.medium,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.l,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.m,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: theme.colors.textSecondary,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.medium,
    fontWeight: '600',
  },
});
