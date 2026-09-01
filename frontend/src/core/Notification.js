import api from './apiClient';

// Notificaciones propias de los últimos 30 días
export const getMyNotifications = async () => {
  const response = await api.get(`/api/notifications/me`);
  return response.data?.data || [];
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.put(
    `/api/notifications/${notificationId}/read`,
    {});
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.put(
    `/api/notifications/me/read-all`,
    {});
  return response.data;
};

// Preferencia de notificación: "email", "in_app" o "both"
export const getNotificationPreference = async () => {
  const response = await api.get(
    `/api/notifications/me/preferences`);
  return response.data?.data?.notificationPreference || "both";
};

export const updateNotificationPreference = async (notificationPreference) => {
  const response = await api.put(
    `/api/notifications/me/preferences`,
    { notificationPreference });
  return response.data;
};
