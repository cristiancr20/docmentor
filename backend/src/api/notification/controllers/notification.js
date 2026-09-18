'use strict';

/**
 * notification controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { applyFilter } = require('../../../utils/ownership');

const VALID_PREFERENCES = ['email', 'in_app', 'both'];

// Autenticación y MANAGE_NOTIFICATIONS (create/update/delete) se resuelven en
// las policies declaradas en routes/; aquí el usuario ya viene en
// `ctx.state.user` y solo queda la pertenencia (destinatario).
module.exports = createCoreController('api::notification.notification', ({ strapi }) => ({
  // `findMine` filtraba bien, pero el `find` del core seguía montado y abierto:
  // GET /api/notifications devolvía las notificaciones privadas de todos los
  // usuarios. Se limita siempre al destinatario.
  async find(ctx) {
    const user = ctx.state.user;

    applyFilter(ctx, { tutor: { id: user.id } });

    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state.user;

    const notification = await strapi.db.query('api::notification.notification').findOne({
      where: { id: ctx.params.id },
      populate: { tutor: true },
    });

    if (!notification || notification.tutor?.id !== user.id) {
      return ctx.forbidden('No tienes acceso a esta notificación');
    }

    return super.findOne(ctx);
  },

  // Notificaciones propias (últimos 30 días)
  async findMine(ctx) {
    const user = ctx.state.user;

    const notifications = await strapi
      .service('api::notification.notification')
      .getMyNotifications(user.id);

    ctx.send({ data: notifications });
  },

  async markRead(ctx) {
    const user = ctx.state.user;

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
    const user = ctx.state.user;

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
    const user = ctx.state.user;

    const fullUser = await strapi
      .query('plugin::users-permissions.user')
      .findOne({ where: { id: user.id } });

    ctx.send({
      data: { notificationPreference: fullUser?.notificationPreference || 'both' },
    });
  },

  async updatePreferences(ctx) {
    const user = ctx.state.user;

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
