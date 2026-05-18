import api from './axios';

export const getDashboardStatsAPI = () => api.get('/admin/dashboard');
export const getSystemAnalyticsAPI = (params) => api.get('/admin/analytics', { params });
export const getAllUsersAPI = (params) => api.get('/admin/users', { params });
export const createUserAPI = (data) => api.post('/admin/users', data);
export const updateUserAPI = (id, data) => api.put(`/admin/users/${id}`, data);
export const deactivateUserAPI = (id) => api.patch(`/admin/users/${id}/deactivate`);
export const getAllDepartmentsAPI = () => api.get('/admin/departments');
export const createDepartmentAPI = (data) => api.post('/admin/departments', data);
export const getGoalCyclesAPI = () => api.get('/admin/cycles');
export const createGoalCycleAPI = (data) => api.post('/admin/cycles', data);
export const updateGoalCycleAPI = (id, data) => api.put(`/admin/cycles/${id}`, data);
export const unlockGoalsAPI = (data) => api.post('/admin/goals/unlock', data);
export const getAuditLogsAPI = (params) => api.get('/admin/audit-logs', { params });
