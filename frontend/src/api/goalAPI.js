import api from './axios';

export const createGoalAPI = (data) => api.post('/goals', data);
export const getMyGoalsAPI = (params) => api.get('/goals/my', { params });
export const updateGoalAPI = (id, data) => api.put(`/goals/${id}`, data);
export const submitGoalsAPI = (data) => api.post('/goals/submit', data);
export const deleteGoalAPI = (id) => api.delete(`/goals/${id}`);
export const getGoalByIdAPI = (id) => api.get(`/goals/${id}`);
export const getTeamGoalsAPI = (params) => api.get('/goals/team/all', { params });
export const approveGoalAPI = (id, data) => api.patch(`/goals/${id}/approve`, data);
export const returnGoalAPI = (id, data) => api.patch(`/goals/${id}/return`, data);
export const pushSharedGoalAPI = (data) => api.post('/goals/shared/push', data);
