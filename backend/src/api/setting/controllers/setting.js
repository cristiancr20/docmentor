'use strict';

/**
 * setting controller
 *
 * Autenticación y MANAGE_SETTINGS se resuelven en las policies declaradas en
 * routes/setting.js; el comportamiento es el del core.
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::setting.setting');
