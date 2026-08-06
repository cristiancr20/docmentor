'use strict';

/**
 * comment controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');

/**
 * La relación `documents` admite un id suelto, un array de ids o el formato
 * { connect: [...] }, según cómo la mande el cliente. Se normaliza a lista.
 */
const toIdList = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map((item) => item?.id ?? item).filter(Boolean);
  if (typeof value === 'object') return toIdList(value.connect ?? value.set ?? value.id);
  return [value];
};

module.exports = createCoreController('api::comment.comment', ({ strapi }) => ({
  async create(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_COMMENTS', strapi);
    if (!hasPermission) return;

    // La autoría la fija el servidor. Venía en el body, así que se podía
    // publicar una corrección firmada por otro tutor.
    ctx.request.body = ctx.request.body || {};
    ctx.request.body.data = { ...(ctx.request.body.data || {}), correctionTutor: user.id };

    const result = await super.create(ctx);

    if (result?.data?.id) {
      // Una corrección implica que el documento vuelve a estar pendiente. Lo
      // hacía el cliente con un PUT a /api/documents/:id, pero eso exige
      // UPDATE_DOCUMENT, que un tutor no tiene: recibía 403 y el comentario
      // quedaba guardado sin que la vista se enterara. Es una regla del
      // servidor, no una orquestación del cliente.
      const documentIds = toIdList(ctx.request.body.data?.documents);

      for (const documentId of documentIds) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await strapi.entityService.update('api::document.document', documentId, {
            data: { isRevised: false },
          });
        } catch (error) {
          strapi.log.warn(
            `No se pudo marcar el documento ${documentId} como pendiente: ${error.message}`
          );
        }
      }

      await strapi
        .service('api::notification.notification')
        .notifyCommentReceived(result.data.id, user.id);
    }

    return result;
  },

  async update(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_COMMENTS', strapi);
    if (!hasPermission) return;

    // Tampoco se puede reasignar la autoría al editar.
    if (ctx.request.body?.data) {
      delete ctx.request.body.data.correctionTutor;
    }

    return super.update(ctx);
  },

  async delete(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_COMMENTS', strapi);
    if (!hasPermission) return;

    return super.delete(ctx);
  },
}));
