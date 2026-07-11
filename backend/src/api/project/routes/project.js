'use strict';

/**
 * project router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = [
  ...createCoreRouter('api::project.project'),
  {
    method: 'PUT',
    path: '/projects/:id/change-status',
    handler: 'api::project.project.changeStatus',
    config: { auth: false },
  },
];
