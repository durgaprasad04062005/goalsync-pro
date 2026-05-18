import api from './axios';

export const loginAPI          = (data)  => api.post('/auth/login', data);
export const registerAPI       = (data)  => api.post('/auth/register', data);
export const getMeAPI          = ()      => api.get('/auth/me');
export const updateProfileAPI  = (data)  => api.put('/auth/profile', data);
export const changePasswordAPI = (data)  => api.put('/auth/change-password', data);
export const forgotPasswordAPI = (data)  => api.post('/auth/forgot-password', data);
export const resetPasswordAPI  = (data)  => api.post('/auth/reset-password', data);
export const getPendingAccountsAPI = ()  => api.get('/auth/pending-accounts');
export const approveAccountAPI = (id, data) => api.patch(`/auth/approve-account/${id}`, data);
