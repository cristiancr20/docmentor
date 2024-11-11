module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  /*  'strapi::cors', */
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://localhost:3000'], // Cambia esto por la URL de tu frontend
      credentials: true,
    },
  },

  /*   {
      name: 'strapi::cors',
      config: {
        origin: process.env.NODE_ENV === 'production'
          ? ['https://docutrack.vercel.app']
          : ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: [],
        credentials: true,
        maxAge: 3600,
      },
    }, */
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
