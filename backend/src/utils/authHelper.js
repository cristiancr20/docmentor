'use strict';

const verifyToken = (ctx) => {
  const token = ctx.request.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    ctx.unauthorized('No token provided');
    return null;
  }

  try {
    const decoded = strapi.plugins['users-permissions'].services.jwt.verify(token);
    return decoded;
  } catch (error) {
    strapi.log.warn(`Authentication failed: ${error.message}`);
    ctx.unauthorized('Invalid or expired token');
    return null;
  }
};

const checkPermission = async (ctx, userId, requiredPermission) => {
  try {
    const userWithRole = await strapi.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: {
        rols: {
          populate: {
            permissions: true
          }
        }
      }
    });

    if (!userWithRole || !userWithRole.rols || userWithRole.rols.length === 0) {
      strapi.log.warn(`Authorization denied for user ${userId}: No role assigned`);
      ctx.forbidden('User has no role assigned');
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
        `Authorization denied for user ${userId}: Missing permission ${requiredPermission}`
      );
      ctx.forbidden(`Permission denied: ${requiredPermission} required`);
      return false;
    }

    return true;
  } catch (error) {
    strapi.log.error(`Authorization error: ${error.message}`);
    ctx.internalServerError('Authorization check failed');
    return false;
  }
};

module.exports = {
  verifyToken,
  checkPermission,
};
