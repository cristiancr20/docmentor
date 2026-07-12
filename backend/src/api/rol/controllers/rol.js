'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');

module.exports = createCoreController('api::rol.rol', ({ strapi }) => ({
  async create(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_ROLES', strapi);
    if (!hasPermission) return;

    return super.create(ctx);
  },

  async update(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_ROLES', strapi);
    if (!hasPermission) return;

    return super.update(ctx);
  },

  async delete(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_ROLES', strapi);
    if (!hasPermission) return;

    const { id } = ctx.params;
    await strapi.entityService.update('api::rol.rol', id, {
      data: { isActive: false },
    });
    ctx.body = { data: { id, message: 'Rol desactivado' } };
  },

  async getRolePermissions(ctx) {
    const { id } = ctx.params;
    const rol = await strapi.entityService.findOne('api::rol.rol', id, {
      populate: { permissions: true },
    });
    if (!rol) {
      ctx.throw(404, 'Rol no encontrado');
    }
    ctx.body = { data: rol.permissions };
  },

  async addRolePermission(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_ROLES', strapi);
    if (!hasPermission) return;

    const { id } = ctx.params;
    const { permissionId } = ctx.request.body;

    const rol = await strapi.entityService.findOne('api::rol.rol', id, {
      populate: { permissions: true },
    });
    if (!rol) {
      ctx.throw(404, 'Rol no encontrado');
    }

    const permission = await strapi.entityService.findOne('api::permission.permission', permissionId);
    if (!permission) {
      ctx.throw(404, 'Permiso no encontrado');
    }

    const updatedRol = await strapi.entityService.update('api::rol.rol', id, {
      data: {
        permissions: {
          connect: [{ id: permissionId }],
        },
      },
      populate: { permissions: true },
    });

    ctx.body = { data: updatedRol.permissions };
  },

  async removeRolePermission(ctx) {
    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_ROLES', strapi);
    if (!hasPermission) return;

    const { id, permissionId } = ctx.params;

    const rol = await strapi.entityService.findOne('api::rol.rol', id, {
      populate: { permissions: true },
    });
    if (!rol) {
      ctx.throw(404, 'Rol no encontrado');
    }

    const permission = await strapi.entityService.findOne('api::permission.permission', permissionId);
    if (!permission) {
      ctx.throw(404, 'Permiso no encontrado');
    }

    const updatedRol = await strapi.entityService.update('api::rol.rol', id, {
      data: {
        permissions: {
          disconnect: [{ id: permissionId }],
        },
      },
      populate: { permissions: true },
    });

    ctx.body = { data: updatedRol.permissions };
  },
}));
