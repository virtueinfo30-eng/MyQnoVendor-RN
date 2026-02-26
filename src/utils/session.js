import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'vendor_session';

export const saveSession = async loginInfo => {
  try {
    // We only save what we need for headers and profile display
    // Mapping from loginResp.listLoginInfo[0] and [1] usually
    // But we'll expect the caller to pass a combined object or the array

    // If array passed (standard login response structure from MyQno)
    let sessionData = {};
    const infoArray = loginInfo?.listLoginInfo || loginInfo?.data;

    if (Array.isArray(loginInfo)) {
      // loginInfo[0] has user IDs, [1] has profile info
      sessionData = { ...loginInfo[0], ...loginInfo[1] };
    } else if (Array.isArray(infoArray)) {
      sessionData = { ...infoArray[0], ...infoArray[1] };
    } else {
      sessionData = loginInfo;
    }

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    console.log('💾 Session saved successfully');
    return true;
  } catch (error) {
    console.error('Example: Error saving session', error);
    return false;
  }
};

export const getSession = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(SESSION_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error reading session', error);
    return null;
  }
};

export const clearSession = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    return true;
  } catch (e) {
    return false;
  }
};

// Terminal Settings
const TERMINAL_LOCATION_ID_KEY = 'terminal_location_id';
const TERMINAL_QUEUE_ID_KEY = 'terminal_queue_id';

export const saveTerminalDisplayIds = async (locationId, queueId) => {
  try {
    await AsyncStorage.setItem(
      TERMINAL_LOCATION_ID_KEY,
      String(locationId || ''),
    );
    await AsyncStorage.setItem(TERMINAL_QUEUE_ID_KEY, String(queueId || ''));
    return true;
  } catch (error) {
    console.error('Error saving terminal display ids', error);
    return false;
  }
};

export const getTerminalDisplayIds = async () => {
  try {
    const locationId = await AsyncStorage.getItem(TERMINAL_LOCATION_ID_KEY);
    const queueId = await AsyncStorage.getItem(TERMINAL_QUEUE_ID_KEY);
    return {
      locationId: locationId || '',
      queueId: queueId || '',
    };
  } catch (error) {
    console.error('Error reading terminal display ids', error);
    return { locationId: '', queueId: '' };
  }
};
