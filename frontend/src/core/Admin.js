import api from './apiClient';

/* ==================== USUARIOS (CRUD con soft delete) ==================== */

export const getAdminUsers = async () => {
  try {
    const response = await api.get(`/api/admin/users`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    throw error;
  }
};

export const createAdminUser = async (userData) => {
  try {
    const response = await api.post(`/api/admin/users`, userData);
    return response.data.data;
  } catch (error) {
    console.error("Error al crear usuario:", error);
    throw error;
  }
};

export const updateAdminUser = async (userId, userData) => {
  try {
    const response = await api.put(`/api/admin/users/${userId}`, userData);
    return response.data.data;
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    throw error;
  }
};

// Soft delete: el backend marca isActive=false y blocked=true
export const deleteAdminUser = async (userId) => {
  try {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    throw error;
  }
};

/* ==================== ROLES Y PERMISOS ==================== */

export const getRols = async () => {
  try {
    const response = await api.get(`/api/rols?pagination[pageSize]=100`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error al obtener roles:", error);
    throw error;
  }
};

export const getAllPermissions = async () => {
  try {
    const response = await api.get(`/api/permissions?pagination[pageSize]=100`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    throw error;
  }
};

export const getRolePermissions = async (rolId) => {
  try {
    const response = await api.get(`/api/rols/${rolId}/permissions`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error al obtener permisos del rol:", error);
    throw error;
  }
};

export const addPermissionToRole = async (rolId, permissionId) => {
  try {
    const response = await api.post(
      `/api/rols/${rolId}/permissions`,
      { permissionId });
    return response.data.data || [];
  } catch (error) {
    console.error("Error al agregar permiso al rol:", error);
    throw error;
  }
};

export const removePermissionFromRole = async (rolId, permissionId) => {
  try {
    const response = await api.delete(
      `/api/rols/${rolId}/permissions/${permissionId}`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error al quitar permiso del rol:", error);
    throw error;
  }
};

/* ==================== AUDITORÍA ==================== */

export const getAdminAuditLogs = async (filters = {}) => {
  try {
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
  } catch (error) {
    console.error("Error al obtener logs de auditoría:", error);
    throw error;
  }
};

export const exportAuditReport = async (format, filters = {}) => {
  try {
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
  } catch (error) {
    console.error("Error al exportar reporte de auditoría:", error);
    throw error;
  }
};

/* ==================== CONFIGURACIÓN ==================== */

export const getSettings = async () => {
  try {
    const response = await api.get(`/api/settings?sort=id:asc`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    throw error;
  }
};

export const createSetting = async (data) => {
  try {
    const response = await api.post(
      `/api/settings`,
      { data });
    return response.data;
  } catch (error) {
    console.error("Error al crear configuración:", error);
    throw error;
  }
};

export const updateSetting = async (settingId, data) => {
  try {
    const response = await api.put(
      `/api/settings/${settingId}`,
      { data });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    throw error;
  }
};

// Marcar un email SMTP como el actual (desmarca el resto)
export const setActualEmail = async (settings, emailId) => {
  try {
    await Promise.all(
      settings
        .filter((s) => s.attributes?.isActual && s.id !== emailId)
        .map((s) => updateSetting(s.id, { isActual: false }))
    );
    return updateSetting(emailId, { isActual: true });
  } catch (error) {
    console.error("Error al actualizar el email actual:", error);
    throw error;
  }
};
