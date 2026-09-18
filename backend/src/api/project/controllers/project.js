'use strict';

/**
 * project controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const {
  isElevated,
  projectScopeFilter,
  applyFilter,
  requireProjectAccess,
} = require('../../../utils/ownership');

// Autenticación y permiso por código se resuelven en las policies declaradas en
// routes/ (`global::is-authenticated`, `global::has-permission`); aquí el
// usuario ya viene en `ctx.state.user`. Lo que sí sigue siendo del controller
// es la pertenencia: que el proyecto sea del usuario (utils/ownership).
module.exports = createCoreController('api::project.project', ({ strapi }) => ({
  // El `find` del core devolvía todos los proyectos a cualquier usuario con
  // sesión. Se limita a los propios salvo para coordinación y superadmin.
  async find(ctx) {
    const user = ctx.state.user;

    if (!(await isElevated(user.id, strapi))) {
      applyFilter(ctx, projectScopeFilter(user.id));
    }

    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state.user;

    if (!(await requireProjectAccess(ctx, ctx.params.id, user.id, strapi))) return;

    return super.findOne(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;

    const result = await super.create(ctx);

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'CREATE_PROJECT',
      'project',
      result.data.id,
      user.id,
      null,
      result.data,
      ipAddress
    );

    return result;
  },

  async update(ctx) {
    const user = ctx.state.user;

    const { id } = ctx.params;
    if (!(await requireProjectAccess(ctx, id, user.id, strapi))) return;

    const oldProject = await strapi.entityService.findOne('api::project.project', id);

    const result = await super.update(ctx);

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'UPDATE_PROJECT',
      'project',
      id,
      user.id,
      oldProject,
      result.data,
      ipAddress
    );

    return result;
  },

  async delete(ctx) {
    const user = ctx.state.user;

    const { id } = ctx.params;
    if (!(await requireProjectAccess(ctx, id, user.id, strapi))) return;

    const project = await strapi.entityService.findOne('api::project.project', id);

    const result = await super.delete(ctx);

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'DELETE_PROJECT',
      'project',
      id,
      user.id,
      project,
      null,
      ipAddress
    );

    return result;
  },

  async changeStatus(ctx) {
    const user = ctx.state.user;

    const { id } = ctx.params;
    if (!(await requireProjectAccess(ctx, id, user.id, strapi))) return;

    const { status } = ctx.request.body;

    const validStatuses = ['Creado', 'En Revisión', 'Aprobado', 'Finalizado', 'Rechazado'];
    if (!validStatuses.includes(status)) {
      return ctx.badRequest('Invalid status');
    }

    const project = await strapi.entityService.findOne('api::project.project', id);
    if (!project) {
      return ctx.notFound('Project not found');
    }

    const validTransitions = {
      'Creado': ['En Revisión'],
      'En Revisión': ['Aprobado', 'Rechazado'],
      'Aprobado': ['Finalizado'],
      'Finalizado': [],
      'Rechazado': ['En Revisión'],
    };

    const currentStatus = project.status;
    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(status)) {
      return ctx.badRequest(`Cannot transition from ${currentStatus} to ${status}`);
    }

    const oldStatus = project.status;
    const updatedProject = await strapi.entityService.update('api::project.project', id, {
      data: { status },
    });

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'CHANGE_PROJECT_STATUS',
      'project',
      id,
      user.id,
      { status: oldStatus },
      { status },
      ipAddress
    );

    ctx.body = updatedProject;
  },
}));
