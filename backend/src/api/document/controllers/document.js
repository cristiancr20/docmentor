'use strict';

/**
 * document controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');

const coreController = createCoreController('api::document.document');

module.exports = {
  ...coreController,

  async create(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'CREATE_DOCUMENT', strapi);
    if (!hasPermission) return;

    return coreController.create(ctx);
  },

  async update(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'UPDATE_DOCUMENT', strapi);
    if (!hasPermission) return;

    return coreController.update(ctx);
  },

  async delete(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'DELETE_DOCUMENT', strapi);
    if (!hasPermission) return;

    return coreController.delete(ctx);
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

    const updatedDocument = await strapi.entityService.update('api::document.document', id, {
      data: { status },
    });

    ctx.send({ data: updatedDocument });
  },
};
