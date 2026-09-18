'use strict';

/**
 * permission router
 *
 * Catálogo: la lectura solo exige sesión; la escritura, MANAGE_PERMISSIONS.
 * Sin `auth: false` en las rutas core (ver document/routes/document.js).
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const authenticated = 'global::is-authenticated';
const withPermission = (code) => ({ name: 'global::has-permission', config: { code } });

module.exports = createCoreRouter('api::permission.permission', {
  config: {
    find: { policies: [authenticated] },
    findOne: { policies: [authenticated] },
    create: { policies: [authenticated, withPermission('MANAGE_PERMISSIONS')] },
    update: { policies: [authenticated, withPermission('MANAGE_PERMISSIONS')] },
    delete: { policies: [authenticated, withPermission('MANAGE_PERMISSIONS')] },
  },
});
