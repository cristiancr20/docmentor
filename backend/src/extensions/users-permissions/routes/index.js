'use strict';

/**
 * Rutas custom que se inyectan en el plugin users-permissions vía strapi-server.js.
 * Handler en formato corto ('user.<accion>') y `prefix: ''` para que la ruta
 * quede montada bajo /api sin el prefijo del plugin.
 */

module.exports = [
  {
    method: 'GET',
    path: '/auth/me/permissions',
    handler: 'user.getMyPermissions',
    config: { prefix: '', auth: false },
  },
  {
    method: 'DELETE',
    path: '/users/:id/anonymize',
    handler: 'user.anonymize',
    config: { prefix: '', auth: false },
  },
  {
    method: 'GET',
    path: '/admin/users',
    handler: 'user.adminListUsers',
    config: { prefix: '', auth: false },
  },
  {
    method: 'POST',
    path: '/admin/users',
    handler: 'user.adminCreateUser',
    config: { prefix: '', auth: false },
  },
  {
    method: 'PUT',
    path: '/admin/users/:id',
    handler: 'user.adminUpdateUser',
    config: { prefix: '', auth: false },
  },
  {
    method: 'DELETE',
    path: '/admin/users/:id',
    handler: 'user.adminDeleteUser',
    config: { prefix: '', auth: false },
  },
];
