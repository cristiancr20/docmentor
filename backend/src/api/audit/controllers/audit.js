'use strict';

/**
 * audit controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::audit.audit');
