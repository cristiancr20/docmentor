import api from './apiClient';

// Notificaciones propias de los últimos 30 días.
// `signal` (AbortSignal) permite cancelar la petición en vuelo, p.ej. al
// desmontar el componente que hace polling.
export const getMyNotifications = async ({ signal } = {}) => {
  const response = await api.get(`/api/notifications/me`, { signal });
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
