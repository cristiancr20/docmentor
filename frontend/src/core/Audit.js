import api from './apiClient';

/**
 * Registros de auditoría.
 *
 * `/api/audit-logs` lo sirve un controller propio que lee parámetros PLANOS
 * (`entityType`, `page`, `pageSize`, `startDate`, `endDate`) y responde
 * `{ data, pagination }`. Antes se enviaban con la sintaxis de filtros de
 * Strapi (`filters[entityType][$eq]`, `pagination[page]`), que ese controller
 * ignora: no filtraba nada y siempre devolvía la primera página.
 */
export const getAuditLogs = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    if (filters.userId) params.append('userId', filters.userId);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    params.append('pageSize', filters.pageSize || 50);
    params.append('page', filters.page || 1);

    const response = await api.get(`/api/audit-logs?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
};
