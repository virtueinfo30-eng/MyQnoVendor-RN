import apiClient from './client';
import { ENDPOINTS, API_CONFIG } from './config';

export const loginUser = async (
  countryId,
  username,
  password,
  deviceToken = 'dummy_token',
) => {
  try {
    const formData = new FormData();
    formData.append('country_id', countryId);
    formData.append('username', username);
    formData.append('password', password);
    formData.append('app_type', API_CONFIG.HEADERS.HTTP_APP_TYPE); // 'vendor'
    formData.append('device_token', deviceToken);
    formData.append('device_type', 'android');

    const response = await apiClient.post(ENDPOINTS.LOGIN, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Check for success in response body logic (match native app logic)
    if (
      response.data &&
      (response.data.found || response.data.type?.toLowerCase() === 'success')
    ) {
      return { success: true, data: response.data };
    }
    return {
      success: false,
      message: response.data?.message || 'Login failed',
      data: response.data,
    };
  } catch (error) {
    console.error('Login Error:', error);
    return { success: false, message: error.message || 'Login error' };
  }
};

export const getCountriesList = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.COUNTRIES);
    // Legacy support: return raw data but also support .success if needed
    // Actually SignupScreen expects the array directly or an object?
    // SignupScreen does: setCountries(countriesList || [])
    // If response.data is the array, return it.
    return response.data;
  } catch (error) {
    console.error('Get Countries Error:', error);
    return [];
  }
};

export const forgotPassword = async (countryId, username) => {
  try {
    const formData = new FormData();
    formData.append('country_id', countryId);
    formData.append('username', username);

    const response = await apiClient.post(ENDPOINTS.FORGOT_PASSWORD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (
      response.data &&
      (response.data.found || response.data.type?.toLowerCase() === 'success')
    ) {
      return { success: true, message: response.data.message };
    }
    return {
      success: false,
      message: response.data?.message || 'Request failed',
    };
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return { success: false, message: error.message };
  }
};

export const getStatesList = async countryId => {
  try {
    const response = await apiClient.get(`${ENDPOINTS.STATES}/${countryId}`);
    return response.data || [];
  } catch (error) {
    console.error('Get States Error:', error);
    return [];
  }
};

export const getCitiesList = async stateId => {
  try {
    const response = await apiClient.get(`${ENDPOINTS.CITIES}/${stateId}`);
    return response.data || [];
  } catch (error) {
    console.error('Get Cities Error:', error);
    return [];
  }
};

export const getCompanyCategories = async () => {
  try {
    const response = await apiClient.get(
      'api/company/listcompanycategories/no',
    );
    if (response.data && response.data.found) {
      return {
        success: true,
        found: true,
        categories: response.data.categories || [],
      };
    }
    return { success: false, found: false, categories: [] };
  } catch (error) {
    console.error('Get Company Categories Error:', error);
    return {
      success: false,
      found: false,
      categories: [],
      message: error.message,
    };
  }
};

export const registerVendor = async data => {
  try {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    const response = await apiClient.post('api/company/save/0', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (
      response.data &&
      (response.data.found || response.data.type?.toLowerCase() === 'success')
    ) {
      return {
        success: true,
        message: response.data.message,
        data: response.data,
      };
    }
    return {
      success: false,
      message: response.data?.message || 'Registration failed',
    };
  } catch (error) {
    console.error('Register Vendor Error:', error);
    return { success: false, message: error.message };
  }
};
