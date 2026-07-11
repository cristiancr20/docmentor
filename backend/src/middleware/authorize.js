'use strict';

module.exports = (requiredPermission) => {
  return (config, { strapi }) => {
    return async (ctx, next) => {
      const user = ctx.state.user;

      if (!user) {
        strapi.log.warn('Authorization check: No authenticated user');
        return ctx.unauthorized('User not authenticated');
      }

      try {
        // Fetch the user with their role populated
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
          return ctx.forbidden('User has no role assigned');
        }

        // Check if any of the user's roles has the required permission
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
            `Authorization denied for user ${user.id} (role: ${userWithRole.rols[0]?.name}): Missing permission ${requiredPermission}`
          );
          return ctx.forbidden(`Permission denied: ${requiredPermission} required`);
        }

        return next();
      } catch (error) {
        strapi.log.error(`Authorization error: ${error.message}`);
        return ctx.internalServerError('Authorization check failed');
      }
    };
  };
};
