'use strict';

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const token = ctx.request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return ctx.unauthorized('No token provided');
    }

    try {
      const decoded = await strapi.plugins['users-permissions'].services.jwt.verify(token);
      ctx.state.user = decoded;
      return next();
    } catch (error) {
      strapi.log.warn(`Authentication failed: ${error.message}`);
      return ctx.unauthorized('Invalid or expired token');
    }
  };
};
