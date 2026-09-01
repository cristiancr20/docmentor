'use strict';

/**
 * document custom routes
 */

module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/documents/:id/status',
      handler: 'api::document.document.changeStatus',
      config: { auth: false },
    },
    // Marcar una versión como revisada o pendiente. Antes el cliente lo hacía
    // con un PUT genérico al documento, que exige UPDATE_DOCUMENT: un tutor no
    // lo tiene, así que recibía 403. Revisar es su función, y para eso está
    // REVIEW_DOCUMENT.
    {
      method: 'PUT',
      path: '/documents/:id/review',
      handler: 'api::document.document.setReviewed',
      config: { auth: false },
    },
    // Restaurar una versión anterior como versión nueva. Es una entrega, así
    // que exige CREATE_DOCUMENT: la hace el estudiante, no el tutor.
    {
      method: 'POST',
      path: '/documents/:id/restore',
      handler: 'api::document.document.restoreVersion',
      config: { auth: false },
    },
  ],
};
