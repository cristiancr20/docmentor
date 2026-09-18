'use strict';

/**
 * project router
 *
 * Las acciones core declaran sus policies en la ruta: `global::is-authenticated`
 * en todas y `global::has-permission` con el código que corresponde a cada
 * escritura. `find` y `findOne` solo exigen sesión; el alcance (los proyectos
 * del propio tutor o estudiante) lo aplica el controller (utils/ownership).
 *
 * No se pone `auth: false` en estas rutas: los handlers core delegan en
 * `super.find/create/...`, que sanean query, body y respuesta según
 * `ctx.state.auth`. Sin la autenticación de users-permissions ese estado queda
 * vacío y Strapi elimina (o rechaza con 400) cualquier relación —el filtro por
 * `tutor/students`, el `tutor` del body—. Las policies corren después de esa
 * autenticación y sustituyen `ctx.state.user` por el usuario con sus
 * `rols.permissions`. Ver routes/document.js.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const authenticated = 'global::is-authenticated';
const withPermission = (code) => ({ name: 'global::has-permission', config: { code } });

module.exports = createCoreRouter('api::project.project', {
  config: {
    find: { policies: [authenticated] },
    findOne: { policies: [authenticated] },
    create: { policies: [authenticated, withPermission('CREATE_PROJECT')] },
    update: { policies: [authenticated, withPermission('UPDATE_PROJECT')] },
    delete: { policies: [authenticated, withPermission('DELETE_PROJECT')] },
  },
});
