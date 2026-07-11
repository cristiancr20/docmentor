'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');

const coreController = createCoreController('api::permission.permission');

module.exports = coreController({
  async create(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_PERMISSIONS', strapi);
    if (!hasPermission) return;

    return coreController.create(ctx);
  },

  async update(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_PERMISSIONS', strapi);
    if (!hasPermission) return;

    return coreController.update(ctx);
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
});
