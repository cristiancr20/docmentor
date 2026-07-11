'use strict';

/**
 * audit controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');

const coreController = createCoreController('api::audit.audit');

module.exports = {
  ...coreController,

  async find(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'VIEW_AUDIT_LOGS', strapi);
    if (!hasPermission) return;

    const { userId, entityType, entityId, startDate, endDate, page = 1, pageSize = 20 } = ctx.query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (entityType) filters.entityType = entityType;
    if (entityId) filters.entityId = entityId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await strapi.service('api::audit.audit').getAuditLogs(
      filters,
      parseInt(page),
      parseInt(pageSize)
    );

    ctx.body = result;
  },
};
