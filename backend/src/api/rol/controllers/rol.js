/* 'use strict';

/**
 * rol controller
 

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::rol.rol');
 */
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::rol.rol', ({ strapi }) => ({
  async find(ctx) {
    try {
      const { data, meta } = await super.find(ctx);
      return { data, meta };
    } catch (error) {
      ctx.body = error;
      ctx.status = 500;
    }
  },
}));