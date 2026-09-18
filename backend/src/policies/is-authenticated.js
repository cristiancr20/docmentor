'use strict';

/**
 * Policy `global::is-authenticated`.
 *
 * Verifica el Bearer JWT y carga al usuario con sus `rols.permissions` en una
 * sola consulta, dejándolo en `ctx.state.user` para que `global::has-permission`
 * (y el controller) no tengan que volver a la base de datos.
 *
 * Sustituye a `authenticate()` + `authorize()` de utils/protectedController.js,
 * que hacían dos consultas por petición y respondían a mano desde el controller.
 * Como policy, devolver `false` hace que Strapi responda 403 (PolicyError); por
 * eso aquí nunca se lanza ni se toca `ctx.body`.
 */

const jwt = require('jsonwebtoken');

const USER_UID = 'plugin::users-permissions.user';

// Acepta únicamente `Authorization: Bearer <token>`; cualquier otro esquema o
// una cabecera con más de dos partes se trata como "sin token".
const getBearerToken = (policyContext) => {
  const header = policyContext.request?.headers?.authorization;
  if (typeof header !== 'string') {
    return null;
  }

  const parts = header.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
};

module.exports = async (policyContext, config, { strapi }) => {
  try {
    const token = getBearerToken(policyContext);
    if (!token) {
      return false;
    }

    let payload;
    try {
      // `algorithms` se fija de forma explícita para no depender del header
      // `alg` que manda el cliente (el `verify` del plugin no lo restringe).
      const secret = strapi.config.get('plugin.users-permissions.jwtSecret');
      payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    } catch (error) {
      strapi.log.warn(`is-authenticated: token rechazado (${error.message})`);
      return false;
    }

    if (!payload || payload.id === undefined || payload.id === null) {
      return false;
    }

    // Un token sigue siendo criptográficamente válido hasta que expira, así
    // que hay que comprobar el estado actual de la cuenta en cada petición.
    const user = await strapi.db.query(USER_UID).findOne({
      where: { id: payload.id },
      populate: {
        rols: {
          populate: { permissions: true },
        },
      },
    });

    if (!user || user.blocked || user.isActive === false) {
      strapi.log.warn(
        `is-authenticated: usuario ${payload.id} rechazado (cuenta inexistente, bloqueada o inactiva)`
      );
      return false;
    }

    // `ctx.state.user` deja la petición como autenticada para el resto de
    // Strapi (sanitizeOutput, otras policies, el controller).
    policyContext.state.user = user;

    return true;
  } catch (error) {
    strapi.log.error(`is-authenticated: error inesperado (${error.message})`);
    return false;
  }
};
