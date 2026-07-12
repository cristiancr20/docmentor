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

module.exports = (plugin) => {
  // Añadir los métodos custom al controller `user` del plugin
  Object.keys(customUserController).forEach((methodName) => {
    plugin.controllers.user[methodName] = customUserController[methodName];
  });

  // Registrar las rutas custom en la API content-api del plugin
  plugin.routes['content-api'].routes.push(...customRoutes);

  return plugin;
};
