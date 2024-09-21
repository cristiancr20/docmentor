'use strict';

/**
 * new-project service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::new-project.new-project');
