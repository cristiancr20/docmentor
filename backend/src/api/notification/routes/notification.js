'use strict';

/**
 * notification router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Las rutas personalizadas van primero para que '/notifications/me'
// no sea capturada por la ruta core '/notifications/:id'
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/notifications/me',
      handler: 'api::notification.notification.findMine',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/notifications/me/read-all',
      handler: 'api::notification.notification.markAllRead',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/notifications/me/preferences',
      handler: 'api::notification.notification.getPreferences',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/notifications/me/preferences',
      handler: 'api::notification.notification.updatePreferences',
      config: { auth: false },
    },
    {
      method: 'PUT',
      path: '/notifications/:id/read',
      handler: 'api::notification.notification.markRead',
      config: { auth: false },
    },
    ...createCoreRouter('api::notification.notification').routes,
  ],
};
