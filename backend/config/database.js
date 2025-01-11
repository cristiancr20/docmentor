const path = require('path');

module.exports = ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  const connections = {
    mysql: {
      connection: {
        connectionString: env('DATABASE_URL'),
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: env.bool('DATABASE_SSL', false) && {
          key: env('DATABASE_SSL_KEY', undefined),
          cert: env('DATABASE_SSL_CERT', undefined),
          ca: env('DATABASE_SSL_CA', undefined),
          capath: env('DATABASE_SSL_CAPATH', undefined),
          cipher: env('DATABASE_SSL_CIPHER', undefined),
          rejectUnauthorized: env.bool(
            'DATABASE_SSL_REJECT_UNAUTHORIZED',
            true
          ),
        },
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    mysql2: {
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: env.bool('DATABASE_SSL', false) && {
          key: env('DATABASE_SSL_KEY', undefined),
          cert: env('DATABASE_SSL_CERT', undefined),
          ca: env('DATABASE_SSL_CA', undefined),
          capath: env('DATABASE_SSL_CAPATH', undefined),
          cipher: env('DATABASE_SSL_CIPHER', undefined),
          rejectUnauthorized: env.bool(
            'DATABASE_SSL_REJECT_UNAUTHORIZED',
            true
          ),
        },
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },

    postgres: {
      connection: {
        connectionString: process.env.DATABASE_URL, // Si estás utilizando un URL completo para la conexión
        host: process.env.DATABASE_HOST || 'localhost',  // Usa la variable de entorno DATABASE_HOST
        port: parseInt(process.env.DATABASE_PORT) || 5434, // Usa el puerto de la variable de entorno (5434 en tu caso)
        database: process.env.DATABASE_NAME || 'strapi', // Nombre de la base de datos
        user: process.env.DATABASE_USERNAME || 'postgres', // Usuario de la base de datos
        password: process.env.DATABASE_PASSWORD || 'admin', // Contraseña de la base de datos
        ssl: process.env.DATABASE_SSL === 'true',  // Si SSL está activado, dependiendo de tu configuración
      },
      pool: {
        min: parseInt(process.env.DATABASE_POOL_MIN) || 2,
        max: parseInt(process.env.DATABASE_POOL_MAX) || 10
      },
    },
    /* postgres: {
     connection: {
       connectionString: env('DATABASE_URL'),
       host: env('DATABASE_HOST', 'localhost'),
       port: env.int('DATABASE_PORT', 5432),
       database: env('DATABASE_NAME', 'strapi'),
       user: env('DATABASE_USERNAME', 'strapi'),
       password: env('DATABASE_PASSWORD', 'strapi'),
       ssl: env.bool('DATABASE_SSL', false) && {
         key: env('DATABASE_SSL_KEY', undefined),
         cert: env('DATABASE_SSL_CERT', undefined),
         ca: env('DATABASE_SSL_CA', undefined),
         capath: env('DATABASE_SSL_CAPATH', undefined),
         cipher: env('DATABASE_SSL_CIPHER', undefined),
         rejectUnauthorized: env.bool(
           'DATABASE_SSL_REJECT_UNAUTHORIZED',
           true
         ),
       },
       schema: env('DATABASE_SCHEMA', 'public'),
     },
     pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
   },  */
    //Cristian Capa 
    // DocuTrack
    /*     sqlite: {
          connection: {
            filename: path.join(
              __dirname,
              '..',
              env('DATABASE_FILENAME', '.tmp/data.db')
            ),
          },
          useNullAsDefault: true,
        }, */
    sqlite: {
      connection: {
        filename: path.join(__dirname, '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },

  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
