'use strict';

/**
 * document router
 *
 * Las acciones core declaran sus policies en la ruta: `global::is-authenticated`
 * en todas y `global::has-permission` con el código que corresponde a cada
 * escritura. `find` y `findOne` solo exigen sesión; el alcance por proyecto lo
 * aplica el controller (utils/ownership).
 *
 * A diferencia de las rutas custom, aquí no se pone `auth: false`: los
 * handlers core delegan en `super.find/create/...`, que sanean query, body y
 * respuesta según `ctx.state.auth`. Sin la autenticación de users-permissions
 * ese estado queda vacío y Strapi elimina (o rechaza con 400) cualquier
 * relación —el filtro por `project.tutor/students`, el `project` del body, el
 * `documentFile` de la respuesta—. Las policies corren después de esa
 * autenticación y sustituyen `ctx.state.user` por el usuario con sus
 * `rols.permissions`.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const authenticated = 'global::is-authenticated';
const withPermission = (code) => ({ name: 'global::has-permission', config: { code } });

module.exports = createCoreRouter('api::document.document', {
  config: {
    find: { policies: [authenticated] },
    findOne: { policies: [authenticated] },
    create: { policies: [authenticated, withPermission('CREATE_DOCUMENT')] },
    update: { policies: [authenticated, withPermission('UPDATE_DOCUMENT')] },
    delete: { policies: [authenticated, withPermission('DELETE_DOCUMENT')] },
  },
});
