import apiClient from './client';
import { ENDPOINTS } from './config';

export const fetchTokensReport = async params => {
  try {
    const formData = new FormData();
    Object.keys(params).forEach(key => {
      formData.append(key, params[key]);
    });

    const response = await apiClient.post(ENDPOINTS.FETCH_REPORTS, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Fetch Tokens Report Error:', error);
    throw error;
  }
};

export const getLocQueCombo = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.FETCH_LOC_QUE_COMBO);
    return response.data;
  } catch (error) {
    console.error('Get Loc Que Combo Error:', error);
    throw error;
  }
};

export const sendReportEmail = async params => {
  try {
    const formData = new FormData();
    Object.keys(params).forEach(key => {
      formData.append(key, params[key]);
    });

    const response = await apiClient.post(
      ENDPOINTS.SEND_REPORT_EMAIL,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Send Report Email Error:', error);
    throw error;
  }
};
