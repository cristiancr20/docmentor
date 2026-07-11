'use strict';

/**
 * audit service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::audit.audit');
