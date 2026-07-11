'use strict';

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const createProtectedRoute = (method, path, handler, requiredPermission) => ({
  method,
  path,
  handler,
  config: {
    middlewares: [authenticate, authorize(requiredPermission)],
  },
});

module.exports = { createProtectedRoute };
