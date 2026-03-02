import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

const Loader = ({ visible = true, message = '' }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade + scale in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous rotation
      rotation.setValue(0);
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacity, scale, rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal transparent animationType="none" visible={visible}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          {/* Spinner ring */}
          <View style={styles.spinnerWrapper}>
            {/* Track ring */}
            <View style={styles.trackRing} />
            {/* Rotating arc */}
            <Animated.View
              style={[styles.arcRing, { transform: [{ rotate: spin }] }]}
            />
          </View>

          {/* Message */}
          {!!message && <Text style={styles.message}>{message}</Text>}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default Loader;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.white,
    paddingVertical: 32,
    paddingHorizontal: 40,
    borderRadius: 20,
    alignItems: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    minWidth: 140,
  },
  spinnerWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: 'rgba(230, 36, 48, 0.15)', // primary 15% opacity
  },
  arcRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: 'transparent',
    borderTopColor: theme.colors.primary,
    borderRightColor: theme.colors.primary,
  },
  message: {
    marginTop: 18,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
