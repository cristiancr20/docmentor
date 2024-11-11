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

    // Establecer el token como una cookie `HttpOnly`
/*     ctx.cookies.set('authToken', jwt, {
      httpOnly: true, // La cookie no es accesible desde JavaScript
      secure: process.env.NODE_ENV === 'production', // Solo se envía sobre HTTPS en producción
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax', // 'Lax' para desarrollo y 'Strict' para producción
      maxAge: 1000 * 60 * 60, // Expiración de 1 hora en milisegundos
    }); */


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

  async check(ctx) {
    const user = ctx.state.user; // Verifica si el usuario está autenticado
    if (user) {
      return ctx.send({ message: 'Usuario autenticado' });
    } else {
      return ctx.unauthorized('No autenticado');
    }
  }
};
