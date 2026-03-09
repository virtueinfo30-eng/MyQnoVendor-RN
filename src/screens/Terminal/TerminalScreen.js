import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  StatusBar,
  AppState,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme';
import apiClient from '../../api/client';
import { getTerminalDisplayIds } from '../../utils/session';
import { Loader, ToastService } from '../../components/common';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─────────────────────────────────────────────────────────────────────────────
// FlipTokenBox — scoreboard-style flip animation matching TerminalDisplayActivity
// Animates from old → new value when `token` prop changes, only when doFlip=true
// ─────────────────────────────────────────────────────────────────────────────
const FlipTokenBox = ({ token, doFlip }) => {
  const displayToken = useRef(token);
  const [visibleToken, setVisibleToken] = useState(token);
  const rotateY = useSharedValue(0); // degrees

  useEffect(() => {
    if (token === displayToken.current) return;

    if (doFlip) {
      // Phase 1: rotate from 0 → 90 (hide face — old number)
      // Phase 2: swap number mid-flip (invisible at 90°)
      // Phase 3: rotate from -90 → 0 (reveal face — new number)
      rotateY.value = withSequence(
        withTiming(90, {
          duration: 200,
          easing: Easing.in(Easing.ease),
        }),
        withTiming(-90, { duration: 0 }), // instant jump to mirror side
        withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.ease),
        }),
      );

      // Swap visible token at the midpoint (200ms = halfway through)
      const id = setTimeout(() => {
        displayToken.current = token;
        setVisibleToken(token);
      }, 200);
      return () => clearTimeout(id);
    } else {
      // No animation — just update
      displayToken.current = token;
      setVisibleToken(token);
    }
  }, [token, doFlip, rotateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 400 }, { rotateY: `${rotateY.value}deg` }],
  }));

  if (!token || token === '0') return null;

  return (
    <Animated.View style={[styles.tokenBox, animStyle]}>
      <Text style={styles.tokenText}>{visibleToken}</Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TerminalScreen
// ─────────────────────────────────────────────────────────────────────────────
export const TerminalScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [queues, setQueues] = useState([]);
  const [displayInfo, setDisplayInfo] = useState({ title: '', subtitle: '' });
  const [bodyHeight, setBodyHeight] = useState(0); // Measured available height for queue rows
  const [settings, setSettings] = useState({
    noOfTokens: 4,
    noOfQueues: 2,
    intervalSec: 10,
  });

  const flatListRef = useRef(null);
  const scrollIndex = useRef(0);
  const timerRef = useRef(null);
  const activeIdsRef = useRef(null);
  const settingsRef = useRef({ noOfTokens: 4, noOfQueues: 2, intervalSec: 10 });
  const appStateRef = useRef(AppState.currentState);

  // ── prevTokensRef: { [queue_master_id]: string[] }
  // Stores the last-known token array for each queue so we can detect changes
  const prevTokensRef = useRef({});

  // ── Feature 3: Fullscreen — hide status bar on mount, restore on unmount
  useEffect(() => {
    StatusBar.setHidden(true, 'fade');

    const appStateSub = AppState.addEventListener('change', nextState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        // Re-hide if app comes back to foreground on this screen
        StatusBar.setHidden(true, 'fade');
      }
      appStateRef.current = nextState;
    });

    return () => {
      StatusBar.setHidden(false, 'fade'); // Restore on unmount
      appStateSub.remove();
    };
  }, []);

  // ── Main init
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
      activeIdsRef.current = activeIds;

      if (!activeIds.locationId && !activeIds.queueId) {
        setLoading(false);
        return;
      }

      // Load settings first (sets settingsRef.current)
      await loadSettings(activeIds);
      // Fetch tokens immediately
      await fetchTokens(activeIds);

      // Start polling at the interval from settings
      startPolling(activeIds, settingsRef.current.intervalSec);
    } catch (e) {
      console.error('Terminal Init Error', e);
      ToastService.show({ message: 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (activeIds, intervalSec) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const ms = (intervalSec || 10) * 1000;
    timerRef.current = setInterval(() => {
      fetchTokens(activeIds);
      autoScroll();
    }, ms);
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
          if (item.para === 'NO_OF_QUEUE') {
            s.noOfQueues = Math.min(val, 3); // native caps at 3
          }
          if (item.para === 'DISPLAY_INTERVAL') s.intervalSec = val;
        });
        settingsRef.current = s;
        setSettings(s);
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

      const d = new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      data.append('fromdate', dateStr);
      data.append('todate', dateStr);
      data.append('token_status', '');

      const response = await apiClient.post(
        'api/terminal/TerminalScreenResult',
        data,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      if (response.data?.found) {
        const incoming = response.data.listTerminalInfo || [];

        // ── Diff: mark which queues have changed tokens, update prevTokensRef
        const updatedQueues = incoming.map(item => {
          const qid = item.queue_master_id?.toString();
          const newTokens = (item.concated_token_numbers || '')
            .split(',')
            .map(t => t.trim());
          const prevTokens = prevTokensRef.current[qid] || [];

          // Detect per-slot changes
          const changedSlots = newTokens.map(
            (tok, i) => tok !== prevTokens[i],
          );

          prevTokensRef.current[qid] = newTokens;

          return {
            ...item,
            _parsedTokens: newTokens,
            _changedSlots: changedSlots,
          };
        });

        setQueues(updatedQueues);

        if (activeIds.queueId === '-1' || !activeIds.queueId) {
          setDisplayInfo({
            title:
              response.data.locationInfo?.company_name || 'Location Terminal',
            subtitle: `${response.data.locationInfo?.location_name || ''}, ${response.data.locationInfo?.address || ''}`,
          });
        } else if (incoming.length > 0) {
          setDisplayInfo({
            title: incoming[0].queue_name,
            subtitle: incoming[0].queue_timing,
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
    setQueues(currentQueues => {
      const noOfQueues = settingsRef.current.noOfQueues;
      if (currentQueues.length > noOfQueues && flatListRef.current) {
        scrollIndex.current += 1;
        if (scrollIndex.current > currentQueues.length - noOfQueues) {
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

  // ─────────────────────────────────────────────────────────────────
  // renderQueueRow — 3-column layout:
  //   Col1: Queue Name + Timing  |  Col2: Room No (blue)  |  Col3: Token FlipBoxes
  // ─────────────────────────────────────────────────────────────────
  const renderQueueRow = ({ item }) => {
    const { _parsedTokens = [], _changedSlots = [] } = item;
    const displayTokens = _parsedTokens.slice(0, settingsRef.current.noOfTokens);
    // Use measured body height — falls back to Dimensions if layout hasn't fired yet
    const availH = bodyHeight > 0
      ? bodyHeight
      : Dimensions.get('window').height * 0.75;
    const rowH = Math.floor(availH / settingsRef.current.noOfQueues);
    const doFlipForRow = item.view_flip === '1';
    const roomNo = item.default_message_arrived || '';

    return (
      <View style={[styles.queueRow, { height: rowH }]}>
        {/* ── Column 1: Queue Name & Timing ── */}
        <View style={styles.queueInfoCol}>
          <Text style={styles.queueName} numberOfLines={3}>
            {item.queue_name}
          </Text>
          {item.queue_timing ? (
            <Text style={styles.queueTiming} numberOfLines={1}>
              {item.queue_timing}
            </Text>
          ) : null}
        </View>

        {/* ── Column 2: Room No / default_message_arrived ── */}
        <View style={styles.roomNoCol}>
          {roomNo ? (
            <Text style={styles.roomNoText} numberOfLines={2}>
              {roomNo}
            </Text>
          ) : null}
        </View>

        {/* ── Column 3: Flip Token Boxes ── */}
        <View style={styles.tokensCol}>
          {displayTokens.map((t, idx) => (
            <FlipTokenBox
              key={`${item.queue_master_id}-${idx}`}
              token={t}
              doFlip={doFlipForRow && !!_changedSlots[idx]}
            />
          ))}
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Title Bar */}
      <View style={styles.titleBar}>
        <Text style={styles.titleText} numberOfLines={1}>
          {displayInfo.title || 'Terminal Window'}
        </Text>
        <Image
          source={require('../../assets/images/ic_logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <MaterialIcons
          name="desktop-windows"
          size={28}
          color={theme.colors.white}
        />
      </View>

      {/* Subtitle / Location Header */}
      {displayInfo.subtitle ? (
        <View style={styles.subtitleHeader}>
          <Text style={styles.subtitleText} numberOfLines={1}>
            {displayInfo.subtitle}
          </Text>
        </View>
      ) : null}

      {/* Body — onLayout measures the exact available height for queue rows */}
      <View
        style={styles.listArea}
        onLayout={e => setBodyHeight(e.nativeEvent.layout.height)}
      >
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
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Bottom Ads Banner — matches native grey bar */}
      <View style={styles.adsBanner} />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background like a TV display
  },

  // ── Title Bar (matches native relLayoutTitle — primary color bg)
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  titleText: {
    flex: 1,
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginRight: 12,
  },
  logoImage: {
    height: 32,
    width: 64,
    marginRight: 12,
  },

  // ── Subtitle Header (matches native llLayoutHeader)
  subtitleHeader: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    opacity: 0.85,
  },
  subtitleText: {
    fontSize: 18,
    color: theme.colors.white,
    fontWeight: '500',
  },

  // ── Empty State
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 22,
    color: theme.colors.textLight,
    marginTop: 12,
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 14,
    color: theme.colors.iconGray,
    textAlign: 'center',
    marginTop: 8,
  },

  // ── Queue Row — horizontal 3-column layout
  queueRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  // Column 1: Queue name + timing (flex: 2 → ~20% of width like native)
  queueInfoCol: {
    flex: 2,
    paddingRight: 8,
    justifyContent: 'center',
  },
  queueName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
  },
  queueTiming: {
    fontSize: 15,
    color: '#848484',
    marginTop: 4,
  },

  // Column 2: Room No / default_message_arrived (flex: 1.5 → ~15%)
  roomNoCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  roomNoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#008BF7', // native txtRoomNoColor
    textAlign: 'center',
  },

  // Column 3: Token flip boxes (flex: 4 → remaining width)
  tokensCol: {
    flex: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  // ── Flip Token Box
  tokenBox: {
    backgroundColor: '#000',
    borderRadius: 8,
    margin: 4,
    minWidth: 70,
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  tokenText: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: 'bold',
  },

  // ── List area — fills remaining space, measured via onLayout for precise row heights
  listArea: {
    flex: 1,
  },

  // ── Ads Banner (matches native adsHeight ≈ 10% screen)
  adsBanner: {
    height: Dimensions.get('window').height * 0.08,
    backgroundColor: '#e6e6e6',
    width: '100%',
  },
});
