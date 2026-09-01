'use strict';

/**
 * setting controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');

module.exports = createCoreController('api::setting.setting', ({ strapi }) => ({
  async create(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_SETTINGS', strapi);
    if (!hasPermission) return;

    return super.create(ctx);
  },

  async update(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_SETTINGS', strapi);
    if (!hasPermission) return;

    return super.update(ctx);
  },

  async delete(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_SETTINGS', strapi);
    if (!hasPermission) return;

    return super.delete(ctx);
  },
}));
