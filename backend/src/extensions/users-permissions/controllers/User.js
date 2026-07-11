module.exports = {
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
