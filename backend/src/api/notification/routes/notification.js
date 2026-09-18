'use strict';

/**
 * notification router
 *
 * `find`/`findOne` solo exigen sesión (el controller limita al destinatario);
 * las escrituras exigen MANAGE_NOTIFICATIONS. Sin `auth: false`: los handlers
 * core sanean relaciones (`tutor`) según `ctx.state.auth` (ver
 * document/routes/document.js).
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const authenticated = 'global::is-authenticated';
const withPermission = (code) => ({ name: 'global::has-permission', config: { code } });

module.exports = createCoreRouter('api::notification.notification', {
  config: {
    find: { policies: [authenticated] },
    findOne: { policies: [authenticated] },
    create: { policies: [authenticated, withPermission('MANAGE_NOTIFICATIONS')] },
    update: { policies: [authenticated, withPermission('MANAGE_NOTIFICATIONS')] },
    delete: { policies: [authenticated, withPermission('MANAGE_NOTIFICATIONS')] },
  },
});
