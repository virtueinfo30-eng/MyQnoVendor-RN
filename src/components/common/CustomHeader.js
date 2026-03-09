import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme';
import { DrawerActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const CustomHeader = ({
  title,
  onLeftPress,
  showBackIcon = false,
  rightButtons = [], // Array of { iconName, onPress }
  navigation,
  showRightIcon = true,
  rightIconName,
  rightIconPress,
}) => {
  const handleLeftPress = () => {
    if (onLeftPress) {
      onLeftPress();
    } else if (navigation) {
      if (showBackIcon) {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          try {
            navigation.dispatch(DrawerActions.openDrawer());
          } catch (e) {
            console.warn('Navigation: No drawer to open');
          }
        }
      } else {
        try {
          navigation.dispatch(DrawerActions.openDrawer());
        } catch (e) {
          console.warn('Navigation: No drawer to open');
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.leftButton} onPress={handleLeftPress}>
          <MaterialIcons
            name={showBackIcon ? 'arrow-back' : 'menu'}
            size={28}
            color={theme.colors.white}
          />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>

        <View style={styles.rightContainer}>
          {showRightIcon && (
            <TouchableOpacity
              onPress={rightIconPress}
              style={styles.rightButton}
            >
              <MaterialIcons
                name={rightIconName}
                size={28}
                color={theme.colors.white}
              />
            </TouchableOpacity>
          )}
          {rightButtons.map((btn, index) => (
            <TouchableOpacity
              key={index}
              onPress={btn.onPress}
              style={styles.rightButton}
            >
              <MaterialIcons
                name={btn.iconName}
                size={28}
                color={theme.colors.white}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight - 30 : 0,
  },
  container: {
    height: 70, // Increased height for better multi-line title support if needed
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.s,
  },
  leftButton: {
    padding: theme.spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s,
  },
  title: {
    color: theme.colors.white,
    fontSize: theme.fontSize.large, // Reduced size for multi-line support
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 40,
  },
  rightButton: {
    padding: theme.spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
