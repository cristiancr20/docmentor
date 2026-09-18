'use strict';

/**
 * audit router
 *
 * La lectura exige VIEW_AUDIT_LOGS. La pista de auditoría solo la escribe el
 * backend: create/update/delete quedan con sesión + la auth de
 * users-permissions, que el seed no concede al rol `authenticated`.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const authenticated = 'global::is-authenticated';
const withPermission = (code) => ({ name: 'global::has-permission', config: { code } });

module.exports = createCoreRouter('api::audit.audit', {
  config: {
    find: { policies: [authenticated, withPermission('VIEW_AUDIT_LOGS')] },
    findOne: { policies: [authenticated, withPermission('VIEW_AUDIT_LOGS')] },
    create: { policies: [authenticated] },
    update: { policies: [authenticated] },
    delete: { policies: [authenticated] },
  },
});
