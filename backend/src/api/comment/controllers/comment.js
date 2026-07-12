'use strict';

/**
 * comment controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');

const coreController = createCoreController('api::comment.comment');

module.exports = {
  ...coreController,

  async create(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_COMMENTS', strapi);
    if (!hasPermission) return;

    const result = await coreController.create(ctx);

    if (result?.data?.id) {
      await strapi
        .service('api::notification.notification')
        .notifyCommentReceived(result.data.id, user.id);
    }

    return result;
  },

  async update(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_COMMENTS', strapi);
    if (!hasPermission) return;

    return coreController.update(ctx);
  },

  async delete(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_COMMENTS', strapi);
    if (!hasPermission) return;

    return coreController.delete(ctx);
  },
};
