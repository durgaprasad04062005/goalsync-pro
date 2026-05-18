import api from './axios';

export const loginAPI = (credentials) => api.post('/auth/login', credentials);
export const registerAPI = (data) => api.post('/auth/register', data);
export const getMeAPI = () => api.get('/auth/me');
export const updateProfileAPI = (data) => api.put('/auth/profile', data);
export const changePasswordAPI = (data) => api.put('/auth/change-password', data);
