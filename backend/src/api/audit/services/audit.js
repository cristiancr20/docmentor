'use strict';

/**
 * audit service
 */

const { createCoreService } = require('@strapi/strapi').factories;

const coreService = createCoreService('api::audit.audit');

module.exports = {
  ...coreService,

  async logAudit(action, entityType, entityId, userId, oldValue, newValue, ipAddress) {
    return strapi.entityService.create('api::audit.audit', {
      data: {
        action,
        entityType,
        entityId: parseInt(entityId),
        userId: parseInt(userId),
        oldValue,
        newValue,
        ipAddress,
      },
    });
  },

  async getAuditLogs(filters = {}, page = 1, pageSize = 20) {
    const { userId, entityType, entityId, startDate, endDate } = filters;

    const where = {};

    if (userId) where.userId = parseInt(userId);
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = parseInt(entityId);

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.$gte = new Date(startDate);
      if (endDate) where.timestamp.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      strapi.db.query('api::audit.audit').findPage({
        where,
        offset: (page - 1) * pageSize,
        limit: pageSize,
        orderBy: { timestamp: 'desc' },
      }),
      strapi.db.query('api::audit.audit').count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    };
  },
};
