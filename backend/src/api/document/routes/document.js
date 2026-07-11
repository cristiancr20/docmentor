'use strict';

/**
 * document router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = [
  ...createCoreRouter('api::document.document'),
  {
    method: 'PUT',
    path: '/documents/:id/status',
    handler: 'api::document.document.changeStatus',
    config: { auth: false },
  },
];
