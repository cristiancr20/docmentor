import axios from 'axios';
import { API_URL } from './config';

export const getAuditLogs = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    if (filters.userId) {
      params.append('filters[userId][$eq]', filters.userId);
    }
    if (filters.entityType) {
      params.append('filters[entityType][$eq]', filters.entityType);
    }
    if (filters.startDate) {
      params.append('filters[timestamp][$gte]', filters.startDate);
    }
    if (filters.endDate) {
      params.append('filters[timestamp][$lte]', filters.endDate);
    }

    params.append('pagination[pageSize]', filters.pageSize || 50);
    params.append('pagination[page]', filters.page || 1);
    params.append('sort[0]', 'timestamp:desc');

    const response = await axios.get(`${API_URL}/api/audit-logs?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
};
