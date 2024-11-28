
module.exports = ({ env }) => ({
  // ...
  email: {
    config: {
      provider: 'sendgrid', // For community providers pass the full package name (e.g. provider: 'strapi-provider-email-mandrill')
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
      settings: {
        defaultFrom: 'cristian.capa20@gmail.com',
        defaultReplyTo: 'cristian.capa20@gmail.com',
      },
    },
  },
  // ...
});