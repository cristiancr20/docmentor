module.exports = ({ env }) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: env('DATABASE_FILENAME', ':memory:'),
    },
    useNullAsDefault: true,
    debug: false, // Activa los logs de depuración
  },
});
