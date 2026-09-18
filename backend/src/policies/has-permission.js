'use strict';

/**
 * Policy `global::has-permission`.
 *
 * Uso en una ruta:
 *   policies: [
 *     'global::is-authenticated',
 *     { name: 'global::has-permission', config: { code: 'projects.create' } },
 *   ]
 *
 * Comprueba que `ctx.state.user` (cargado con `rols.permissions` por
 * `global::is-authenticated`) tenga algún rol con un permiso activo cuyo `code`
 * coincida con `config.code`. No consulta la base de datos. Devuelve `false`
 * (Strapi responde 403) si no hay usuario, si falta `config.code` o si el
 * permiso no está; nunca lanza.
 */

const hasActivePermission = (rols, code) =>
  rols.some(
    (rol) =>
      Array.isArray(rol?.permissions) &&
      rol.permissions.some((perm) => perm?.isActive === true && perm?.code === code)
  );

module.exports = (policyContext, config, { strapi }) => {
  try {
    const code = config?.code;
    if (typeof code !== 'string' || code.length === 0) {
      strapi.log.error('has-permission: la ruta no define `config.code`; se deniega el acceso');
      return false;
    }

    const user = policyContext.state?.user;
    if (!user) {
      return false;
    }

    const rols = Array.isArray(user.rols) ? user.rols : [];
    if (!hasActivePermission(rols, code)) {
      strapi.log.warn(`has-permission: usuario ${user.id} sin el permiso ${code}`);
      return false;
    }

    return true;
  } catch (error) {
    strapi.log.error(`has-permission: error inesperado (${error.message})`);
    return false;
  }
};
