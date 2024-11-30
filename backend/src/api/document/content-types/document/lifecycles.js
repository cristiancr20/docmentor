'use strict';

const { transporter } = require('../../../../mailer/mailer');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

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

            const templatePath = path.resolve(__dirname, './email-template-document.html');
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


    async afterUpdate(event) {
        const { result, params } = event;

        try {
            console.log("Evento completo:", {
                result: result,
                params: params
            });

            if (result.revisado === true) {
                console.log("Documento marcado como revisado. Iniciando proceso de envío de correo.");

                const documentWithPopulate = await strapi.entityService.findOne('api::document.document', result.id, {
                    populate: ['project', 'project.estudiante', 'comments']
                });

                console.log("Documento con relaciones:", documentWithPopulate);

                const project = documentWithPopulate.project;
                const estudiante = project.estudiante;

                if (!estudiante || !estudiante.email) {
                    console.warn(`No se encontró correo electrónico para el estudiante en el proyecto: ${project.Title}`);
                    return;
                }

                console.log(`Preparando correo para el estudiante: ${estudiante.email}`);

                const comentarios = documentWithPopulate.comments || [];

                console.log("Comentarios:", comentarios);

                // Leer la plantilla HTML
                const templatePath = path.resolve(__dirname, './email-template-comment.html');
                // Leer la plantilla
                const templateSource = fs.readFileSync(templatePath, 'utf8');

                // Compilar la plantilla con Handlebars
                const template = Handlebars.compile(templateSource);
                const context = {
                    username: estudiante.username || 'Estudiante',
                    documentTitle: result.title,
                    projectTitle: project.Title,
                    hasComments: comentarios.length > 0,
                    comments: comentarios.map(comment => ({
                        correccion: comment.correccion,
                        quote: comment.quote
                    }))
                };

                // Generar el HTML dinámico
                const htmlContent = template(context);

                const subject = `Documento Revisado: ${result.title}`;

                // Enviar el correo al estudiante
                await transporter.sendMail({
                    from: process.env.SMTP_USER,  // Usamos la variable de entorno para el remitente
                    to: estudiante.email,
                    subject,
                    html: htmlContent,
                });

                strapi.log.info(`Correo enviado al estudiante (${estudiante.email}) para el documento: ${result.title}`);
            } else {
                console.log("El documento no está marcado como revisado. No se enviará correo.");
            }
        } catch (error) {
            console.error('Error en afterUpdate lifecycle de documentos:', error);
        }
    },
};