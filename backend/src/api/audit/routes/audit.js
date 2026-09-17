'use strict';

/**
 * audit router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::audit.audit');
