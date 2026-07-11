'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::permission.permission', ({ strapi }) => ({
  async delete(ctx) {
    const { id } = ctx.params;
    await strapi.entityService.update('api::permission.permission', id, {
      data: { isActive: false },
    });
    ctx.body = { data: { id, message: 'Permiso desactivado' } };
  },
}));
