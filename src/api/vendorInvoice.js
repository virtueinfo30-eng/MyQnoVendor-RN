import apiClient from './client';
import { ENDPOINTS, API_CONFIG } from './config';

export const fetchVendorInvoiceList = async companyMasterId => {
  try {
    const url = `${ENDPOINTS.VENDOR_INVOICE_LIST}/${companyMasterId}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Fetch Invoice List Error:', error);
    throw error;
  }
};

export const addVendorInvoice = async (
  monthYear,
  file,
  amount,
  note,
  companyId,
) => {
  try {
    const formData = new FormData();
    formData.append('month_year', monthYear);
    formData.append('amount_by_vendor', amount);
    formData.append('note', note);

    if (file) {
      formData.append('vendorInvoice', {
        uri: file.uri,
        type: file.type || 'application/pdf', // Default fallback
        name: file.name || 'invoice.pdf',
      });
    }

    const response = await apiClient.post(ENDPOINTS.ADD_INVOICE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Add Invoice Error:', error);
    throw error;
  }
};

export const updateVendorInvoice = async (
  invoiceId,
  monthYear,
  file,
  amount,
  note,
) => {
  try {
    const formData = new FormData();
    formData.append('month_year', monthYear);
    formData.append('amount_by_vendor', amount);
    if (note) formData.append('note', note);

    if (file && file.uri) {
      formData.append('vendorInvoice', {
        uri: file.uri,
        type: file.type || 'application/pdf',
        name: file.name || 'invoice.pdf',
      });
    }

    const url = `${ENDPOINTS.UPDATE_INVOICE}/${invoiceId}`;
    const response = await apiClient.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Update Invoice Error:', error);
    throw error;
  }
};

export const deleteVendorInvoice = async invoiceId => {
  try {
    const formData = new FormData();
    formData.append('vendor_invoice_id', invoiceId);

    const response = await apiClient.post(ENDPOINTS.DELETE_INVOICE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Delete Invoice Error:', error);
    throw error;
  }
};

export const viewVendorInvoice = async invoiceId => {
  try {
    const url = `${ENDPOINTS.VIEW_INVOICE}/${invoiceId}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('View Invoice Error:', error);
    throw error;
  }
};

export const downloadVendorInvoiceUrl = invoiceId => {
  return `${API_CONFIG.BASE_URL}${ENDPOINTS.DOWNLOAD_INVOICE}/${invoiceId}`;
};
