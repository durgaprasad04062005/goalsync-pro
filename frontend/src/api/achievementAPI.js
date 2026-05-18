import api from './axios';

export const updateAchievementAPI = (data) => api.post('/achievements', data);
export const getAchievementsAPI = (goalId) => api.get(`/achievements/goal/${goalId}`);
export const getMyAchievementsAPI = (params) => api.get('/achievements/my', { params });
export const reviewAchievementAPI = (id, data) => api.patch(`/achievements/${id}/review`, data);
export const getTeamAchievementsAPI = (params) => api.get('/achievements/team', { params });
