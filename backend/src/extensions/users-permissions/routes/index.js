'use strict';

/**
 * Rutas custom que se inyectan en el plugin users-permissions vía strapi-server.js.
 * Handler en formato corto ('user.<accion>') y `prefix: ''` para que la ruta
 * quede montada bajo /api sin el prefijo del plugin.
 *
 * La autenticación y el permiso se declaran en la ruta: `global::is-authenticated`
 * deja el usuario (con `rols.permissions`) en `ctx.state.user` y
 * `global::has-permission` comprueba el código que antes exigía cada handler.
 */

const authenticated = 'global::is-authenticated';
const withPermission = (code) => ({ name: 'global::has-permission', config: { code } });

module.exports = [
  {
    method: 'GET',
    path: '/auth/me/permissions',
    handler: 'user.getMyPermissions',
    config: { prefix: '', auth: false, policies: [authenticated] },
  },
  {
    method: 'DELETE',
    path: '/users/:id/anonymize',
    handler: 'user.anonymize',
    config: { prefix: '', auth: false, policies: [authenticated, withPermission('ANONYMIZE_USER')] },
  },
  {
    method: 'GET',
    path: '/admin/users',
    handler: 'user.adminListUsers',
    config: { prefix: '', auth: false, policies: [authenticated, withPermission('VIEW_USERS')] },
  },
  {
    method: 'POST',
    path: '/admin/users',
    handler: 'user.adminCreateUser',
    config: { prefix: '', auth: false, policies: [authenticated, withPermission('MANAGE_USERS')] },
  },
  {
    method: 'PUT',
    path: '/admin/users/:id',
    handler: 'user.adminUpdateUser',
    config: { prefix: '', auth: false, policies: [authenticated, withPermission('MANAGE_USERS')] },
  },
  {
    method: 'DELETE',
    path: '/admin/users/:id',
    handler: 'user.adminDeleteUser',
    config: { prefix: '', auth: false, policies: [authenticated, withPermission('MANAGE_USERS')] },
  },
];
