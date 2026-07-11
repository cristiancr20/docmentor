'use strict';

module.exports = (requiredPermission) => {
  return async (policyContext, config, { strapi }) => {
    const { request, state } = policyContext;
    const user = state.user;

    if (!user) {
      strapi.log.warn('Authorization check: No authenticated user');
      return false;
    }

    try {
      const userWithRole = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: {
          rols: {
            populate: {
              permissions: true
            }
          }
        }
      });

      if (!userWithRole || !userWithRole.rols || userWithRole.rols.length === 0) {
        strapi.log.warn(`Authorization denied for user ${user.id}: No role assigned`);
        return false;
      }

      let hasPermission = false;
      for (const rol of userWithRole.rols) {
        if (rol.permissions && rol.permissions.length > 0) {
          hasPermission = rol.permissions.some(
            (perm) => perm.code === requiredPermission && perm.isActive
          );
          if (hasPermission) break;
        }
      }

      if (!hasPermission) {
        strapi.log.warn(
          `Authorization denied for user ${user.id}: Missing permission ${requiredPermission}`
        );
        return false;
      }

      return true;
    } catch (error) {
      strapi.log.error(`Authorization error: ${error.message}`);
      return false;
    }
  };
};
