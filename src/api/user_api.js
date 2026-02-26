import apiClient from './client';
import { ENDPOINTS } from './config';

// --- Token APIs ---
export const fetchMyTokens = async (
  userId,
  tokenId = '-1',
  fromDate = '-1',
  uptoDate = '-1',
) => {
  try {
    const url = `${ENDPOINTS.FETCH_MY_TOKENS}/${userId}/${tokenId}/${fromDate}/${uptoDate}`;
    const response = await apiClient.get(url);
    if (response.data && response.data.found) {
      return {
        success: true,
        data: response.data.listMyTokenInfo || [],
        showRDFlag: response.data.showRDFlag,
        showADFlag: response.data.showADFlag,
      };
    }
    return { success: false, message: 'No tokens found', data: [] };
  } catch (error) {
    console.error('Fetch Tokens Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch tokens',
      data: [],
    };
  }
};

export const cancelToken = async tokenId => {
  try {
    const url = `${ENDPOINTS.CANCEL_TOKEN}/${tokenId}/C`;
    const response = await apiClient.get(url);
    if (
      response.data &&
      response.data.found &&
      response.data.type === 'success'
    ) {
      return { success: true, message: response.data.message };
    }
    return {
      success: false,
      message: response.data?.message || 'Failed to cancel token',
    };
  } catch (error) {
    console.error('Cancel Token Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to cancel token',
    };
  }
};

// --- Search APIs ---
export const searchCompanies = async searchParams => {
  try {
    const {
      category,
      latitude,
      longitude,
      searchText = '',
      distance = '25',
      date,
      persons = '1',
    } = searchParams;
    const params = new URLSearchParams();
    params.append('category', category || '0');
    params.append('latitude', latitude || '0');
    params.append('longitude', longitude || '0');
    params.append('search_text', searchText);
    params.append('user_distance', distance);
    params.append('qdate', date);
    params.append('persons', persons);

    const response = await apiClient.post(
      ENDPOINTS.SEARCH_COMPANIES,
      params.toString(),
    );
    if (response.data && Array.isArray(response.data)) {
      return { success: true, data: response.data };
    }
    return { success: false, message: 'No results found' };
  } catch (error) {
    console.error('Search Error:', error);
    return { success: false, message: error.message || 'Search failed' };
  }
};

// --- Profile APIs ---
export const fetchUserProfile = async userId => {
  try {
    const url = `${ENDPOINTS.FETCH_USER_PROFILE}/${userId}`;
    const response = await apiClient.get(url);
    if (response.data && response.data.found) {
      const userData = response.data.user;
      if (userData) {
        const userKey = Object.keys(userData)[0];
        return { success: true, data: userData[userKey] };
      }
    }
    return { success: false, message: 'Profile not found', data: null };
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch profile',
      data: null,
    };
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const url = `${ENDPOINTS.UPDATE_USER_PROFILE}/${userId}`;
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('first_name', profileData.first_name || '');
    formData.append('middle_name', profileData.middle_name || '');
    formData.append('last_name', profileData.last_name || '');
    formData.append('mobile_number', profileData.mobile_number || '');
    formData.append('email_id', profileData.email_id || '');
    formData.append('address', profileData.address || '');
    formData.append('country_id', profileData.country_id || '');
    formData.append('state_id', profileData.state_id || '');
    formData.append('city_id', profileData.city_id || '');
    formData.append('gender', profileData.gender || 'M');
    formData.append('birth_date', profileData.birth_date || '');
    formData.append('latitude', profileData.latitude || '0');
    formData.append('longitude', profileData.longitude || '0');
    formData.append('device_token', profileData.device_token || '');
    formData.append('device_type', 'android');

    const response = await apiClient.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (
      response.data &&
      response.data.found &&
      response.data.type === 'success'
    ) {
      return {
        success: true,
        message: response.data.message,
        data: response.data.listLoginInfo,
      };
    }
    return {
      success: false,
      message: response.data?.message || 'Failed to update profile',
    };
  } catch (error) {
    console.error('Update Profile Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to update profile',
    };
  }
};

// --- Wallet APIs ---
export const fetchWalletBalance = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.WALLET_BALANCE);
    if (response.data && response.data.found) {
      const balance =
        response.data.packagedetails?.recurity_deposite ||
        response.data.available_balance ||
        '0.00';
      return {
        success: true,
        balance,
        currency: response.data.currency || 'USD',
      };
    }
    return { success: false, balance: '0.00', currency: 'USD' };
  } catch (error) {
    console.error('Fetch Wallet Balance Error:', error);
    return {
      success: false,
      balance: '0.00',
      currency: 'USD',
      message: error.message || 'Failed to fetch balance',
    };
  }
};

