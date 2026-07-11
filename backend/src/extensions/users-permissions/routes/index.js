module.exports = [
  {
    method: 'DELETE',
    path: '/users/:id/anonymize',
    handler: 'plugin::users-permissions.user.anonymize',
    config: { auth: false },
  },
];
