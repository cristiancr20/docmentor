'use strict';

/**
 * document controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const {
  isElevated,
  projectScopeFilter,
  applyFilter,
  requireDocumentAccess,
  requireProjectAccess,
} = require('../../../utils/ownership');

// Autenticación y permiso por código se resuelven en las policies declaradas en
// routes/ (`global::is-authenticated`, `global::has-permission`); aquí el
// usuario ya viene en `ctx.state.user`. Lo que sí sigue siendo del controller
// es la pertenencia: que el documento o el proyecto sean del usuario.
module.exports = createCoreController('api::document.document', ({ strapi }) => ({
  // Sin este filtro, GET /api/documents devolvía todos los documentos del
  // sistema a cualquier usuario autenticado.
  async find(ctx) {
    const user = ctx.state.user;

    if (!(await isElevated(user.id, strapi))) {
      applyFilter(ctx, { project: projectScopeFilter(user.id) });
    }

    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state.user;

    if (!(await requireDocumentAccess(ctx, ctx.params.id, user.id, strapi))) return;

    return super.findOne(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;

    // Sin esto se podía subir un documento al proyecto de otro indicando su id.
    const targetProject = ctx.request.body?.data?.project;
    if (targetProject) {
      const projectId = typeof targetProject === 'object' ? targetProject.id : targetProject;
      if (!(await requireProjectAccess(ctx, projectId, user.id, strapi))) return;
    }

    const result = await super.create(ctx);

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'CREATE_DOCUMENT',
      'document',
      result.data.id,
      user.id,
      null,
      result.data,
      ipAddress
    );

    await strapi
      .service('api::notification.notification')
      .notifyDocumentUploaded(result.data.id, user.id);

    return result;
  },

  async update(ctx) {
    const user = ctx.state.user;

    const { id } = ctx.params;
    if (!(await requireDocumentAccess(ctx, id, user.id, strapi))) return;

    const oldDocument = await strapi.entityService.findOne('api::document.document', id);

    const result = await super.update(ctx);

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'UPDATE_DOCUMENT',
      'document',
      id,
      user.id,
      oldDocument,
      result.data,
      ipAddress
    );

    return result;
  },

  async delete(ctx) {
    const user = ctx.state.user;

    const { id } = ctx.params;
    if (!(await requireDocumentAccess(ctx, id, user.id, strapi))) return;

    const document = await strapi.entityService.findOne('api::document.document', id);

    const result = await super.delete(ctx);

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'DELETE_DOCUMENT',
      'document',
      id,
      user.id,
      document,
      null,
      ipAddress
    );

    return result;
  },

  /**
   * Restaura una versión anterior creando una nueva al final del historial.
   *
   * No ramifica: el historial sigue siendo una línea. Un PDF es un binario
   * opaco, así que dos ramas nunca podrían fusionarse y solo quedaría la duda
   * de cuál es la buena. Restaurar conserva todo: la v3 y la v4 siguen ahí,
   * visibles y auditables, y la copia de la v2 pasa a ser la versión actual.
   *
   * Lo hacía el cliente encadenando varias llamadas, y arrastraba los
   * comentarios y las notificaciones del original: los comentarios quedaban
   * compartidos entre dos versiones (la relación es N-N), de modo que editar
   * uno afectaba a ambas y los contadores mentían.
   */
  async restoreVersion(ctx) {
    const user = ctx.state.user;

    const { id } = ctx.params;
    if (!(await requireDocumentAccess(ctx, id, user.id, strapi))) return;

    const source = await strapi.entityService.findOne('api::document.document', id, {
      populate: { project: true, documentFile: true },
    });

    if (!source) {
      return ctx.notFound('Documento no encontrado');
    }

    const projectId = source.project?.id;
    if (!projectId) {
      return ctx.badRequest('El documento no pertenece a ningún proyecto');
    }

    // Todo lo que decide y escribe la restauración va en una sola transacción:
    // antes se creaba la nueva versión y luego se lanzaba un update por
    // documento en paralelo, así que un fallo a medias dejaba dos (o ninguna)
    // como actual. Dentro del callback, strapi.db.query y entityService se
    // enganchan solos a la transacción (AsyncLocalStorage); si algo lanza, se
    // hace rollback y no queda ninguna versión nueva.
    let restored;
    let nextVersion;
    try {
      restored = await strapi.db.transaction(async () => {
        // El número se calcula aquí: el cliente lo hacía leyendo la última
        // versión y sumando uno, así que dos restauraciones simultáneas
        // generaban dos versiones con el mismo número.
        const siblings = await strapi.db.query('api::document.document').findMany({
          where: { project: projectId },
          select: ['id', 'version'],
        });

        nextVersion = siblings.reduce((max, doc) => Math.max(max, doc.version ?? 0), 0) + 1;
        const currentTip = siblings.reduce(
          (tip, doc) => ((doc.version ?? 0) > (tip?.version ?? 0) ? doc : tip),
          null
        );

        const created = await strapi.entityService.create('api::document.document', {
          data: {
            title: source.title,
            documentFile: (source.documentFile ?? []).map((file) => file.id),
            project: projectId,
            version: nextVersion,
            isCurrent: true,
            isRevised: false,
            status: 'Subido',
            // Encadena con la punta del historial, y deja constancia aparte de
            // cuál se restauró: es lo que dibuja la conexión en la línea de tiempo.
            previous_version: currentTip?.id ?? null,
            restoredFrom: source.id,
            // El content-type tiene draftAndPublish activo: sin esto la versión
            // nace como borrador y no aparece en el historial.
            publishedAt: new Date(),
          },
          populate: { documentFile: true, restoredFrom: true },
        });

        // Solo la nueva queda como actual: un único UPDATE sobre el resto del
        // proyecto en vez de un update por documento. Se filtra por los ids
        // leídos en esta misma transacción y no por `project: projectId`: la
        // relación vive en `documents_project_links`, y en Strapi 4.25 el query
        // builder decide si usa subconsulta antes de procesar el where, así que
        // un updateMany filtrado por relación genera `t2.id` sin el join y
        // falla con "no such column".
        await strapi.db.query('api::document.document').updateMany({
          where: { id: { $in: siblings.map((doc) => doc.id), $ne: created.id } },
          data: { isCurrent: false },
        });

        return created;
      });
    } catch (error) {
      strapi.log.error(`No se pudo restaurar la versión ${id} del proyecto ${projectId}`, error);
      return ctx.internalServerError(
        'No se pudo restaurar la versión: la operación se revirtió y no se creó ninguna versión nueva'
      );
    }

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'RESTORE_DOCUMENT_VERSION',
      'document',
      restored.id,
      user.id,
      { restoredFrom: source.id, version: source.version },
      { version: nextVersion },
      ipAddress
    );

    ctx.send({ data: restored });
  },

  /** Marca la versión como revisada o pendiente. */
  async setReviewed(ctx) {
    const user = ctx.state.user;

    const { id } = ctx.params;
    if (!(await requireDocumentAccess(ctx, id, user.id, strapi))) return;

    const { isRevised } = ctx.request.body?.data ?? ctx.request.body ?? {};
    if (typeof isRevised !== 'boolean') {
      return ctx.badRequest('Se espera `isRevised` como booleano');
    }

    const document = await strapi.entityService.findOne('api::document.document', id);
    if (!document) {
      return ctx.notFound('Documento no encontrado');
    }

    const updated = await strapi.entityService.update('api::document.document', id, {
      data: { isRevised },
    });

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'REVIEW_DOCUMENT',
      'document',
      id,
      user.id,
      { isRevised: document.isRevised },
      { isRevised },
      ipAddress
    );

    ctx.send({ data: updated });
  },

  async changeStatus(ctx) {
    const user = ctx.state.user;

    const { id } = ctx.params;
    if (!(await requireDocumentAccess(ctx, id, user.id, strapi))) return;

    const { status } = ctx.request.body;

    const validStatuses = ['Subido', 'En Revisión', 'Aprobado', 'Cambios Solicitados', 'Archivado'];
    if (!validStatuses.includes(status)) {
      return ctx.badRequest('Estado inválido');
    }

    const document = await strapi.entityService.findOne('api::document.document', id);
    if (!document) {
      return ctx.notFound('Documento no encontrado');
    }

    const currentStatus = document.status;
    const validTransitions = {
      'Subido': ['En Revisión'],
      'En Revisión': ['Aprobado', 'Cambios Solicitados'],
      'Cambios Solicitados': ['En Revisión'],
      'Aprobado': ['Archivado'],
      'Archivado': [],
    };

    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
      return ctx.badRequest(`Transición no permitida de ${currentStatus} a ${status}`);
    }

    const oldStatus = document.status;
    const updatedDocument = await strapi.entityService.update('api::document.document', id, {
      data: { status },
    });

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'CHANGE_DOCUMENT_STATUS',
      'document',
      id,
      user.id,
      { status: oldStatus },
      { status },
      ipAddress
    );

    await strapi
      .service('api::notification.notification')
      .notifyDocumentStatusChanged(id, status, user.id);

    ctx.send({ data: updatedDocument });
  },
}));
