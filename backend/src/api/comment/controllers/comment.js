'use strict';

/**
 * comment controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { userHasPermission } = require('../../../policies/has-permission');

/**
 * La relación `documents` admite un id suelto, un array de ids o el formato
 * { connect: [...] }, según cómo la mande el cliente. Se normaliza a lista.
 */
const toIdList = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map((item) => item?.id ?? item).filter(Boolean);
  if (typeof value === 'object') return toIdList(value.connect ?? value.set ?? value.id);
  return [value];
};

/**
 * Editar o borrar un comentario: puede su autor, y puede quien modera.
 *
 * Antes exigía MANAGE_COMMENTS a secas, de modo que un estudiante no podía ni
 * corregir una errata en su propio comentario.
 *
 * Es la única comprobación de permiso que sigue en el controller y no en la
 * ruta: depende del registro (¿quién es el autor?), y solo si no es el autor se
 * exige MANAGE_COMMENTS. `user` es el `ctx.state.user` que dejó
 * `global::is-authenticated`, ya con `rols.permissions`, así que no hace falta
 * volver a la base de datos para comprobar el permiso.
 */
const canModifyComment = async (ctx, user, strapi) => {
  const comment = await strapi.db.query('api::comment.comment').findOne({
    where: { id: ctx.params.id },
    populate: { correctionTutor: true },
  });

  if (!comment) {
    ctx.notFound('Comentario no encontrado');
    return false;
  }

  if (comment.correctionTutor?.id === user.id) return true;

  if (!userHasPermission(user, 'MANAGE_COMMENTS')) {
    strapi.log.warn(`Comentario ${comment.id}: usuario ${user.id} sin MANAGE_COMMENTS`);
    ctx.forbidden('Permission denied: MANAGE_COMMENTS required');
    return false;
  }

  return true;
};

// Autenticación y COMMENT_DOCUMENT (para `create`) se resuelven en las policies
// declaradas en routes/comment.js; aquí el usuario ya viene en `ctx.state.user`.
// Comentar exige COMMENT_DOCUMENT, no MANAGE_COMMENTS: el segundo es para
// moderar los comentarios de otros, no para escribir el propio, y solo lo tiene
// el tutor, así que exigirlo dejaba al estudiante sin poder responder.
module.exports = createCoreController('api::comment.comment', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;

    // La autoría la fija el servidor. Venía en el body, así que se podía
    // publicar una corrección firmada por otro tutor.
    ctx.request.body = ctx.request.body || {};
    ctx.request.body.data = { ...(ctx.request.body.data || {}), correctionTutor: user.id };

    const result = await super.create(ctx);

    if (result?.data?.id) {
      // Una corrección implica que el documento vuelve a estar pendiente. Lo
      // hacía el cliente con un PUT a /api/documents/:id, pero eso exige
      // UPDATE_DOCUMENT, que un tutor no tiene: recibía 403 y el comentario
      // quedaba guardado sin que la vista se enterara. Es una regla del
      // servidor, no una orquestación del cliente.
      const documentIds = toIdList(ctx.request.body.data?.documents);

      for (const documentId of documentIds) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await strapi.entityService.update('api::document.document', documentId, {
            data: { isRevised: false },
          });
        } catch (error) {
          strapi.log.warn(
            `No se pudo marcar el documento ${documentId} como pendiente: ${error.message}`
          );
        }
      }

      await strapi
        .service('api::notification.notification')
        .notifyCommentReceived(result.data.id, user.id);
    }

    return result;
  },

  async update(ctx) {
    const user = ctx.state.user;

    if (!(await canModifyComment(ctx, user, strapi))) return;

    // Tampoco se puede reasignar la autoría al editar.
    if (ctx.request.body?.data) {
      delete ctx.request.body.data.correctionTutor;
    }

    return super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;

    if (!(await canModifyComment(ctx, user, strapi))) return;

    return super.delete(ctx);
  },
}));
