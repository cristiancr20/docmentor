'use strict';

const { transporter } = require('../../../../mailer/mailer');
const fs = require('fs');
const path = require('path');

module.exports = {
    async afterCreate(event) {
        const { result, params } = event;

        try {
            console.log("Evento completo:", {
                result: result,
                params: params
            });

            // Nuevo método para extraer el ID del proyecto
            let projectId = null;

            // Caso 1: Frontend upload (direct number)
            if (params.data.project && typeof params.data.project === 'number') {
                projectId = params.data.project;
            }
            
            // Caso 2: Strapi dashboard (connect structure)
            else if (params.data.project && params.data.project.connect && params.data.project.connect.length > 0) {
                projectId = params.data.project.connect[0].id;
            }

            if (!projectId) {
                strapi.log.error('No se encontró un ID de proyecto válido en el documento.');
                return;
            }

            console.log("ID del proyecto:", projectId);

            const proyecto = await strapi.db.query('api::new-project.new-project').findOne({
                where: { id: projectId },
                populate: ['tutor', 'estudiante'],
            });

            if (!proyecto) {
                console.error(`Proyecto con ID ${projectId} no encontrado`);
                return;
            }

            // Verificar que el tutor tenga un correo electrónico
            const tutorEmail = proyecto.tutor?.email;
            const tutorUsername = proyecto.tutor?.username || 'Tutor';  // Asegurarse de que el tutor tenga un nombre
            const projectName = proyecto.Title || 'Sin título';  // Título del proyecto
            const documentTitle = result.title || 'Documento sin título';  // Título del documento



            if (!tutorEmail) {
                strapi.log.warn(`No se encontró el correo electrónico del tutor para el proyecto: ${projectName}`);
                return;
            }

            const templatePath = path.resolve(__dirname, './email-template.html');
            let htmlContent = fs.readFileSync(templatePath, 'utf8');

            // Reemplazar los placeholders con los valores dinámicos
            htmlContent = htmlContent.replace('{{tutorUsername}}', tutorUsername)
                .replace('{{documentTitle}}', documentTitle)
                .replace('{{projectName}}', projectName);


            // Configuración del correo
            const subject = `Nuevo Documento Subido: ${documentTitle}`;
            // Enviar el correo al tutor
            await transporter.sendMail({
                from: process.env.SMTP_USER,  // Usamos la variable de entorno para el remitente
                to: tutorEmail,
                subject,
                html: htmlContent,
            });

            strapi.log.info(`Correo enviado al tutor (${tutorEmail}) para el documento: ${documentTitle}`);

        } catch (error) {
            strapi.log.error('Error al enviar correo en afterCreate lifecycle:', error);
        }
    },
};