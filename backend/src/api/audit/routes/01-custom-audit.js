'use strict';

/**
 * audit custom routes
 */

module.exports = {
  routes: [
    // La exportación tiene que ir antes del listado: si no, `/audit-logs/export`
    // encaja primero con la ruta de listado y nunca llega aquí.
    {
      method: 'GET',
      path: '/audit-logs/export',
      handler: 'api::audit.audit.export',
      config: {
        policies: [],
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
        policies: [],
        middlewares: [],
      },
    },
  ],
};
