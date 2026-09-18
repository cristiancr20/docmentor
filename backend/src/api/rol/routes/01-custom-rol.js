'use strict';

/**
 * rol custom routes
 *
 * Leer el mapa rol -> permisos solo exige sesión; modificarlo, MANAGE_ROLES.
 */

const authenticated = 'global::is-authenticated';
const withPermission = (code) => ({ name: 'global::has-permission', config: { code } });

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/rols/:id/permissions',
      handler: 'api::rol.rol.getRolePermissions',
      config: { auth: false, policies: [authenticated] },
    },
    {
      method: 'POST',
      path: '/rols/:id/permissions',
      handler: 'api::rol.rol.addRolePermission',
      config: { auth: false, policies: [authenticated, withPermission('MANAGE_ROLES')] },
    },
    {
      method: 'DELETE',
      path: '/rols/:id/permissions/:permissionId',
      handler: 'api::rol.rol.removeRolePermission',
      config: { auth: false, policies: [authenticated, withPermission('MANAGE_ROLES')] },
    },
  ],
};
