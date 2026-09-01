'use strict';

/**
 * notification controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { authenticate, authorize } = require('../../../utils/protectedController');
const { applyFilter } = require('../../../utils/ownership');

const VALID_PREFERENCES = ['email', 'in_app', 'both'];

module.exports = createCoreController('api::notification.notification', ({ strapi }) => ({
  // `findMine` filtraba bien, pero el `find` del core seguía montado y abierto:
  // GET /api/notifications devolvía las notificaciones privadas de todos los
  // usuarios. Se limita siempre al destinatario.
  async find(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    applyFilter(ctx, { tutor: { id: user.id } });

    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const notification = await strapi.db.query('api::notification.notification').findOne({
      where: { id: ctx.params.id },
      populate: { tutor: true },
    });

    if (!notification || notification.tutor?.id !== user.id) {
      return ctx.forbidden('No tienes acceso a esta notificación');
    }

    return super.findOne(ctx);
  },

  async create(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_NOTIFICATIONS', strapi);
    if (!hasPermission) return;

    return super.create(ctx);
  },

  async update(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_NOTIFICATIONS', strapi);
    if (!hasPermission) return;

    return super.update(ctx);
  },

  async delete(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_NOTIFICATIONS', strapi);
    if (!hasPermission) return;

    return super.delete(ctx);
  },

  // Notificaciones propias (últimos 30 días): solo requiere autenticación
  async findMine(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const notifications = await strapi
      .service('api::notification.notification')
      .getMyNotifications(user.id);

    ctx.send({ data: notifications });
  },

  async markRead(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const { id } = ctx.params;
    const notification = await strapi.entityService.findOne('api::notification.notification', id, {
      populate: { tutor: { fields: ['id'] } },
    });

    if (!notification) {
      return ctx.notFound('Notificación no encontrada');
    }

    if (notification.tutor?.id !== user.id) {
      return ctx.forbidden('No puedes modificar notificaciones de otro usuario');
    }

    const updated = await strapi.entityService.update('api::notification.notification', id, {
      data: { isRead: true },
    });

    ctx.send({ data: updated });
  },

  async markAllRead(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const unread = await strapi.entityService.findMany('api::notification.notification', {
      filters: { tutor: { id: user.id }, isRead: { $ne: true } },
      fields: ['id'],
      limit: -1,
    });

    await Promise.all(
      unread.map((notification) =>
        strapi.entityService.update('api::notification.notification', notification.id, {
          data: { isRead: true },
        })
      )
    );

    ctx.send({ data: { updated: unread.length } });
  },

  async getPreferences(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const fullUser = await strapi
      .query('plugin::users-permissions.user')
      .findOne({ where: { id: user.id } });

    ctx.send({
      data: { notificationPreference: fullUser?.notificationPreference || 'both' },
    });
  },

  async updatePreferences(ctx) {
    const user = await authenticate(ctx, strapi);
    if (!user) return;

    const { notificationPreference } = ctx.request.body || {};
    if (!VALID_PREFERENCES.includes(notificationPreference)) {
      return ctx.badRequest('Preferencia inválida: usa email, in_app o both');
    }

    await strapi
      .query('plugin::users-permissions.user')
      .update({ where: { id: user.id }, data: { notificationPreference } });

    ctx.send({ data: { notificationPreference } });
  },
}));
