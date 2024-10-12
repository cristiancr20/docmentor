module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'qZrmX2mtYzNe/dqjBESz2Q=='),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'jnH4g+sYcn+gIfPcg4e4wA=='),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'Da0+jJyy9LvTSqrqrCxEEQ=='),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
