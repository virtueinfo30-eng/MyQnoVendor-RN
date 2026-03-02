import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../theme';

// ─── Type config ────────────────────────────────────────────────────────────
const TOAST_TYPES = {
  success: {
    backgroundColor: '#1a1a1a',
    accentColor: theme.colors.success,
    icon: '✓',
  },
  error: {
    backgroundColor: '#1a1a1a',
    accentColor: theme.colors.primary, // app red
    icon: '✕',
  },
  warning: {
    backgroundColor: '#1a1a1a',
    accentColor: theme.colors.warning,
    icon: '⚠',
  },
  info: {
    backgroundColor: '#1a1a1a',
    accentColor: theme.colors.info,
    icon: 'ℹ',
  },
};

const DEFAULT_DURATION = 3000;

// ─── Component ───────────────────────────────────────────────────────────────
const CustomToast = forwardRef((_, ref) => {
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const [state, setState] = useState({
    visible: false,
    message: '',
    type: 'info',
    duration: DEFAULT_DURATION,
  });

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setState(s => ({ ...s, visible: false })));
  }, [translateY, opacity]);

  const show = useCallback(
    ({ message, type = 'info', duration = DEFAULT_DURATION }) => {
      // Clear any running timer
      if (timerRef.current) clearTimeout(timerRef.current);

      // Reset animation values
      translateY.setValue(120);
      opacity.setValue(0);

      setState({ visible: true, message, type, duration });

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(hide, duration);
    },
    [translateY, opacity, hide],
  );

  useImperativeHandle(ref, () => ({ show, hide }));

  if (!state.visible) return null;

  const typeConfig = TOAST_TYPES[state.type] || TOAST_TYPES.info;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: typeConfig.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Accent left border */}
      <View
        style={[styles.accentBar, { backgroundColor: typeConfig.accentColor }]}
      />

      {/* Icon */}
      <View
        style={[
          styles.iconWrapper,
          { backgroundColor: typeConfig.accentColor },
        ]}
      >
        <Text style={styles.iconText}>{typeConfig.icon}</Text>
      </View>

      {/* Message */}
      <Text style={styles.message} numberOfLines={3}>
        {state.message}
      </Text>

      {/* Close button */}
      <TouchableOpacity
        onPress={hide}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.closeBtn}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

CustomToast.displayName = 'CustomToast';

export default CustomToast;

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
    minHeight: 56,
  },
  accentBar: {
    width: 5,
    alignSelf: 'stretch',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  iconText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    color: theme.colors.white,
    fontSize: 14,
    paddingVertical: 14,
    lineHeight: 20,
  },
  closeBtn: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
