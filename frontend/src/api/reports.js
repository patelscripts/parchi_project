import api from './api';

export const reportService = {
  upload: async (data) => {
    const response = await api.post('/reports/upload', data);
    return response.data;
  },
  extract: async (reportId, file) => {
    if (!reportId) {
      throw new Error('Report ID is missing. Please ensure you have entered the report date first.');
    }

    const formData = new FormData();
    formData.append('report', file);
    formData.append('reportId', reportId);

    // Debugging: Check what's inside the FormData
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    // IMPORTANT: Do NOT set 'Content-Type' header manually for FormData.
    // Axios will automatically set it to 'multipart/form-data' AND include the boundary string.
    const response = await api.post('/reports/extract', formData);
    return response.data;
  },
  verify: async (records) => {
    const response = await api.post('/reports/verify', { records });
    return response.data;
  },
};
