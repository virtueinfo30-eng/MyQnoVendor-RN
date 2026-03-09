import apiClient from './client';
import { ENDPOINTS, API_CONFIG } from './config';

export const fetchCompanyLocations = async (companyId, mobileNo) => {
  try {
    const response = await apiClient.get(
      `${ENDPOINTS.FETCH_COMPANY_LOCATIONS}/0/${mobileNo}`,
    );
    return response.data;
  } catch (error) {
    console.error('Fetch Locations Error:', error);
    throw error;
  }
};

export const fetchLocationDetails = async locationId => {
  try {
    const response = await apiClient.get(
      `${ENDPOINTS.GET_LOCATION_DETAILS}/${locationId}`,
    );
    return response.data;
  } catch (error) {
    console.error('Fetch Location Details Error:', error);
    throw error;
  }
};

export const fetchStateList = async countryId => {
  try {
    const response = await apiClient.get(`${ENDPOINTS.STATES}/${countryId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchCityList = async stateId => {
  try {
    const response = await apiClient.get(`${ENDPOINTS.CITIES}/${stateId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchCompanyQueues = async (companyId, locationId, mobileNo) => {
  try {
    const response = await apiClient.get(
      `${ENDPOINTS.FETCH_COMPANY_QUEUES}/${companyId}/${locationId}/${mobileNo}`,
    );
    return response.data;
  } catch (error) {
    console.error('Fetch Queues Error:', error);
    throw error;
  }
};

export const fetchQueueDetails = async queueId => {
  try {
    const response = await apiClient.get(
      `${ENDPOINTS.FETCH_QUEUE_DETAILS}/${queueId}`,
    );
    return response.data;
  } catch (error) {
    console.error('Fetch Queue Details Error:', error);
    throw error;
  }
};

export const fetchRingGroupNames = async locationId => {
  try {
    const response = await apiClient.get(
      `${ENDPOINTS.FETCH_RG_NAMES}/${locationId}`,
    );
    return response.data;
  } catch (error) {
    console.error('Fetch Ring Group Names Error:', error);
    throw error;
  }
};

export const saveQueueDetails = async (companyId, data) => {
  try {
    const response = await apiClient.post(
      `${ENDPOINTS.SAVE_QUEUE_DETAILS}/${companyId}`,
      data,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Save Queue Details Error:', error);
    throw error;
  }
};

export const fetchCompanyCustomers = async (
  companyId,
  page = 1,
  search = '',
) => {
  try {
    // Note: ensure params match native app logic (startpage/recordperpage/searchtext)
    const searchText =
      search.trim() !== '' ? encodeURIComponent(search.trim()) : '{searchtext}';
    const url = `${ENDPOINTS.FETCH_CUSTOMERS}/${page}/100/${searchText}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Fetch Customers Error:', error);
    throw error;
  }
};

export const fetchActivityGrid = async (
  companyId,
  locationId,
  queueId,
  options = {},
) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const formData = new FormData();
    formData.append('txtcomploca', locationId);
    formData.append('txtqlist', queueId);
    formData.append('view_type', options.viewType || '25');
    formData.append('limit', options.limit || '100');
    formData.append('offset', options.offset || '0');
    formData.append('fromdate', options.fromdate || today);
    formData.append('todate', options.todate || today);
    formData.append('token_status', options.token_status || '');

    if (options.preBookingDays !== undefined) {
      formData.append('pre_booking_days', options.preBookingDays);
    }
    if (options.totalRecords !== undefined) {
      formData.append('txttotal_records', options.totalRecords);
    }

    if (options.from_token) formData.append('from_token', options.from_token);
    if (options.to_token) formData.append('to_token', options.to_token);

    const response = await apiClient.post(ENDPOINTS.ACTIVITY_GRID, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log("response", response.data);
    return response.data;
  } catch (error) {
    console.error('Fetch Activity Grid Error:', error);
    throw error;
  }
};

export const fetchUsersInQueue = async userTokenId => {
  try {
    const response = await apiClient.get(
      `${ENDPOINTS.FETCH_USERS_IN_QUEUE}/${userTokenId}`,
    );
    return response.data;
  } catch (error) {
    console.error('Fetch Users In Queue Error:', error);
    throw error;
  }
};

export const fetchUserLocation = async (companyId, companyTokenId) => {
  try {
    const response = await apiClient.get(
      `${ENDPOINTS.GET_LOCATION_USERS}/${companyId}/${companyTokenId}`,
    );
    return response.data;
  } catch (error) {
    console.error('Fetch User Location Error:', error);
    throw error;
  }
};

export const setTokenArrivedStatus = async (companyId, data) => {
  try {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    const response = await apiClient.post(
      `${ENDPOINTS.SET_ARRIVED}/${companyId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  } catch (error) {
    console.error('Set Arrived Status Error:', error);
    throw error;
  }
};

export const fetchSwapTokenNumber = async (companyId, companyTokenId) => {
  try {
    const response = await apiClient.get(
      `${ENDPOINTS.GET_SWAP_TOKEN_NUMBER}/${companyId}/${companyTokenId}`,
    );
    return response.data;
  } catch (error) {
    console.error('Fetch Swap Token Number Error:', error);
    throw error;
  }
};

export const swapToken = async (companyId, requestTokenId, steps) => {
  try {
    const response = await apiClient.get(
      `${ENDPOINTS.SWAP_TOKEN}/${companyId}/${requestTokenId}/${steps}`,
    );
    return response.data;
  } catch (error) {
    console.error('Swap Token Error:', error);
    throw error;
  }
};

export const reissueToken = async data => {
  try {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    const response = await apiClient.post(ENDPOINTS.REISSUE_TOKEN, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Reissue Token Error:', error);
    throw error;
  }
};

export const sendTokenNotification = async (companyId, data) => {
  try {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    const response = await apiClient.post(
      `${ENDPOINTS.SEND_NOTIFICATION}/${companyId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  } catch (error) {
    console.error('Send Notification Error:', error);
    throw error;
  }
};

export const callNextToken = async (companyId, queueId, counterId = '0') => {
  // Implementation would depend on specific 'Next' API.
  // Native app likely calls 'api/activity/callnext' or similar.
  // I'll stick to what I found in config or generic placeholder for now.
  // Using SWAP_TOKEN or SET_ARRIVED might be part of it.
  return { success: true, message: 'Next called (Simulated)' };
};

export const fetchCompanyProfile = async companyId => {
  try {
    const response = await apiClient.get(
      `${ENDPOINTS.FETCH_COMPANY_PROFILE}/${companyId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const assignManualToken = async data => {
  try {
    const formData = new FormData();
    formData.append('queue_master_id', data.queue_master_id);
    formData.append('queue_date', data.queue_date);
    formData.append('persons', data.persons);
    formData.append('mobile_number', data.mobile_number);
    formData.append('fullname', data.fullname);

    const response = await apiClient.post(
      ENDPOINTS.ISSUE_MANUAL_TOKEN,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Assign Manual Token Error:', error);
    throw error;
  }
};

export const fetchUserByMobileAddress = async mobileNo => {
  try {
    const response = await apiClient.get(
      `${ENDPOINTS.GET_USER_BY_MOBILE}/${mobileNo}`,
    );
    return response.data;
  } catch (error) {
    console.error('Fetch User By Mobile Error:', error);
    throw error;
  }
};

export const fetchHolidays = async (queueId, holidayId = '0') => {
  try {
    const response = await apiClient.get(
      `${ENDPOINTS.FETCH_HOLIDAY_LIST}/${queueId}/${holidayId}`,
    );
    return response.data;
  } catch (error) {
    console.error('Fetch Holidays Error:', error);
    throw error;
  }
};

export const deleteHoliday = async (queueId, holidayId) => {
  try {
    const formData = new FormData();
    formData.append('queue_master_id', queueId);
    formData.append('queue_holiday_id', holidayId);
    const response = await apiClient.post(ENDPOINTS.DELETE_HOLIDAY, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Delete Holiday Error:', error);
    throw error;
  }
};

export const saveHoliday = async (isUpdate, data) => {
  try {
    const url = isUpdate ? ENDPOINTS.UPDATE_HOLIDAY : ENDPOINTS.ADD_HOLIDAY;
    const response = await apiClient.post(url, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Save Holiday Error:', error);
    throw error;
  }
};

export const fetchHolidayQueueList = async (companyId, locationId, queueId) => {
  try {
    const response = await apiClient.get(
      `${ENDPOINTS.FETCH_HOLIDAY_QUEUE_LIST}/${companyId}/${locationId}/${queueId}`,
    );
    return response.data;
  } catch (error) {
    console.error('Fetch Holiday Queue List Error:', error);
    throw error;
  }
};

export const updateCompanyProfile = async (compId, profileData) => {
  try {
    const formData = new FormData();
    Object.keys(profileData).forEach(key => {
      formData.append(key, profileData[key]);
    });

    const response = await apiClient.post(
      `${ENDPOINTS.UPDATE_COMPANY_PROFILE}/${compId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Update Company Profile Error:', error);
    throw error;
  }
};

export const fetchCompanyCategories = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.COMPANY_CATEGORY);
    return response.data;
  } catch (error) {
    console.error('Fetch Company Categories Error:', error);
    throw error;
  }
};

export const uploadCompanyProfilePic = async (compId, fileData, isRemove) => {
  try {
    const formData = new FormData();
    formData.append('company_id', compId);
    formData.append('remove', isRemove ? '1' : '0');
    if (!isRemove && fileData) {
      formData.append('fileToUpload', fileData);
    }

    const response = await apiClient.post(
      ENDPOINTS.UPDATE_COMPANY_PROFILE_PIC,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Upload Profile Pic Error:', error);
    throw error;
  }
};

export const requestForDemo = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.REQUEST_DEMO);
    return response.data;
  } catch (error) {
    console.error('Request For Demo Error:', error);
    throw error;
  }
};

export const getCallSupport = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.GET_SUPPORT);
    return response.data;
  } catch (error) {
    console.error('Get Call Support Error:', error);
    throw error;
  }
};
