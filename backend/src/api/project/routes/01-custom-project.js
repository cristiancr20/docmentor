'use strict';

/**
 * project custom routes
 */

module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/projects/:id/change-status',
      handler: 'api::project.project.changeStatus',
      config: { auth: false },
    },
  ],
};
