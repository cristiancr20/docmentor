'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');

module.exports = createCoreController('api::permission.permission', ({ strapi }) => ({
  async create(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_PERMISSIONS', strapi);
    if (!hasPermission) return;

    return super.create(ctx);
  },

  async update(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_PERMISSIONS', strapi);
    if (!hasPermission) return;

    return super.update(ctx);
  },

  async delete(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_PERMISSIONS', strapi);
    if (!hasPermission) return;

    const { id } = ctx.params;
    await strapi.entityService.update('api::permission.permission', id, {
      data: { isActive: false },
    });
    ctx.body = { data: { id, message: 'Permiso desactivado' } };
  },
}));
