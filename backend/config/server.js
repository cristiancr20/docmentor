module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  //url: 'https://computacion.unl.edu.ec/docmentorapi', // Ruta base donde se aloja Strapi
  app: {
    // Sin valor por defecto a propósito: unas claves fijas en el código hacen
    // predecible la firma de las cookies de sesión. Si falta APP_KEYS, Strapi
    // falla al arrancar en lugar de usar algo inseguro.
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  cron: {
    enabled: true,
    tasks: {
      // La purga de notificaciones se disparaba desde el GET del historial: una
      // lectura de cualquier usuario borraba notificaciones de todo el sistema,
      // sin control de concurrencia. Ahora es una tarea programada.
      '0 3 * * *': async ({ strapi }) => {
        try {
          await strapi.service('api::notification.notification').cleanupOldNotifications();
        } catch (error) {
          strapi.log.error(`Error limpiando notificaciones antiguas: ${error.message}`);
        }
      },
    },
  },
});
