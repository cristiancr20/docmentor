'use strict';

/**
 * project controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');

module.exports = createCoreController('api::project.project', ({ strapi }) => ({
  async create(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'CREATE_PROJECT', strapi);
    if (!hasPermission) return;

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
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'UPDATE_PROJECT', strapi);
    if (!hasPermission) return;

    const { id } = ctx.params;
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
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'DELETE_PROJECT', strapi);
    if (!hasPermission) return;

    const { id } = ctx.params;
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
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'CHANGE_PROJECT_STATUS', strapi);
    if (!hasPermission) return;

    const { id } = ctx.params;
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
