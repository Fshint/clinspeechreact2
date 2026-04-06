import axios from 'axios';
import { getLocaleCode, getStoredLocale } from '../i18n/localeStorage';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.defaults.headers.common['Accept-Language'] = getLocaleCode(getStoredLocale());

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const localeHeader = getLocaleCode(getStoredLocale());
  config.headers = config.headers || {};
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['Accept-Language'] = localeHeader;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor — auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const req = error.config;
    if (error.response?.status === 401 && !req._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          req.headers.Authorization = `Bearer ${token}`;
          return api(req);
        });
      }
      req._retry = true;
      isRefreshing = true;
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh }, {
          headers: { 'Accept-Language': getLocaleCode(getStoredLocale()) },
        });
        localStorage.setItem('access_token', data.access);
        processQueue(null, data.access);
        req.headers.Authorization = `Bearer ${data.access}`;
        return api(req);
      } catch (e) {
        processQueue(e, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ═══ AUTH ═══
export const authAPI = {
  login: (username, password) => api.post('/auth/login/', { username, password }),
  register: (data) => api.post('/register/', data),
  sendCode: (email) => api.post('/send-code/', { email }),
  loginWithCode: (email, code) => api.post('/login-code/', { email, code }),
  refreshToken: (refresh) => api.post('/auth/refresh/', { refresh }),
  logout: () => {
    const refresh = localStorage.getItem('refresh_token');
    return api.post('/auth/logout/', refresh ? { refresh } : {});
  },
  changePassword: (old_password, new_password) =>
    api.post('/auth/change-password/', { old_password, new_password }),
};

// ═══ USER / PROFILE ═══
export const userAPI = {
  getMe: () => api.get('/me/'),
  updateMe: (data) => api.patch('/me/', data),
  getStats: () => api.get('/stats/'),
};

// ═══ PATIENTS ═══
export const patientsAPI = {
  getAll: (params) => api.get('/patients/', { params }),
  getById: (id) => api.get(`/patients/${id}/`),
  create: (data) => api.post('/patients/', data),
  update: (id, data) => api.patch(`/patients/${id}/`, data),
  delete: (id) => api.delete(`/patients/${id}/`),
  attach: (patientId) => api.post('/patients/attach/', { patient_id: patientId }),
  getHistory: (id) => api.get(`/patients/${id}/history/`),
  getPatientUsers: () => api.get('/patients/patient_users/'),
  fromUser: (data) => api.post('/patients/from_user/', data),
};

// ═══ CONSULTATIONS ═══
export const consultationsAPI = {
  getAll: (params) => api.get('/consultations/', { params }),
  getById: (id) => api.get(`/consultations/${id}/`),
  create: (formData) => api.post('/consultations/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.patch(`/consultations/${id}/`, data),
  delete: (id) => api.delete(`/consultations/${id}/`),
  updateStatus: (id, status) => api.patch(`/consultations/${id}/status/`, { status }),
  regenerate: (id) => api.post(`/consultations/${id}/regenerate/`),
  share: (id, shared_with, message) => api.post(`/consultations/${id}/share/`, { shared_with, message }),
  getShares: (id) => api.get(`/consultations/${id}/share/`),
  startProcessing: (id) => api.post(`/consultations/${id}/start_processing/`),
  getProcessingStatus: (id) => api.get(`/consultations/${id}/start_processing/`),
  editReport: (id, data) => api.patch(`/consultations/${id}/edit_report/`, data),
  downloadPDF: (id) => api.get(`/consultations/${id}/download_pdf/`, { responseType: 'blob' }),
  getReportHistory: (id) => api.get(`/consultations/${id}/report_history/`),
  exportCSV: (params) => api.get('/consultations/export/', { params, responseType: 'blob' }),
};

// ═══ ANALYSIS IMAGES ═══
export const imagesAPI = {
  getByConsultation: (consultationId) => api.get('/analysis-images/', { params: { consultation: consultationId } }),
  upload: (consultationId, file, description) => {
    const fd = new FormData();
    fd.append('consultation', consultationId);
    fd.append('image', file);
    if (description) fd.append('description', description);
    return api.post('/analysis-images/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  delete: (id) => api.delete(`/analysis-images/${id}/`),
};

// ═══ APPOINTMENTS ═══
export const appointmentsAPI = {
  getAll: (params) => api.get('/appointments/', { params }),
  create: (data) => api.post('/appointments/', data),
  update: (id, data) => api.patch(`/appointments/${id}/`, data),
  delete: (id) => api.delete(`/appointments/${id}/`),
  getToday: () => api.get('/appointments/today/'),
  getUpcoming: () => api.get('/appointments/upcoming/'),
  cancel: (id) => api.post(`/appointments/${id}/cancel/`),
  complete: (id) => api.post(`/appointments/${id}/complete/`),
};

// ═══ NOTIFICATIONS ═══
export const notificationsAPI = {
  getAll: () => api.get('/notifications/'),
  markRead: (id) => api.post(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
};

// ═══ TEMPLATES ═══
export const templatesAPI = {
  getAll: (params) => api.get('/templates/', { params }),
  getById: (id) => api.get(`/templates/${id}/`),
  create: (data) => api.post('/templates/', data),
  update: (id, data) => api.patch(`/templates/${id}/`, data),
  delete: (id) => api.delete(`/templates/${id}/`),
  apply: (id, consultationId) => api.post(`/templates/${id}/apply/`, { consultation_id: consultationId }),
};

// ═══ DIAGNOSES (ICD-10) ═══
export const diagnosesAPI = {
  search: (params) => api.get('/diagnoses/', { params }),
};

// ═══ ADMIN ═══
export const adminAPI = {
  getUsers: (params) => api.get('/users/', { params }),
  updateUser: (id, data) => api.patch(`/users/${id}/`, data),
  activateUser: (id) => api.post(`/users/${id}/activate/`),
  deactivateUser: (id) => api.post(`/users/${id}/deactivate/`),
  getAuditLog: (params) => api.get('/audit-log/', { params }),
  getMonthlyReport: (params) => api.get('/reports/monthly/', { params }),
};

// ═══ FEEDBACK ═══
export const feedbackAPI = {
  getAll: () => api.get('/feedback/'),
  create: (data) => api.post('/feedback/', data),
  getStats: () => api.get('/feedback/stats/'),
};

// ═══ ORGANIZATIONS ═══
export const chatAPI = {
  getHistory: () => api.get('/chat/'),
  sendMessage: (message) => api.post('/chat/', { message }),
  clearHistory: () => api.delete('/chat/clear/'),
};

export const organizationsAPI = {
  getAll: () => api.get('/organizations/'),
};

export default api;
