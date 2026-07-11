'use strict';

/**
 * rol router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = [
  ...createCoreRouter('api::rol.rol'),
  {
    method: 'GET',
    path: '/rols/:id/permissions',
    handler: 'api::rol.rol.getRolePermissions',
    config: { auth: false },
  },
  {
    method: 'POST',
    path: '/rols/:id/permissions',
    handler: 'api::rol.rol.addRolePermission',
    config: { auth: false },
  },
  {
    method: 'DELETE',
    path: '/rols/:id/permissions/:permissionId',
    handler: 'api::rol.rol.removeRolePermission',
    config: { auth: false },
  },
];
