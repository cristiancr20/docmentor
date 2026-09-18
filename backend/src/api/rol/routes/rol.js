'use strict';

/**
 * rol router
 *
 * Catálogo: la lectura solo exige sesión; la escritura, MANAGE_ROLES. Sin
 * `auth: false` en las rutas core (ver document/routes/document.js).
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const authenticated = 'global::is-authenticated';
const withPermission = (code) => ({ name: 'global::has-permission', config: { code } });

module.exports = createCoreRouter('api::rol.rol', {
  config: {
    find: { policies: [authenticated] },
    findOne: { policies: [authenticated] },
    create: { policies: [authenticated, withPermission('MANAGE_ROLES')] },
    update: { policies: [authenticated, withPermission('MANAGE_ROLES')] },
    delete: { policies: [authenticated, withPermission('MANAGE_ROLES')] },
  },
});
