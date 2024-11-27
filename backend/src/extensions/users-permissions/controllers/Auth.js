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

    // Obtén el rol relacionado
    const rol = await strapi.query('rol').findOne({ id: user.rol.id });


    // Create the JWT token
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: user.id,
      username: user.username,
      email: user.email,
      rol: rol.tipoRol,
    });

    // Fetch the user with roles populated
    const userWithRole = await strapi.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      populate: ['rol'] // Include the `rol` relation
    });

    return ctx.send({
      jwt,   
      user:{
        ...userWithRole,
        rol: rol.tipoRol
      }
    });

  },

  async check(ctx) {
    const user = ctx.state.user; // Verifica si el usuario está autenticado
    if (user) {
      return ctx.send({ message: 'Usuario autenticado' });
    } else {
      return ctx.unauthorized('No autenticado');
    }
  }
};
