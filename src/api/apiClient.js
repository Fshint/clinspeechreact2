import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Interceptor: автоматически добавляет Authorization заголовок ───
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Interceptor: автоматический refresh токена при 401 ───
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                isRefreshing = false;
                // Нет refresh токена — выход
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const { data } = await axios.post(`${API_URL}/auth/refresh/`, {
                    refresh: refreshToken,
                });
                localStorage.setItem('access_token', data.access);
                processQueue(null, data.access);
                originalRequest.headers.Authorization = `Bearer ${data.access}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// ═══════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════

export const authAPI = {
    /** Вход по username + password */
    login: (username, password) =>
        api.post('/auth/login/', { username, password }),

    /** Регистрация нового пользователя */
    register: (userData) =>
        api.post('/register/', userData),

    /** Отправить OTP-код на email */
    sendCode: (email) =>
        api.post('/send-code/', { email }),

    /** Вход по email + OTP-код */
    loginWithCode: (email, code) =>
        api.post('/login-code/', { email, code }),

    /** Обновить access токен */
    refreshToken: (refresh) =>
        api.post('/auth/refresh/', { refresh }),

    /** Выход (инвалидация refresh) */
    logout: () => {
        const refresh = localStorage.getItem('refresh_token');
        return api.post('/auth/logout/', refresh ? { refresh } : {});
    },

    /** Смена пароля */
    changePassword: (oldPassword, newPassword) =>
        api.post('/auth/change-password/', {
            old_password: oldPassword,
            new_password: newPassword,
        }),
};

// ═══════════════════════════════════════════════════════════════
//  USER / PROFILE
// ═══════════════════════════════════════════════════════════════

export const userAPI = {
    /** Текущий пользователь */
    getMe: () => api.get('/me/'),

    /** Обновить профиль */
    updateMe: (data) => api.patch('/me/', data),

    /** Статистика/дашборд */
    getStats: () => api.get('/stats/'),
};

// ═══════════════════════════════════════════════════════════════
//  PATIENTS
// ═══════════════════════════════════════════════════════════════

export const patientsAPI = {
    getAll: (params) => api.get('/patients/', { params }),
    getById: (id) => api.get(`/patients/${id}/`),
    create: (data) => api.post('/patients/', data),
    update: (id, data) => api.patch(`/patients/${id}/`, data),
    delete: (id) => api.delete(`/patients/${id}/`),
    attach: (patientId) => api.post('/patients/attach/', { patient_id: patientId }),
};

// ═══════════════════════════════════════════════════════════════
//  CONSULTATIONS
// ═══════════════════════════════════════════════════════════════

export const consultationsAPI = {
    getAll: (params) => api.get('/consultations/', { params }),
    getById: (id) => api.get(`/consultations/${id}/`),

    /** Создать новую консультацию (multipart — аудио + изображения) */
    create: (formData) =>
        api.post('/consultations/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    update: (id, data) => api.patch(`/consultations/${id}/`, data),
    delete: (id) => api.delete(`/consultations/${id}/`),

    /** Изменить статус */
    updateStatus: (id, statusValue) =>
        api.patch(`/consultations/${id}/status/`, { status: statusValue }),

    /** Перегенерировать отчёт */
    regenerate: (id) =>
        api.post(`/consultations/${id}/regenerate/`),

    /** Поделиться консультацией */
    share: (id, userId, message) =>
        api.post(`/consultations/${id}/share/`, {
            shared_with: userId,
            message,
        }),

    /** Запустить ИИ-обработку (транскрибация + генерация отчёта) */
    startProcessing: (id) =>
        api.post(`/consultations/${id}/start_processing/`),

    /** Получить статус обработки и список снимков */
    getProcessingStatus: (id) =>
        api.get(`/consultations/${id}/start_processing/`),

    /** Редактировать отчёт */
    editReport: (id, data) =>
        api.patch(`/consultations/${id}/edit_report/`, data),

    /** Скачать PDF */
    downloadPDF: (id) =>
        api.get(`/consultations/${id}/download_pdf/`, { responseType: 'blob' }),

    /** Экспорт в CSV */
    exportCSV: (params) =>
        api.get('/consultations/export/', { params, responseType: 'blob' }),
};

// ═══════════════════════════════════════════════════════════════
//  ANALYSIS IMAGES
// ═══════════════════════════════════════════════════════════════

export const imagesAPI = {
    getByConsultation: (consultationId) =>
        api.get('/analysis-images/', { params: { consultation: consultationId } }),
    upload: (consultationId, file, description) => {
        const formData = new FormData();
        formData.append('consultation', consultationId);
        formData.append('image', file);
        if (description) formData.append('description', description);
        return api.post('/analysis-images/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    delete: (id) => api.delete(`/analysis-images/${id}/`),
};

// ═══════════════════════════════════════════════════════════════
//  APPOINTMENTS
// ═══════════════════════════════════════════════════════════════

export const appointmentsAPI = {
    getAll: (params) => api.get('/appointments/', { params }),
    create: (data) => api.post('/appointments/', data),
    update: (id, data) => api.patch(`/appointments/${id}/`, data),
    delete: (id) => api.delete(`/appointments/${id}/`),
};

// ═══════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

export const notificationsAPI = {
    getAll: () => api.get('/notifications/'),
    markRead: (id) => api.post(`/notifications/${id}/mark_read/`),
    markAllRead: () => api.post('/notifications/mark_all_read/'),
};

export default api;
