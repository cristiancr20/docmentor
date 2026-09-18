import api from './apiClient';

/* ==================== USUARIOS (CRUD con soft delete) ==================== */

export const getAdminUsers = async () =>
  (await api.get(`/api/admin/users`)).data.data || [];

export const createAdminUser = async (userData) =>
  (await api.post(`/api/admin/users`, userData)).data.data;

export const updateAdminUser = async (userId, userData) =>
  (await api.put(`/api/admin/users/${userId}`, userData)).data.data;

// Soft delete: el backend marca isActive=false y blocked=true
export const deleteAdminUser = async (userId) =>
  (await api.delete(`/api/admin/users/${userId}`)).data.data;

/* ==================== ROLES Y PERMISOS ==================== */

export const getRols = async () =>
  (await api.get(`/api/rols?pagination[pageSize]=100`)).data.data || [];

export const getAllPermissions = async () =>
  (await api.get(`/api/permissions?pagination[pageSize]=100`)).data.data || [];

export const getRolePermissions = async (rolId) =>
  (await api.get(`/api/rols/${rolId}/permissions`)).data.data || [];

export const addPermissionToRole = async (rolId, permissionId) =>
  (await api.post(`/api/rols/${rolId}/permissions`, { permissionId })).data.data || [];

export const removePermissionFromRole = async (rolId, permissionId) =>
  (await api.delete(`/api/rols/${rolId}/permissions/${permissionId}`)).data.data || [];

/* ==================== AUDITORÍA ==================== */

export const getAdminAuditLogs = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.userId) params.append("userId", filters.userId);
  if (filters.entityType) params.append("entityType", filters.entityType);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  params.append("page", filters.page || 1);
  params.append("pageSize", filters.pageSize || 100);

  const response = await api.get(`/api/audit-logs?${params.toString()}`);

  // El servicio devuelve { data: { results, pagination } } (findPage) o { data: [...] }
  const payload = response.data?.data;
  if (Array.isArray(payload)) return payload;
  return payload?.results || [];
};

export const exportAuditReport = async (format, filters = {}) => {
  const params = new URLSearchParams();
  params.append("format", format);
  if (filters.userId) params.append("userId", filters.userId);
  if (filters.entityType) params.append("entityType", filters.entityType);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const response = await api.get(`/api/audit-logs/export?${params.toString()}`, {
    responseType: "blob",
  });

  // Descargar el archivo en el navegador
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `audit-report-${new Date().toISOString().split("T")[0]}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return response.headers["x-audit-hash"] || null;
};

/* ==================== CONFIGURACIÓN ==================== */

export const getSettings = async () =>
  (await api.get(`/api/settings?sort=id:asc`)).data.data || [];

export const createSetting = async (data) =>
  (await api.post(`/api/settings`, { data })).data;

export const updateSetting = async (settingId, data) =>
  (await api.put(`/api/settings/${settingId}`, { data })).data;

// Marcar un email SMTP como el actual (desmarca el resto)
export const setActualEmail = async (settings, emailId) => {
  await Promise.all(
    settings
      .filter((s) => s.attributes?.isActual && s.id !== emailId)
      .map((s) => updateSetting(s.id, { isActual: false }))
  );
  return updateSetting(emailId, { isActual: true });
};
