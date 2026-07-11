module.exports = {
  async getMyPermissions(ctx) {
    const { authenticate } = require('../../../utils/protectedController');

    const user = authenticate(ctx, strapi);
    if (!user) return;

    const userWithRole = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
      populate: {
        rol: {
          populate: {
            permissions: true,
          },
        },
      },
    });

    if (!userWithRole || !userWithRole.rol) {
      return ctx.send({ data: [] });
    }

    const permissions = userWithRole.rol.permissions || [];
    const permissionCodes = permissions
      .filter(p => p.isActive)
      .map(p => p.code);

    ctx.send({
      data: permissionCodes,
      permissions: permissions.filter(p => p.isActive),
    });
  },

  async adminListUsers(ctx) {
    const { authenticate, authorize } = require('../../../utils/protectedController');

    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'VIEW_USERS', strapi);
    if (!hasPermission) return;

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
    const { authenticate, authorize } = require('../../../utils/protectedController');

    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_USERS', strapi);
    if (!hasPermission) return;

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

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'CREATE_USER',
      'user',
      newUser.id,
      user.id,
      null,
      { username: newUser.username, email: newUser.email },
      ipAddress
    );

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
    const { authenticate, authorize } = require('../../../utils/protectedController');

    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_USERS', strapi);
    if (!hasPermission) return;

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

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'UPDATE_USER',
      'user',
      parseInt(id),
      user.id,
      { username: targetUser.username, email: targetUser.email },
      { username: updatedUser.username, email: updatedUser.email },
      ipAddress
    );

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
    const { authenticate, authorize } = require('../../../utils/protectedController');

    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'MANAGE_USERS', strapi);
    if (!hasPermission) return;

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

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

    await strapi.service('api::audit.audit').logAudit(
      'DELETE_USER',
      'user',
      parseInt(id),
      user.id,
      { isActive: true },
      { isActive: false },
      ipAddress
    );

    ctx.send({ data: { id: parseInt(id), message: 'Usuario desactivado' } });
  },

  async anonymize(ctx) {
    const { authenticate, authorize } = require('../../../utils/protectedController');

    const user = authenticate(ctx, strapi);
    if (!user) return;

    const hasPermission = await authorize(ctx, user.id, 'ANONYMIZE_USER', strapi);
    if (!hasPermission) return;

    const { id } = ctx.params;

    const targetUser = await strapi.query('plugin::users-permissions.user').findOne({
      where: { id: parseInt(id) },
    });

    if (!targetUser) {
      return ctx.notFound('User not found');
    }

    const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for']?.split(',')[0] || '';

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

    await strapi.service('api::audit.audit').logAudit(
      'ANONYMIZE_USER',
      'user',
      parseInt(id),
      user.id,
      oldUserData,
      {
        username: anonymousUsername,
        email: anonymousEmail,
      },
      ipAddress
    );

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
