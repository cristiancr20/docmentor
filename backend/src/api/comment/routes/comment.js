'use strict';

/**
 * comment router
 *
 * `global::is-authenticated` en todas las acciones. Crear un comentario exige
 * COMMENT_DOCUMENT vía `global::has-permission`. Editar y borrar solo exigen
 * sesión aquí: la decisión entre "es el autor" y "tiene MANAGE_COMMENTS para
 * moderar" depende del registro concreto, así que la toma el controller
 * (`canModifyComment`).
 *
 * Sin `auth: false`: los handlers core sanean relaciones (`documents`,
 * `correctionTutor`) según `ctx.state.auth`, que solo existe con la
 * autenticación de users-permissions. Ver routes/document.js.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const authenticated = 'global::is-authenticated';
const withPermission = (code) => ({ name: 'global::has-permission', config: { code } });

module.exports = createCoreRouter('api::comment.comment', {
  config: {
    find: { policies: [authenticated] },
    findOne: { policies: [authenticated] },
    create: { policies: [authenticated, withPermission('COMMENT_DOCUMENT')] },
    update: { policies: [authenticated] },
    delete: { policies: [authenticated] },
  },
});
