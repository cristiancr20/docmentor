'use strict';

/**
 * Extensión del plugin users-permissions.
 *
 * En Strapi v4 los controllers y rutas custom de un plugin NO se cargan solo por
 * colocar archivos en la carpeta de extensiones: hay que inyectarlos aquí.
 * (El content-type extendido sí se mergea automáticamente.)
 */

const customUserController = require('./controllers/User');
const customRoutes = require('./routes');

// Rol que recibe todo usuario que se registra por su cuenta. La asignación de
// cualquier otro rol pasa por /api/admin/users, que exige MANAGE_USERS.
const DEFAULT_SIGNUP_ROL_TYPE = 'estudiante';

module.exports = (plugin) => {
  // Añadir los métodos custom al controller `user` del plugin
  Object.keys(customUserController).forEach((methodName) => {
    plugin.controllers.user[methodName] = customUserController[methodName];
  });

  // El registro público aceptaba `rols` del body, así que cualquiera podía
  // crearse una cuenta con rol Superadmin. Se descarta lo que mande el cliente
  // y se asigna el rol por defecto después de crear el usuario.
  const originalRegister = plugin.controllers.auth.register;
  plugin.controllers.auth.register = async (ctx) => {
    if (ctx.request.body && typeof ctx.request.body === 'object') {
      delete ctx.request.body.rols;
      delete ctx.request.body.role;
    }

    await originalRegister(ctx);

    const createdUser = ctx.body && ctx.body.user;
    if (!createdUser) return;

    const defaultRol = await strapi.db
      .query('api::rol.rol')
      .findOne({ where: { rolType: DEFAULT_SIGNUP_ROL_TYPE } });

    if (!defaultRol) {
      strapi.log.warn(
        `No existe el rol "${DEFAULT_SIGNUP_ROL_TYPE}"; el usuario ${createdUser.id} queda sin rol.`
      );
      return;
    }

    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: createdUser.id },
      data: { rols: [defaultRol.id] },
    });
  };

  // Registrar las rutas custom en la API content-api del plugin
  plugin.routes['content-api'].routes.push(...customRoutes);

  return plugin;
};
