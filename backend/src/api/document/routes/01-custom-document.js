'use strict';

/**
 * document custom routes
 *
 * La autenticación y el permiso se declaran aquí, en la ruta, y no dentro del
 * handler: así ningún endpoint queda público por olvidar llamar a
 * `authenticate()`. `global::is-authenticated` deja el usuario (con
 * `rols.permissions`) en `ctx.state.user` y `global::has-permission` comprueba
 * el código indicado sin volver a la base de datos.
 */

const authenticated = 'global::is-authenticated';
const withPermission = (code) => ({ name: 'global::has-permission', config: { code } });

module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/documents/:id/status',
      handler: 'api::document.document.changeStatus',
      config: {
        auth: false,
        policies: [authenticated, withPermission('REVIEW_DOCUMENT')],
      },
    },
    // Marcar una versión como revisada o pendiente. Antes el cliente lo hacía
    // con un PUT genérico al documento, que exige UPDATE_DOCUMENT: un tutor no
    // lo tiene, así que recibía 403. Revisar es su función, y para eso está
    // REVIEW_DOCUMENT.
    {
      method: 'PUT',
      path: '/documents/:id/review',
      handler: 'api::document.document.setReviewed',
      config: {
        auth: false,
        policies: [authenticated, withPermission('REVIEW_DOCUMENT')],
      },
    },
    // Restaurar una versión anterior como versión nueva. Es una entrega, así
    // que exige CREATE_DOCUMENT: la hace el estudiante, no el tutor.
    {
      method: 'POST',
      path: '/documents/:id/restore',
      handler: 'api::document.document.restoreVersion',
      config: {
        auth: false,
        policies: [authenticated, withPermission('CREATE_DOCUMENT')],
      },
    },
  ],
};
