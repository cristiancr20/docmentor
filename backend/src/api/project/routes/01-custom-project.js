'use strict';

/**
 * project custom routes
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
      path: '/projects/:id/change-status',
      handler: 'api::project.project.changeStatus',
      config: {
        auth: false,
        policies: [authenticated, withPermission('CHANGE_PROJECT_STATUS')],
      },
    },
  ],
};
