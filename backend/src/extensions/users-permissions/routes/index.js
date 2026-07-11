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
];
