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

  async exportAuditLogs(filters = {}, format = 'pdf') {
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

    const logs = await strapi.db.query('api::audit.audit').findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    // Resolver usuarios involucrados para mostrar nombres en lugar de IDs
    const userIds = [...new Set(logs.map(log => log.userId).filter(Boolean))];
    let usersById = {};
    if (userIds.length > 0) {
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { id: { $in: userIds } },
        fields: ['id', 'username', 'email'],
      });
      usersById = Object.fromEntries(users.map(u => [u.id, u]));
    }

    // Estadísticas para la hoja de resumen
    const changesByAction = {};
    const changesByEntityType = {};
    const activityByUser = {};

    for (const log of logs) {
      changesByAction[log.action] = (changesByAction[log.action] || 0) + 1;
      changesByEntityType[log.entityType] = (changesByEntityType[log.entityType] || 0) + 1;

      if (!activityByUser[log.userId]) {
        const user = usersById[log.userId];
        activityByUser[log.userId] = {
          userId: log.userId,
          userName: user ? user.username : `Usuario ${log.userId}`,
          email: user ? user.email : null,
          totalActions: 0,
          actions: {},
          firstActivity: log.timestamp,
          lastActivity: log.timestamp,
        };
      }

      const activity = activityByUser[log.userId];
      activity.totalActions += 1;
      activity.actions[log.action] = (activity.actions[log.action] || 0) + 1;
      if (log.timestamp) {
        if (!activity.firstActivity || log.timestamp < activity.firstActivity) {
          activity.firstActivity = log.timestamp;
        }
        if (!activity.lastActivity || log.timestamp > activity.lastActivity) {
          activity.lastActivity = log.timestamp;
        }
      }
    }

    const formatData = {
      exportDate: new Date().toISOString(),
      format,
      filters: {
        userId: userId || null,
        entityType: entityType || null,
        entityId: entityId || null,
        startDate: startDate || null,
        endDate: endDate || null,
      },
      totalRecords: logs.length,
      summary: {
        totalChanges: logs.length,
        activeUsers: Object.keys(activityByUser).length,
        changesByAction,
        changesByEntityType,
      },
      userActivity: Object.values(activityByUser).sort((a, b) => b.totalActions - a.totalActions),
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userId: log.userId,
        userName: usersById[log.userId] ? usersById[log.userId].username : `Usuario ${log.userId}`,
        timestamp: log.timestamp,
        oldValue: log.oldValue,
        newValue: log.newValue,
        ipAddress: log.ipAddress,
      })),
    };

    const crypto = require('crypto');
    const dataString = JSON.stringify(formatData);
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');

    return {
      data: formatData,
      hash,
    };
  },
};
