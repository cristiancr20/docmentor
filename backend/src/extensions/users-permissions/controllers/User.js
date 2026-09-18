'use strict';

/**
 * Métodos custom del controller `user` de users-permissions.
 *
 * Autenticación y permiso (VIEW_USERS, MANAGE_USERS, ANONYMIZE_USER) se
 * resuelven en las policies declaradas en routes/index.js; aquí el usuario ya
 * viene en `ctx.state.user`.
 */

module.exports = {
  async getMyPermissions(ctx) {
    // `global::is-authenticated` ya deja el usuario con `rols.permissions`
    // cargados; no hace falta otra consulta.
    const userWithRoles = ctx.state.user;

    if (!userWithRoles || !userWithRoles.rols || userWithRoles.rols.length === 0) {
      return ctx.send({ data: [] });
    }

    const activePermissions = [];
    const seenCodes = new Set();
    for (const rol of userWithRoles.rols) {
      for (const permission of rol.permissions || []) {
        if (permission.isActive && !seenCodes.has(permission.code)) {
          seenCodes.add(permission.code);
          activePermissions.push(permission);
        }
      }
    }

    ctx.send({
      data: activePermissions.map(p => p.code),
      permissions: activePermissions,
    });
  },

  async adminListUsers(ctx) {
    const user = ctx.state.user;

    const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
      populate: { rols: true },
      sort: { createdAt: 'desc' },
      limit: 1000,
    });

    ctx.send({
      data: users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        confirmed: u.confirmed,
        blocked: u.blocked,
        isActive: u.isActive !== false,
        isInstitutional: u.isInstitutional,
        createdAt: u.createdAt,
        rols: (u.rols || []).map(r => ({ id: r.id, name: r.name })),
      })),
    });
  },

  async adminCreateUser(ctx) {
    const user = ctx.state.user;

    const { username, email, password, rols } = ctx.request.body;

    if (!username || !email || !password) {
      return ctx.badRequest('username, email y password son requeridos');
    }

    const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
      where: { $or: [{ email: email.toLowerCase() }, { username }] },
    });

    if (existingUser) {
      return ctx.badRequest('Ya existe un usuario con ese email o username');
    }

    const newUser = await strapi.entityService.create('plugin::users-permissions.user', {
      data: {
        username,
        email: email.toLowerCase(),
        password,
        provider: 'local',
        confirmed: true,
        blocked: false,
        isActive: true,
        rols: rols || [],
      },
      populate: { rols: true },
    });

    await strapi.service('api::audit.audit').logFromCtx(ctx, {
      action: 'CREATE_USER',
      entity: 'user',
      entityId: newUser.id,
      after: { username: newUser.username, email: newUser.email },
    });

    ctx.send({
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isActive: newUser.isActive !== false,
        rols: (newUser.rols || []).map(r => ({ id: r.id, name: r.name })),
      },
    });
  },

  async adminUpdateUser(ctx) {
    const user = ctx.state.user;

    const { id } = ctx.params;
    const { username, email, password, rols, isActive } = ctx.request.body;

    const targetUser = await strapi.query('plugin::users-permissions.user').findOne({
      where: { id: parseInt(id) },
    });

    if (!targetUser) {
      return ctx.notFound('Usuario no encontrado');
    }

    const data = {};
    if (username !== undefined) data.username = username;
    if (email !== undefined) data.email = email.toLowerCase();
    if (password) data.password = password;
    if (rols !== undefined) data.rols = rols;
    if (isActive !== undefined) {
      data.isActive = isActive;
      data.blocked = !isActive;
    }

    const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', id, {
      data,
      populate: { rols: true },
    });

    await strapi.service('api::audit.audit').logFromCtx(ctx, {
      action: 'UPDATE_USER',
      entity: 'user',
      entityId: parseInt(id),
      before: { username: targetUser.username, email: targetUser.email },
      after: { username: updatedUser.username, email: updatedUser.email },
    });

    ctx.send({
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        isActive: updatedUser.isActive !== false,
        rols: (updatedUser.rols || []).map(r => ({ id: r.id, name: r.name })),
      },
    });
  },

  async adminDeleteUser(ctx) {
    const user = ctx.state.user;

    const { id } = ctx.params;

    const targetUser = await strapi.query('plugin::users-permissions.user').findOne({
      where: { id: parseInt(id) },
    });

    if (!targetUser) {
      return ctx.notFound('Usuario no encontrado');
    }

    // Soft delete: se desactiva y bloquea al usuario en lugar de eliminarlo
    await strapi.entityService.update('plugin::users-permissions.user', id, {
      data: { isActive: false, blocked: true },
    });

    await strapi.service('api::audit.audit').logFromCtx(ctx, {
      action: 'DELETE_USER',
      entity: 'user',
      entityId: parseInt(id),
      before: { isActive: true },
      after: { isActive: false },
    });

    ctx.send({ data: { id: parseInt(id), message: 'Usuario desactivado' } });
  },

  async anonymize(ctx) {
    const user = ctx.state.user;

    const { id } = ctx.params;

    const targetUser = await strapi.query('plugin::users-permissions.user').findOne({
      where: { id: parseInt(id) },
    });

    if (!targetUser) {
      return ctx.notFound('User not found');
    }

    const oldUserData = {
      username: targetUser.username,
      email: targetUser.email,
    };

    const anonymousUsername = `anonimizado_${id}`;
    const anonymousEmail = `anonimizado_${id}@docmentor.local`;

    const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', id, {
      data: {
        username: anonymousUsername,
        email: anonymousEmail,
      },
    });

    await strapi.service('api::audit.audit').logFromCtx(ctx, {
      action: 'ANONYMIZE_USER',
      entity: 'user',
      entityId: parseInt(id),
      before: oldUserData,
      after: {
        username: anonymousUsername,
        email: anonymousEmail,
      },
    });

    ctx.send({
      message: 'Usuario anonimizado correctamente',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
      },
    });
  },
};
