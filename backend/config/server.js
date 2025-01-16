module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: 'https://computacion.unl.edu.ec/docmentorapi', // Ruta base donde se aloja Strapi
  app: {
    keys: env.array('APP_KEYS', ['crcode130900', 'Capitacr20']),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
