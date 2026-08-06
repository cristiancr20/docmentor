'use strict';

/**
 * comment controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');

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
