'use strict';

/**
 * notification controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');

const coreController = createCoreController('api::notification.notification');

module.exports = {
  ...coreController,

  async create(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_NOTIFICATIONS', strapi);
    if (!hasPermission) return;

    return coreController.create(ctx);
  },

  async update(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_NOTIFICATIONS', strapi);
    if (!hasPermission) return;

    return coreController.update(ctx);
  },

  async delete(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_NOTIFICATIONS', strapi);
    if (!hasPermission) return;

    return coreController.delete(ctx);
  },
};
