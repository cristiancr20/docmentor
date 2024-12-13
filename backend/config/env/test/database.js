
module.exports = ({ env }) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: env('DATABASE_FILENAME', './data.db'), 
    },
    useNullAsDefault: true,
    debug: false
  },
});