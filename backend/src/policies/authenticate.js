'use strict';

module.exports = async (policyContext, config, { strapi }) => {
  const { request } = policyContext;
  const token = request.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return false;
  }

  try {
    const decoded = await strapi.plugins['users-permissions'].services.jwt.verify(token);
    policyContext.state.user = decoded;
    return true;
  } catch (error) {
    strapi.log.warn(`Authentication failed: ${error.message}`);
    return false;
  }
};
