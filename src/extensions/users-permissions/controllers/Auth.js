module.exports = {
  async callback(ctx) {
    const provider = ctx.params.provider || 'local';
    const params = ctx.request.body;

    // Look for the user by provider
    const user = await strapi.plugins['users-permissions'].services.user.fetch({
      provider,
      email: params.identifier,
    });

    if (!user) {
      return ctx.badRequest(null, 'Invalid identifier or password');
    }

    // Check if the password is correct
    const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(
      params.password,
      user.password
    );

    if (!validPassword) {
      return ctx.badRequest(null, 'Invalid identifier or password');
    }

    // Create the JWT token
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: user.id,
    });

    // Fetch the user with roles populated
    const userWithRole = await strapi.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      populate: ['rol'] // Include the `rol` relation
    });

    return ctx.send({
      jwt,
      user: userWithRole,
    });
  },
};
