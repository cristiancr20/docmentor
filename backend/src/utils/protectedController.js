'use strict';

const jwt = require('jsonwebtoken');

const getToken = (ctx) => {
  return ctx.request.headers.authorization?.replace('Bearer ', '');
};

const authenticate = async (ctx, strapi) => {
  const token = getToken(ctx);
  if (!token) {
    ctx.unauthorized('No token provided');
    return null;
  }

  let payload;
  try {
    // El `jwt.verify` del plugin devuelve una Promise; se verifica aquí con el
    // mismo secret. `algorithms` se fija de forma explícita para no depender del
    // header `alg` que manda el cliente.
    const secret = strapi.config.get('plugin.users-permissions.jwtSecret');
    payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch (error) {
    strapi.log.warn(`Authentication failed: ${error.message}`);
    ctx.unauthorized('Invalid or expired token');
    return null;
  }

  // Un token sigue siendo criptográficamente válido hasta que expira, así que
  // sin esta comprobación un usuario borrado, bloqueado o desactivado seguía
  // operando con normalidad durante días.
  const account = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: payload.id },
    select: ['id', 'blocked', 'isActive'],
  });

  if (!account || account.blocked || account.isActive === false) {
    strapi.log.warn(`Authentication rejected for user ${payload.id}: cuenta inexistente o inactiva`);
    ctx.unauthorized('Invalid or expired token');
    return null;
  }

  // `ctx.state.user` deja la petición como autenticada para el resto de Strapi
  // (sanitizeOutput, policies), no solo para nuestros controllers.
  ctx.state.user = account;

  return payload;
};

const authorize = async (ctx, userId, requiredPermission, strapi) => {
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
        `Authorization denied for user ${userId} (role: ${userWithRole.rols[0]?.name}): Missing permission ${requiredPermission}`
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
  getToken,
  authenticate,
  authorize,
};
