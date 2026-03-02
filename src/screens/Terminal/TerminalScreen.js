import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme';
import apiClient from '../../api/client';
import { getTerminalDisplayIds } from '../../utils/session';
import { CustomHeader } from '../../components/common/CustomHeader';
import { Loader, ToastService } from '../../components/common';
import { SafeAreaView } from 'react-native-safe-area-context';

// A simple flip-like token box
const TokenBox = ({ token }) => (
  <View style={styles.tokenBox}>
    <Text style={styles.tokenText}>{token}</Text>
  </View>
);

export const TerminalScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [queues, setQueues] = useState([]);
  const [displayInfo, setDisplayInfo] = useState({ title: '', subtitle: '' });
  const [settings, setSettings] = useState({
    noOfTokens: 4,
    noOfQueues: 2,
    intervalSec: 10,
  });

  const flatListRef = useRef(null);
  const scrollIndex = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    initTerminal();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initTerminal = async () => {
    setLoading(true);
    try {
      const activeIds = await getTerminalDisplayIds();
      if (!activeIds.locationId && !activeIds.queueId) {
        // Not configured
        setLoading(false);
        return;
      }

      await loadSettings(activeIds);
      await fetchTokens(activeIds);

      // Start polling every X seconds, where X is defined by settings or default 10s
      // The native app uses both a scroll timer and an API poll. For React Native,
      // polling the API and auto-scrolling can be tied together or separated.
      // Default to polling every 10 seconds.
      timerRef.current = setInterval(() => {
        fetchTokens(activeIds);
        autoScroll();
      }, 10000);
    } catch (e) {
      console.error('Terminal Init Error', e);
      ToastService.show({ message: 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async activeIds => {
    try {
      const isLoc = activeIds.queueId === '-1' || !activeIds.queueId;
      const url = isLoc
        ? 'api/terminal/GetDisplayLocationSettings'
        : 'api/terminal/GetDisplayQueueSettings';

      const data = new FormData();
      if (isLoc) data.append('location_id', activeIds.locationId);
      else data.append('queue_master_id', activeIds.queueId);

      const response = await apiClient.post(url, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.type === 'SUCCESS') {
        const s = { noOfTokens: 4, noOfQueues: 2, intervalSec: 10 };
        (response.data.listDisplySettingsInfo || []).forEach(item => {
          const val = parseInt(item.val, 10);
          if (item.para === 'NO_OF_TOKEN') s.noOfTokens = val;
          if (item.para === 'NO_OF_QUEUE') s.noOfQueues = val;
          if (item.para === 'DISPLAY_INTERVAL') s.intervalSec = val;
        });
        setSettings(s);

        // Update polling interval if needed
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            fetchTokens(activeIds);
            autoScroll();
          }, s.intervalSec * 1000);
        }
      }
    } catch (e) {
      console.error('Load Settings Error', e);
    }
  };

  const fetchTokens = async activeIds => {
    try {
      const data = new FormData();
      data.append('txtcomploca', activeIds.locationId || '');
      data.append('txtqlist', activeIds.queueId || '');
      data.append('view_type', '25');
      data.append('limit', '50');
      data.append('offset', '0');

      // Add dummy dates as required by native implementation
      const d = new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(d.getDate()).padStart(2, '0')}`;
      data.append('fromdate', dateStr);
      data.append('todate', dateStr);
      data.append('token_status', '');

      const response = await apiClient.post(
        'api/terminal/TerminalScreenResult',
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      if (response.data?.found) {
        setQueues(response.data.listTerminalInfo || []);

        if (activeIds.queueId === '-1' || !activeIds.queueId) {
          setDisplayInfo({
            title:
              response.data.locationInfo?.company_name || 'Location Terminal',
            subtitle: `${response.data.locationInfo?.location_name || ''}, ${
              response.data.locationInfo?.address || ''
            }`,
          });
        } else if (response.data.listTerminalInfo?.length > 0) {
          setDisplayInfo({
            title: response.data.listTerminalInfo[0].queue_name,
            subtitle: response.data.listTerminalInfo[0].queue_timing,
          });
        }
      } else {
        setQueues([]);
      }
    } catch (e) {
      console.error('Fetch Tokens Error', e);
    }
  };

  const autoScroll = () => {
    // We only auto scroll if there are more queues than fit on the screen
    setQueues(currentQueues => {
      if (currentQueues.length > settings.noOfQueues && flatListRef.current) {
        scrollIndex.current += 1;
        if (scrollIndex.current > currentQueues.length - settings.noOfQueues) {
          scrollIndex.current = 0;
        }
        flatListRef.current.scrollToIndex({
          index: scrollIndex.current,
          animated: true,
        });
      }
      return currentQueues;
    });
  };

  const renderQueueRow = ({ item }) => {
    const tokens = (item.concated_token_numbers || '')
      .split(',')
      .filter(t => t.trim() !== '');
    // Limit to the max configured tokens
    const displayTokens = tokens.slice(0, settings.noOfTokens);

    return (
      <View
        style={[
          styles.queueRow,
          {
            height: Dimensions.get('window').height / (settings.noOfQueues + 1),
          },
        ]}
      >
        <View style={styles.queueInfoCol}>
          <Text style={styles.queueName} numberOfLines={2}>
            {item.queue_name}
          </Text>
          {item.queue_timing ? (
            <Text style={styles.queueTiming}>{item.queue_timing}</Text>
          ) : null}
        </View>
        <View style={styles.tokensCol}>
          {displayTokens.map((t, idx) => (
            <TokenBox key={idx} token={t} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title={displayInfo.title || 'Terminal Window'}
        navigation={navigation}
        showBackIcon={true}
      />
      {displayInfo.subtitle ? (
        <View style={styles.subtitleHeader}>
          <Text style={styles.subtitleText}>{displayInfo.subtitle}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <Loader visible={loading} />
        </View>
      ) : queues.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons
            name="desktop-windows"
            size={64}
            color={theme.colors.textLight}
          />
          <Text style={styles.emptyText}>No Active Tokens</Text>
          <Text style={styles.emptySubText}>
            Ensure a location or queue is set up as a display screen in
            settings.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={queues}
          keyExtractor={item =>
            item.queue_master_id?.toString() || Math.random().toString()
          }
          renderItem={renderQueueRow}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // Auto-scrolled
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  subtitleHeader: {
    backgroundColor: theme.colors.lightGray,
    padding: theme.spacing.m,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  subtitleText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.iconDark,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.xxlarge,
    color: theme.colors.textLight,
    marginTop: theme.spacing.m,
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.iconGray,
    textAlign: 'center',
    marginTop: theme.spacing.s,
  },
  queueRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    padding: theme.spacing.m,
    alignItems: 'center',
  },
  queueInfoCol: {
    flex: 1,
    paddingRight: theme.spacing.m,
  },
  queueName: {
    fontSize: theme.fontSize.xxlarge,
    fontWeight: 'bold',
    color: theme.colors.iconDark,
  },
  queueTiming: {
    fontSize: theme.fontSize.large,
    color: theme.colors.iconGray,
    marginTop: theme.spacing.xs,
  },
  tokensCol: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  tokenBox: {
    backgroundcolor: theme.colors.black,
    borderRadius: 8,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    margin: theme.spacing.xs,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenText: {
    color: theme.colors.white,
    fontSize: 40,
    fontWeight: 'bold',
  },
});
