'use strict';

/**
 * notification custom routes
 *
 * Este archivo se carga antes que el router core (prefijo 01-) para que
 * '/notifications/me' no sea capturada por la ruta core '/notifications/:id'.
 *
 * Todas son operaciones sobre las notificaciones del propio usuario: solo
 * exigen sesión (`global::is-authenticated`); la pertenencia la comprueba el
 * controller.
 */

const authenticated = 'global::is-authenticated';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/notifications/me',
      handler: 'api::notification.notification.findMine',
      config: { auth: false, policies: [authenticated] },
    },
    {
      method: 'PUT',
      path: '/notifications/me/read-all',
      handler: 'api::notification.notification.markAllRead',
      config: { auth: false, policies: [authenticated] },
    },
    {
      method: 'GET',
      path: '/notifications/me/preferences',
      handler: 'api::notification.notification.getPreferences',
      config: { auth: false, policies: [authenticated] },
    },
    {
      method: 'PUT',
      path: '/notifications/me/preferences',
      handler: 'api::notification.notification.updatePreferences',
      config: { auth: false, policies: [authenticated] },
    },
    {
      method: 'PUT',
      path: '/notifications/:id/read',
      handler: 'api::notification.notification.markRead',
      config: { auth: false, policies: [authenticated] },
    },
  ],
};
