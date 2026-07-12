import axios from "axios";

import { API_URL } from "./config";
import { decryptData } from "../utils/encryption";

// Los endpoints de notificaciones propias requieren el JWT desencriptado
const getAuthHeaders = () => {
  const encryptedToken = localStorage.getItem("jwtToken");
  if (!encryptedToken) return {};

  try {
    const token = decryptData(encryptedToken);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    console.error("Error al desencriptar el token:", error);
    return {};
  }
};

// Notificaciones propias de los últimos 30 días
export const getMyNotifications = async () => {
  const response = await axios.get(`${API_URL}/api/notifications/me`, {
    headers: getAuthHeaders(),
  });
  return response.data?.data || [];
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await axios.put(
    `${API_URL}/api/notifications/${notificationId}/read`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await axios.put(
    `${API_URL}/api/notifications/me/read-all`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Preferencia de notificación: "email", "in_app" o "both"
export const getNotificationPreference = async () => {
  const response = await axios.get(
    `${API_URL}/api/notifications/me/preferences`,
    { headers: getAuthHeaders() }
  );
  return response.data?.data?.notificationPreference || "both";
};

export const updateNotificationPreference = async (notificationPreference) => {
  const response = await axios.put(
    `${API_URL}/api/notifications/me/preferences`,
    { notificationPreference },
    { headers: getAuthHeaders() }
  );
  return response.data;
};