export const fetchUserWalletInvoices = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.WALLET_INVOICES);
    if (response.data && response.data.found) {
      return { success: true, data: response.data.listInvoiceInfo || [] };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Fetch Wallet Invoices Error:', error);
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to fetch invoices',
    };
  }
};

// --- Places Visited APIs ---
export const fetchPlacesVisited = async (
  startPage = 1,
  recordsPerPage = 100,
  searchText = '',
) => {
  try {
    const searchParam =
      searchText && searchText.trim() !== ''
        ? searchText.trim()
        : '{searchtext}';
    const url = `${ENDPOINTS.PLACES_VISITED}/${startPage}/${recordsPerPage}/${searchParam}`;
    const response = await apiClient.get(url);
    if (Array.isArray(response.data)) {
      return { success: true, data: response.data };
    } else if (
      response.data &&
      (response.data.type?.toUpperCase() === 'SUCCESS' ||
        response.data.success === true)
    ) {
      return { success: true, data: response.data.favourite || [] };
    }
    return { success: false, data: [], message: response.data?.message };
  } catch (error) {
    console.error('Fetch Places Visited Error:', error);
    return { success: true, data: [], message: 'Error fetching places' };
  }
};

// --- Booking APIs ---
export const fetchActiveQueues = async (companyLocationId, date, lat, long) => {
  try {
    if (!companyLocationId)
      return { success: false, message: 'Invalid Company Location ID' };
    const params = new URLSearchParams();
    params.append('company_locations_id', companyLocationId);
    params.append('qdate', date);
    params.append('latitude', lat || '0');
    params.append('longitude', long || '0');

    const response = await apiClient.post(
      ENDPOINTS.SHOW_ACTIVE_QUEUES,
      params.toString(),
    );
    if (response.data && response.data.found) {
      return {
        success: true,
        data: response.data.listActiveQueueInfo || [],
        companyInfo: response.data.searchQueueInfo,
      };
    }
    return { success: false, data: [], message: response.data?.message };
  } catch (error) {
    console.error('Fetch Active Queues Error:', error);
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to fetch queues',
    };
  }
};

export const queueMeIn = async (queueMasterId, date, persons) => {
  try {
    const params = new URLSearchParams();
    params.append('queue_master_id', queueMasterId);
    params.append('queue_date', date);
    params.append('persons', persons);

    const response = await apiClient.post(
      ENDPOINTS.QUEUE_ME_IN,
      params.toString(),
    );
    if (response.data && response.data.found) {
      return {
        success: true,
        message: response.data.message || 'Token booked successfully',
      };
    }
    return {
      success: false,
      message: response.data?.message || 'Failed to book token',
    };
  } catch (error) {
    return { success: false, message: error.message || 'Failed to book token' };
  }
};

// --- User interaction APIs ---
export const addFeedback = async (companyId, rating, comment, userTokenId) => {
  try {
    const formData = new FormData();
    formData.append('company_id', companyId);
    formData.append('rating', rating.toString());
    formData.append('comment', comment);
    formData.append('user_token_id', userTokenId);

    const response = await apiClient.post(ENDPOINTS.FEEDBACK_USER, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data && response.data.type === 'success') {
      return { success: true, message: response.data.message };
    }
    return {
      success: false,
      message: response.data.message || 'Failed to submit feedback',
    };
  } catch (error) {
    console.error('Add Feedback Error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Network error occurred',
    };
  }
};

