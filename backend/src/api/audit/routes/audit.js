'use strict';

/**
 * audit router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/audit-logs/export',
      handler: 'api::audit.audit.export',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    ...createCoreRouter('api::audit.audit').routes,
  ],
};
