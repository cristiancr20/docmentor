'use strict';

/**
 * document custom routes
 */

module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/documents/:id/status',
      handler: 'api::document.document.changeStatus',
      config: { auth: false },
    },
  ],
};
