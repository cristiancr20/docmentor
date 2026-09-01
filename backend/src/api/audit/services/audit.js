'use strict';

/**
 * audit service
 */

const { createCoreService } = require('@strapi/strapi').factories;

const coreService = createCoreService('api::audit.audit');

module.exports = {
  ...coreService,

  async logAudit(action, entityType, entityId, userId, oldValue, newValue, ipAddress) {
    // Los controllers registran la auditoría DESPUÉS de aplicar el cambio. Si
    // esto lanzaba (por ejemplo un entityId indefinido -> NaN en un campo
    // obligatorio), el cliente recibía un 500 por una operación que sí se había
    // ejecutado, y al reintentar se duplicaba. Un fallo al auditar se registra
    // pero no tumba la petición.
    try {
      const parsedEntityId = parseInt(entityId, 10);
      const parsedUserId = parseInt(userId, 10);

      if (Number.isNaN(parsedEntityId) || Number.isNaN(parsedUserId)) {
        strapi.log.warn(
          `Auditoría omitida (${action}): entityId=${entityId}, userId=${userId} no son numéricos.`
        );
        return null;
      }

      return await strapi.entityService.create('api::audit.audit', {
        data: {
          action,
          entityType,
          entityId: parsedEntityId,
          userId: parsedUserId,
          oldValue,
          newValue,
          ipAddress,
          // El schema traía `"default": "$now"`, que Strapi no interpreta: lo
          // tomaba como literal y toda inserción fallaba con "Invalid format,
          // expected a timestamp or an ISO date". La marca de tiempo se pone
          // aquí de forma explícita.
          timestamp: new Date(),
        },
      });
    } catch (error) {
      strapi.log.error(`No se pudo registrar la auditoría (${action}): ${error.message}`);
      return null;
    }
  },

  async getAuditLogs(filters = {}, page = 1, pageSize = 20) {
    const { userId, entityType, entityId, startDate, endDate } = filters;

    const where = {};

    if (userId) where.userId = parseInt(userId);
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = parseInt(entityId);

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.$gte = new Date(startDate);
      if (endDate) where.timestamp.$lte = new Date(endDate);
    }

    // `findPage` espera page/pageSize y devuelve { results, pagination }, así
    // que pasarle offset/limit ignoraba la paginación (siempre la página 1) y
    // además anidaba la respuesta dentro de `data`. Con `findMany` el offset sí
    // se aplica y el total lo da el count de al lado.
    const [logs, total] = await Promise.all([
      strapi.db.query('api::audit.audit').findMany({
        where,
        offset: (page - 1) * pageSize,
        limit: pageSize,
        orderBy: { timestamp: 'desc' },
      }),
      strapi.db.query('api::audit.audit').count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    };
  },

  async exportAuditLogs(filters = {}, format = 'pdf') {
    const { userId, entityType, entityId, startDate, endDate } = filters;

    const where = {};

    if (userId) where.userId = parseInt(userId);
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = parseInt(entityId);

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.$gte = new Date(startDate);
      if (endDate) where.timestamp.$lte = new Date(endDate);
    }

    // Tope de seguridad: el informe se arma entero en memoria, así que sin
    // límite un historial grande tumba el proceso. Si se alcanza, el informe
    // avisa en lugar de aparentar estar completo.
    const EXPORT_LIMIT = 10000;

    const logs = await strapi.db.query('api::audit.audit').findMany({
      where,
      orderBy: { timestamp: 'desc' },
      limit: EXPORT_LIMIT,
    });

    const totalMatching = await strapi.db.query('api::audit.audit').count({ where });
    const truncated = totalMatching > logs.length;

    if (truncated) {
      strapi.log.warn(
        `Exportación de auditoría truncada: ${logs.length} de ${totalMatching} registros.`
      );
    }

    // Resolver usuarios involucrados para mostrar nombres en lugar de IDs
    const userIds = [...new Set(logs.map(log => log.userId).filter(Boolean))];
    let usersById = {};
    if (userIds.length > 0) {
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { id: { $in: userIds } },
        fields: ['id', 'username', 'email'],
      });
      usersById = Object.fromEntries(users.map(u => [u.id, u]));
    }

    // Estadísticas para la hoja de resumen
    const changesByAction = {};
    const changesByEntityType = {};
    const activityByUser = {};

    for (const log of logs) {
      changesByAction[log.action] = (changesByAction[log.action] || 0) + 1;
      changesByEntityType[log.entityType] = (changesByEntityType[log.entityType] || 0) + 1;

      if (!activityByUser[log.userId]) {
        const user = usersById[log.userId];
        activityByUser[log.userId] = {
          userId: log.userId,
          userName: user ? user.username : `Usuario ${log.userId}`,
          email: user ? user.email : null,
          totalActions: 0,
          actions: {},
          firstActivity: log.timestamp,
          lastActivity: log.timestamp,
        };
      }

      const activity = activityByUser[log.userId];
      activity.totalActions += 1;
      activity.actions[log.action] = (activity.actions[log.action] || 0) + 1;
      if (log.timestamp) {
        if (!activity.firstActivity || log.timestamp < activity.firstActivity) {
          activity.firstActivity = log.timestamp;
        }
        if (!activity.lastActivity || log.timestamp > activity.lastActivity) {
          activity.lastActivity = log.timestamp;
        }
      }
    }

    const formatData = {
      exportDate: new Date().toISOString(),
      format,
      filters: {
        userId: userId || null,
        entityType: entityType || null,
        entityId: entityId || null,
        startDate: startDate || null,
        endDate: endDate || null,
      },
      totalRecords: logs.length,
      totalMatching,
      truncated,
      summary: {
        totalChanges: logs.length,
        activeUsers: Object.keys(activityByUser).length,
        changesByAction,
        changesByEntityType,
      },
      userActivity: Object.values(activityByUser).sort((a, b) => b.totalActions - a.totalActions),
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userId: log.userId,
        userName: usersById[log.userId] ? usersById[log.userId].username : `Usuario ${log.userId}`,
        timestamp: log.timestamp,
        oldValue: log.oldValue,
        newValue: log.newValue,
        ipAddress: log.ipAddress,
      })),
    };

    // El checksum se calcula solo sobre los registros exportados. Antes incluía
    // `exportDate`, así que cambiaba en cada exportación y no servía para
    // comparar dos exportaciones del mismo periodo, que es justo su propósito.
    //
    // Nota: es un checksum de integridad, no una firma. Al no llevar clave,
    // cualquiera puede recalcularlo tras alterar el fichero; detecta corrupción
    // o edición accidental, no manipulación deliberada. Para no repudio real
    // haría falta un HMAC con clave del servidor o una firma asimétrica.
    const crypto = require('crypto');
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(formatData.logs))
      .digest('hex');

    return {
      data: formatData,
      hash,
    };
  },
};
