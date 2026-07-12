'use strict';

/**
 * audit custom routes
 */

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
  ],
};
