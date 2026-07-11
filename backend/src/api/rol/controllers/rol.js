'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::rol.rol', ({ strapi }) => ({
  async delete(ctx) {
    const { id } = ctx.params;
    await strapi.entityService.update('api::rol.rol', id, {
      data: { isActive: false },
    });
    ctx.body = { data: { id, message: 'Rol desactivado' } };
  },
}));