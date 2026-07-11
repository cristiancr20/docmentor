'use strict';

/**
 * audit controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');
const { generatePDF, generateXLSX } = require('../../../utils/exportReports');

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

  async export(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'VIEW_AUDIT_LOGS', strapi);
    if (!hasPermission) return;

    const { userId, entityType, entityId, startDate, endDate, format = 'pdf' } = ctx.query;

    if (!['pdf', 'xlsx'].includes(format.toLowerCase())) {
      return ctx.badRequest('Invalid format. Supported formats: pdf, xlsx');
    }

    const filters = {};
    if (userId) filters.userId = userId;
    if (entityType) filters.entityType = entityType;
    if (entityId) filters.entityId = entityId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    try {
      const { data, hash } = await strapi.service('api::audit.audit').exportAuditLogs(filters, format.toLowerCase());

      let fileBuffer;
      let contentType;
      let filename;

      if (format.toLowerCase() === 'pdf') {
        fileBuffer = await generatePDF(data, hash);
        contentType = 'application/pdf';
        filename = `audit-report-${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (format.toLowerCase() === 'xlsx') {
        fileBuffer = await generateXLSX(data, hash);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `audit-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      }

      ctx.set('Content-Type', contentType);
      ctx.set('Content-Disposition', `attachment; filename="${filename}"`);
      ctx.set('X-Audit-Hash', hash);

      ctx.body = fileBuffer;
    } catch (error) {
      strapi.log.error(`Error exporting audit logs: ${error.message}`);
      ctx.internalServerError('Failed to export audit logs');
    }
  },
};
