'use strict';

/**
 * document controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');
const {
  isElevated,
  projectScopeFilter,
  applyFilter,
  requireDocumentAccess,
  requireProjectAccess,
} = require('../../../utils/ownership');

module.exports = createCoreController('api::document.document', ({ strapi }) => ({
  // Sin este filtro, GET /api/documents devolvía todos los documentos del
  // sistema a cualquier usuario autenticado.
  async find(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    if (!(await isElevated(user.id, strapi))) {
      applyFilter(ctx, { project: projectScopeFilter(user.id) });
    }

    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    if (!(await requireDocumentAccess(ctx, ctx.params.id, user.id, strapi))) return;

    return super.findOne(ctx);
  },

  async create(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'CREATE_DOCUMENT', strapi);
    if (!hasPermission) return;

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
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'UPDATE_DOCUMENT', strapi);
    if (!hasPermission) return;

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
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'DELETE_DOCUMENT', strapi);
    if (!hasPermission) return;

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

  /** Marca la versión como revisada o pendiente. */
  async setReviewed(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'REVIEW_DOCUMENT', strapi);
    if (!hasPermission) return;

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
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'REVIEW_DOCUMENT', strapi);
    if (!hasPermission) return;

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
