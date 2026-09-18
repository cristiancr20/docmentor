'use strict';

/**
 * audit custom routes
 *
 * Aquí no se pone `auth: false`: estas rutas siempre han pasado por la auth de
 * users-permissions (el rol `authenticated` necesita `api::audit.audit.find` y
 * `api::audit.audit.export`, que concede el seed). Las policies añaden la
 * sesión propia y VIEW_AUDIT_LOGS, que antes exigía el handler.
 */

const authenticated = 'global::is-authenticated';
const withPermission = (code) => ({ name: 'global::has-permission', config: { code } });

module.exports = {
  routes: [
    // La exportación tiene que ir antes del listado: si no, `/audit-logs/export`
    // encaja primero con la ruta de listado y nunca llega aquí.
    {
      method: 'GET',
      path: '/audit-logs/export',
      handler: 'api::audit.audit.export',
      config: {
        policies: [authenticated, withPermission('VIEW_AUDIT_LOGS')],
        middlewares: [],
      },
    },
    // El core router expone el listado en `/api/audits` (pluralName del
    // content-type), pero el frontend siempre ha pedido `/api/audit-logs`, que
    // no existía: el módulo de auditoría devolvía 404. Se publica el alias con
    // el controller custom, que filtra y pagina de verdad.
    {
      method: 'GET',
      path: '/audit-logs',
      handler: 'api::audit.audit.find',
      config: {
        policies: [authenticated, withPermission('VIEW_AUDIT_LOGS')],
        middlewares: [],
      },
    },
  ],
};
