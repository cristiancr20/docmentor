module.exports = [
  {
    method: 'GET',
    path: '/auth/me/permissions',
    handler: 'plugin::users-permissions.user.getMyPermissions',
    config: { auth: false },
  },
  {
    method: 'DELETE',
    path: '/users/:id/anonymize',
    handler: 'plugin::users-permissions.user.anonymize',
    config: { auth: false },
  },
  {
    method: 'GET',
    path: '/admin/users',
    handler: 'plugin::users-permissions.user.adminListUsers',
    config: { auth: false },
  },
  {
    method: 'POST',
    path: '/admin/users',
    handler: 'plugin::users-permissions.user.adminCreateUser',
    config: { auth: false },
  },
  {
    method: 'PUT',
    path: '/admin/users/:id',
    handler: 'plugin::users-permissions.user.adminUpdateUser',
    config: { auth: false },
  },
  {
    method: 'DELETE',
    path: '/admin/users/:id',
    handler: 'plugin::users-permissions.user.adminDeleteUser',
    config: { auth: false },
  },
];
