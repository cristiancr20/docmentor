'use strict';

/**
 * setting router
 *
 * La lectura solo exige sesión; la escritura, MANAGE_SETTINGS. Sin
 * `auth: false` en las rutas core (ver document/routes/document.js).
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const authenticated = 'global::is-authenticated';
const withPermission = (code) => ({ name: 'global::has-permission', config: { code } });

module.exports = createCoreRouter('api::setting.setting', {
  config: {
    find: { policies: [authenticated] },
    findOne: { policies: [authenticated] },
    create: { policies: [authenticated, withPermission('MANAGE_SETTINGS')] },
    update: { policies: [authenticated, withPermission('MANAGE_SETTINGS')] },
    delete: { policies: [authenticated, withPermission('MANAGE_SETTINGS')] },
  },
});
