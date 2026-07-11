'use strict';

/**
 * project controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');

const coreController = createCoreController('api::project.project');

module.exports = {
  ...coreController,

  async create(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'CREATE_PROJECT', strapi);
    if (!hasPermission) return;

    return coreController.create(ctx);
  },

  async update(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'UPDATE_PROJECT', strapi);
    if (!hasPermission) return;

    return coreController.update(ctx);
  },

  async delete(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'DELETE_PROJECT', strapi);
    if (!hasPermission) return;

    return coreController.delete(ctx);
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

    await strapi.entityService.create('api::audit.audit', {
      data: {
        action: 'CHANGE_PROJECT_STATUS',
        entityType: 'project',
        entityId: parseInt(id),
        userId: user.id,
        oldValue: { status: oldStatus },
        newValue: { status },
      },
    });

    ctx.body = updatedProject;
  },
};
