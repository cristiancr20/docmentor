// Base de datos propia de los tests.
//
// Antes se leía DATABASE_FILENAME del .env, así que la suite corría contra la
// base de desarrollo: los tests hacen `delete(1)` y `update(1, ...)` sobre
// proyectos, es decir, `npm test` borraba y renombraba datos reales.
// El fichero se recrea en cada ejecución (ver helpers/strapi.js).
module.exports = () => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: '.tmp/test.db',
    },
    useNullAsDefault: true,
    debug: false,
  },
});
