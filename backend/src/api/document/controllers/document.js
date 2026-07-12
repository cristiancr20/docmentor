'use strict';

/**
 * document controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');

module.exports = createCoreController('api::document.document', ({ strapi }) => ({
  async create(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'CREATE_DOCUMENT', strapi);
    if (!hasPermission) return;

    const result = await super.create(ctx);

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'CREATE_DOCUMENT',
      'document',
      result.data.id,
      user.id,
      null,
      result.data,
      ipAddress
    );

    await strapi
      .service('api::notification.notification')
      .notifyDocumentUploaded(result.data.id, user.id);

    return result;
  },

  async update(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'UPDATE_DOCUMENT', strapi);
    if (!hasPermission) return;

    const { id } = ctx.params;
    const oldDocument = await strapi.entityService.findOne('api::document.document', id);

    const result = await super.update(ctx);

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'UPDATE_DOCUMENT',
      'document',
      id,
      user.id,
      oldDocument,
      result.data,
      ipAddress
    );

    return result;
  },

  async delete(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'DELETE_DOCUMENT', strapi);
    if (!hasPermission) return;

    const { id } = ctx.params;
    const document = await strapi.entityService.findOne('api::document.document', id);

    const result = await super.delete(ctx);

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'DELETE_DOCUMENT',
      'document',
      id,
      user.id,
      document,
      null,
      ipAddress
    );

    return result;
  },

  async changeStatus(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'REVIEW_DOCUMENT', strapi);
    if (!hasPermission) return;

    const { id } = ctx.params;
    const { status } = ctx.request.body;

    const validStatuses = ['Subido', 'En Revisión', 'Aprobado', 'Cambios Solicitados', 'Archivado'];
    if (!validStatuses.includes(status)) {
      return ctx.badRequest('Estado inválido');
    }

    const document = await strapi.entityService.findOne('api::document.document', id);
    if (!document) {
      return ctx.notFound('Documento no encontrado');
    }

    const currentStatus = document.status;
    const validTransitions = {
      'Subido': ['En Revisión'],
      'En Revisión': ['Aprobado', 'Cambios Solicitados'],
      'Cambios Solicitados': ['En Revisión'],
      'Aprobado': ['Archivado'],
      'Archivado': [],
    };

    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
      return ctx.badRequest(`Transición no permitida de ${currentStatus} a ${status}`);
    }

    const oldStatus = document.status;
    const updatedDocument = await strapi.entityService.update('api::document.document', id, {
      data: { status },
    });

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'CHANGE_DOCUMENT_STATUS',
      'document',
      id,
      user.id,
      { status: oldStatus },
      { status },
      ipAddress
    );

    await strapi
      .service('api::notification.notification')
      .notifyDocumentStatusChanged(id, status, user.id);

    ctx.send({ data: updatedDocument });
  },
}));
