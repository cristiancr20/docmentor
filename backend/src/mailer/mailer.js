const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 60000,  // Aumentado a 60 segundos
  socketTimeout: 60000
});

transporter.verify(function (error, success) {
  if (error) {
    strapi.log.error("Error al verificar la conexión SMTP:", error);
  } else {
    strapi.log.info("Servidor SMTP listo para enviar mensajes");
  }
});

module.exports = { transporter };
