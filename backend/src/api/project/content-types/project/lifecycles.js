/* 'use strict';

const { transporter } = require('../../../../mailer/mailer'); // Configuración de Nodemailer
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// ENVIAR CORREO CUANDO SE CREA UN PROYECTO
module.exports = {
    async afterCreate(event) {
        const { result } = event;

        try {
            console.log("Evento completo:", result);

            // Extraer ID del proyecto
            const projectId = result.id;
            const projectTitle = result.title;

            if (!projectId) {
                console.error('No se encontró un ID de proyecto válido.');
                return;
            }

            // Consultar datos del proyecto incluyendo tutor y estudiantes
            const proyecto = await strapi.db.query('api::project.project').findOne({
                where: { id: projectId },
                populate: ['tutor', 'students'],
            });

            if (!proyecto) {
                console.error(`Proyecto con ID ${projectId} no encontrado.`);
                return;
            }

            const tutor = proyecto.tutor;
            const students = proyecto.students;

            if (!tutor || !students || students.length === 0) {
                console.error('Faltan datos esenciales (tutor o estudiantes) en el proyecto.');
                return;
            }

            console.log("Tutor encontrado:", tutor);
            console.log("Estudiantes encontrados:", students);

            // Asumir que el primer estudiante de la lista es el creador
            // Obtener los estudiantes del proyecto

            const studentsList = students
                .map(student => `<li>${student.username} (${student.email})</li>`)
                .join('');

            // Cargar y compilar el template del correo
            const templatePath = path.join(__dirname, './project.html');
            let htmlContent = fs.readFileSync(templatePath, 'utf8');

            htmlContent = htmlContent.replace('{{docenteName}}', tutor.username)
                .replace('{{projectTitle}}', projectTitle)
                .replace('{{students}}', studentsList);

            // Configuración del correo
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: tutor.email, // Correo del tutor
                subject: `Asignación de Proyecto: ${projectTitle}`, // Asunto
                html: htmlContent, // Contenido del correo
            };

            // Enviar el correo
            const info = await transporter.sendMail(mailOptions);
            console.log("Correo enviado exitosamente:", info.messageId);
        } catch (error) {
            console.error("Error al enviar correo electrónico:", error);
        }
    },
};
 */