export const shareUserToken = async (userId, userTokenId, contacts) => {
  try {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('user_token_id', userTokenId);
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').slice(0, 19);
    formData.append('shared_datetime', formattedDate);
    formData.append('share_to', JSON.stringify(contacts));

    const response = await apiClient.post(
      ENDPOINTS.SHARE_USER_TOKEN,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    if (response.data && response.data.type === 'success') {
      return { success: true, message: response.data.message };
    }
    return {
      success: false,
      message: response.data.message || 'Failed to share token',
    };
  } catch (error) {
    console.error('Share User Token Error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Network error occurred',
    };
  }
};

export const registerUser = async ({
  firstName,
  lastName,
  mobile,
  email,
  countryId,
  latitude = 0.0,
  longitude = 0.0,
}) => {
  try {
    const params = new URLSearchParams();
    params.append('first_name', firstName);
    params.append('last_name', lastName);
    params.append('mobile_number', mobile);
    params.append('email_id', email);
    params.append('cmb_country', countryId);
    params.append('latitude', latitude);
    params.append('longitude', longitude);
    params.append('device_token', 'dummy_device_token');
    params.append('device_type', 'android');

    const response = await apiClient.post(
      ENDPOINTS.REGISTER_USER,
      params.toString(),
    );
    if (
      response.data &&
      response.data.found &&
      response.data.type === 'success'
    ) {
      return {
        success: true,
        message: response.data.message || 'Registration successful',
        data: response.data,
      };
    }
    return {
      success: false,
      message: response.data?.message || 'Registration failed',
    };
  } catch (error) {
    console.error('Register User Error:', error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Network request failed',
    };
  }
};

// --- Shared Tokens APIs ---
export const fetchSharedTokens = async userId => {
  try {
    const url = `${ENDPOINTS.FETCH_SHARED_TOKENS}/${userId}`;
    const response = await apiClient.get(url);
    if (response.data && response.data.found) {
      return { success: true, data: response.data.listSharedTokenInfo || [] };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Fetch Shared Tokens Error:', error);
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to fetch shared tokens',
    };
  }
};

export const referFriends = async contacts => {
  try {
    const referToData = contacts.map(contact => ({
      mobile: contact.phone || contact.phoneNumbers?.[0]?.number || '',
      full_name: contact.displayName || contact.givenName || '',
      status: '',
    }));
    const params = new URLSearchParams();
    params.append('refer_to', JSON.stringify(referToData));

    const response = await apiClient.post(
      'api/user/refer/0',
      params.toString(),
    );
    if (response.data && response.data.found) {
      return {
        success: true,
        message: response.data.message || 'Referrals sent successfully',
      };
    }
    return {
      success: false,
      message: response.data?.message || 'Failed to send referrals',
    };
  } catch (error) {
    console.error('Refer Friends Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send referrals',
    };
  }
};

/**
 * Import device contacts to the server.
 * Matches native: api/user/importcontacts/{imported_by_user_id}
 * contacts: [{mobile_number: "...", full_name: "..."}]
 */
export const importContacts = async (userId, contacts) => {
  try {
    const url = `${ENDPOINTS.IMPORT_CONTACTS}/${userId}`;
    const formData = new FormData();
    formData.append('contacts', JSON.stringify(contacts));

    const response = await apiClient.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (
      response.data &&
      (response.data.found || response.data.type === 'success')
    ) {
      return { success: true, message: response.data.message };
    }
    return {
      success: false,
      message: response.data?.message || 'Failed to import contacts',
    };
  } catch (error) {
    console.error('Import Contacts Error:', error);
    return {
      success: false,
      message: error.message || 'Failed to import contacts',
    };
  }
};

// --- Refer Token APIs ---
export const searchReferCompanies = async search => {
  try {
    const url = `${ENDPOINTS.SEARCH_COMPANY}/${search}`;
    const response = await apiClient.get(url);
    if (response.data && response.data.found) {
      return {
        success: true,
        data: response.data.listSearchReferCompanyInfo || [],
      };
    }
    return { success: false, message: response.data?.message || 'No results' };
  } catch (error) {
    console.error('Search Refer Company Error:', error);
    return { success: false, message: 'Search failed' };
  }
};

export const fetchReferQueues = async locationId => {
  try {
    const url = `${ENDPOINTS.SEARCH_QUEUE}/${locationId}`;
    const response = await apiClient.get(url);
    if (response.data && response.data.found) {
      return { success: true, data: response.data.listQueueInfo || [] };
    }
    return { success: false, message: response.data?.message || 'No queues' };
  } catch (error) {
    console.error('Fetch Refer Queues Error:', error);
    return { success: false, message: 'Failed to fetch queues' };
  }
};

export const referTokenAPI = async (
  compTokenId,
  companyId,
  queueId,
  sendDateStr,
) => {
  try {
    const params = new URLSearchParams();
    params.append('company_token_id', compTokenId);
    params.append('company_id', companyId);
    params.append('queue_master_id', queueId);
    params.append('queue_date', sendDateStr);

    const response = await apiClient.post(
      ENDPOINTS.REFER_TO_TOKEN,
      params.toString(),
    );
    if (response.data && response.data.found) {
      return { success: true, message: response.data.message };
    }
    return {
      success: false,
      message: response.data?.message || 'Referral failed',
    };
  } catch (error) {
    console.error('Refer Token API Error:', error);
    return { success: false, message: 'Referral failed' };
  }
};
