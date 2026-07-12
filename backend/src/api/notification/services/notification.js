'use strict';

/**
 * notification service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const { transporter } = require('../../../mailer/mailer');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const EMAIL_SUBJECTS = {
  document_uploaded: 'Nuevo documento subido',
  status_changed: 'Cambio de estado en un documento',
  comment_received: 'Nuevo comentario recibido',
  general: 'Notificación',
};

module.exports = createCoreService('api::notification.notification', ({ strapi }) => ({
  /**
   * Crea una notificación para un usuario respetando su preferencia
   * (in_app, email o both). Nunca lanza: las notificaciones son
   * secundarias y no deben romper la operación principal.
   */
  async notifyUser({ userId, type = 'general', message, documentId = null }) {
    try {
      if (!userId || !message) return null;

      const user = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ where: { id: userId } });

      if (!user || user.isActive === false) return null;

      const preference = user.notificationPreference || 'both';
      let notification = null;

      if (preference === 'in_app' || preference === 'both') {
        notification = await strapi.entityService.create('api::notification.notification', {
          data: {
            message,
            type,
            isRead: false,
            tutor: userId,
            ...(documentId ? { documents: [documentId] } : {}),
          },
        });
      }

      if ((preference === 'email' || preference === 'both') && user.email) {
        await this.sendEmailNotification(user, type, message);
      }

      return notification;
    } catch (error) {
      strapi.log.error(`Error creando notificación para usuario ${userId}: ${error.message}`);
      return null;
    }
  },

  async notifyUsers(userIds, payload) {
    const uniqueIds = [...new Set((userIds || []).filter(Boolean))];
    for (const userId of uniqueIds) {
      await this.notifyUser({ ...payload, userId });
    }
  },

  async sendEmailNotification(user, type, message) {
    try {
      const emailConfig = await strapi.db
        .query('api::setting.setting')
        .findOne({ where: { isActual: true } });

      const from = emailConfig?.email_notifications || process.env.SMTP_USER;
      if (!from) {
        strapi.log.warn('No hay remitente configurado para correos de notificación.');
        return;
      }

      await transporter.sendMail({
        from,
        to: user.email,
        subject: `DocMentor - ${EMAIL_SUBJECTS[type] || EMAIL_SUBJECTS.general}`,
        html: `<p>Hola ${user.username || ''},</p><p>${message}</p><p>Ingresa a DocMentor para ver los detalles.</p>`,
      });
    } catch (error) {
      strapi.log.error(`Error enviando correo de notificación a ${user.email}: ${error.message}`);
    }
  },

  /** Notifica al tutor del proyecto cuando se sube un nuevo documento. */
  async notifyDocumentUploaded(documentId, actorUserId) {
    try {
      const document = await strapi.entityService.findOne('api::document.document', documentId, {
        populate: { project: { populate: { tutor: true, students: true } } },
      });

      const project = document?.project;
      if (!project) return;

      const recipients = [project.tutor?.id].filter((id) => id && id !== actorUserId);
      await this.notifyUsers(recipients, {
        type: 'document_uploaded',
        message: `Nuevo documento subido: "${document.title || 'Sin título'}" en el proyecto "${project.title || ''}"`,
        documentId,
      });
    } catch (error) {
      strapi.log.error(`Error notificando documento subido ${documentId}: ${error.message}`);
    }
  },

  /** Notifica a estudiantes y tutor cuando cambia el estado de un documento. */
  async notifyDocumentStatusChanged(documentId, newStatus, actorUserId) {
    try {
      const document = await strapi.entityService.findOne('api::document.document', documentId, {
        populate: { project: { populate: { tutor: true, students: true } } },
      });

      const project = document?.project;
      if (!project) return;

      const recipients = [
        project.tutor?.id,
        ...(project.students || []).map((student) => student.id),
      ].filter((id) => id && id !== actorUserId);

      await this.notifyUsers(recipients, {
        type: 'status_changed',
        message: `El documento "${document.title || 'Sin título'}" cambió a estado "${newStatus}" en el proyecto "${project.title || ''}"`,
        documentId,
      });
    } catch (error) {
      strapi.log.error(`Error notificando cambio de estado ${documentId}: ${error.message}`);
    }
  },

  /** Notifica a estudiantes y tutor cuando se recibe un comentario en un documento. */
  async notifyCommentReceived(commentId, actorUserId) {
    try {
      const comment = await strapi.entityService.findOne('api::comment.comment', commentId, {
        populate: {
          documents: { populate: { project: { populate: { tutor: true, students: true } } } },
        },
      });

      for (const document of comment?.documents || []) {
        const project = document.project;
        if (!project) continue;

        const recipients = [
          project.tutor?.id,
          ...(project.students || []).map((student) => student.id),
        ].filter((id) => id && id !== actorUserId);

        await this.notifyUsers(recipients, {
          type: 'comment_received',
          message: `Nuevo comentario en el documento "${document.title || 'Sin título'}" del proyecto "${project.title || ''}"`,
          documentId: document.id,
        });
      }
    } catch (error) {
      strapi.log.error(`Error notificando comentario ${commentId}: ${error.message}`);
    }
  },

  /** Historial limitado: devuelve las notificaciones propias de los últimos 30 días. */
  async getMyNotifications(userId) {
    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

    // Limpieza oportunista del historial: fuera de la respuesta principal
    this.cleanupOldNotifications().catch((error) =>
      strapi.log.error(`Error limpiando notificaciones antiguas: ${error.message}`)
    );

    return strapi.entityService.findMany('api::notification.notification', {
      filters: {
        tutor: { id: userId },
        createdAt: { $gte: cutoff },
      },
      sort: { createdAt: 'desc' },
      populate: { documents: { fields: ['id', 'title'] } },
      limit: 100,
    });
  },

  /** Retención de 30 días: elimina notificaciones más antiguas. */
  async cleanupOldNotifications() {
    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
    await strapi.db.query('api::notification.notification').deleteMany({
      where: { createdAt: { $lt: cutoff } },
    });
  },
}));
