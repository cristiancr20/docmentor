'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

// Autenticación y MANAGE_PERMISSIONS se resuelven en las policies declaradas
// en routes/permission.js. Solo se conserva el borrado lógico.
module.exports = createCoreController('api::permission.permission', ({ strapi }) => ({
  async delete(ctx) {
    const { id } = ctx.params;
    await strapi.entityService.update('api::permission.permission', id, {
      data: { isActive: false },
    });
    ctx.body = { data: { id, message: 'Permiso desactivado' } };
  },
}));
