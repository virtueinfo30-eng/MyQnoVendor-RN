import apiClient from './client';
import { ENDPOINTS } from './config';

export const fetchAvailableBalance = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.FETCH_AVAILABLE_BALANCE);
    return response.data;
  } catch (error) {
    console.error('Fetch Balance Error:', error);
    throw error;
  }
};

export const fetchWalletInvoices = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.FETCH_WALLET_INVOICES);
    return response.data;
  } catch (error) {
    console.error('Fetch Wallet Invoices Error:', error);
    throw error;
  }
};

export const fetchPackageList = async packageType => {
  try {
    const data = new URLSearchParams();
    data.append('package_type', packageType);

    const response = await apiClient.post(ENDPOINTS.FETCH_PACKAGES, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Fetch Package List Error (${packageType}):`, error);
    throw error;
  }
};

export const createInvoice = async packageId => {
  try {
    const url = ENDPOINTS.CREATE_INVOICE.replace('{package_id}', packageId);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Create Invoice Error:', error);
    throw error;
  }
};

export const paymentPayUMoneyConfiguration = async packageId => {
  try {
    const data = new URLSearchParams();
    data.append('package_id', packageId);

    const response = await apiClient.post(
      ENDPOINTS.PAYMENT_PAYU_MONEY_CONFIGURATION,
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(`PayU Config Error:`, error);
    throw error;
  }
};
