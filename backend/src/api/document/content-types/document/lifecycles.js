/* 'use strict';

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

            // Extraer el ID del proyecto
            let projectId = null;

            if (params.data.project && typeof params.data.project === 'number') {
                projectId = params.data.project;
            } else if (params.data.project && params.data.project.connect && params.data.project.connect.length > 0) {
                projectId = params.data.project.connect[0].id;
            }

            if (!projectId) {
                strapi.log.error('No se encontró un ID de proyecto válido en el documento.');
                return;
            }

            console.log("ID del proyecto:", projectId);

            const proyecto = await strapi.db.query('api::project.project').findOne({
                where: { id: projectId },
                populate: ['tutor', 'students'],
            });

            if (!proyecto) {
                console.error(`Proyecto con ID ${projectId} no encontrado`);
                return;
            }

            console.log("Proyecto encontrado:", proyecto);

            const tutorEmail = proyecto.tutor?.email;
            const tutorUsername = proyecto.tutor?.username || 'Tutor';
            const projectName = proyecto.title || 'Sin título';
            const documentTitle = result.title || 'Documento sin título';

            if (!tutorEmail) {
                strapi.log.warn(`No se encontró el correo electrónico del tutor para el proyecto: ${projectName}`);
                return;
            }

            // Obtener los nombres de los estudiantes
            // Crear una lista en HTML de los estudiantes
            const studentListHTML = proyecto.students
                .map(student => `<li>${student.username}</li>`)
                .join('');

            console.log("Nombres de los estudiantes:", studentListHTML);

            // Leer y actualizar el contenido del template
            const templatePath = path.resolve(__dirname, './email-template-document.html');
            let htmlContent = fs.readFileSync(templatePath, 'utf8');

            htmlContent = htmlContent.replace('{{tutorUsername}}', tutorUsername)
                .replace('{{documentTitle}}', documentTitle)
                .replace('{{projectName}}', projectName)
                .replace('{{studentsList}}', studentListHTML); // Insertar nombres de estudiantes

            // Configuración del correo
            const subject = `Nuevo Documento Subido: ${documentTitle}`;

            await transporter.sendMail({
                from: process.env.SMTP_USER,
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

            if (result.isRevised === true) {
                console.log("Documento marcado como revisado. Iniciando proceso de envío de correos.");

                const documentWithPopulate = await strapi.entityService.findOne('api::document.document', result.id, {
                    populate: ['project', 'project.students', 'comments'] // Asegúrate de que 'students' esté correctamente relacionado
                });

                console.log("Documento con relaciones:", documentWithPopulate);

                const project = documentWithPopulate.project;
                const students = project.students; // Accedemos a 'students.data'

                console.log("Proyecto del documento:", project);
                console.log("Estudiantes del proyecto:", students);

                if (!students || students.length === 0) {
                    console.warn(`No se encontraron estudiantes en el proyecto: ${project.title}`);
                    return;
                }

                // Recorremos el arreglo de estudiantes
                for (let student of students) {
                    const estudiante = student; // Los atributos del estudiante están dentro de 'attributes'

                    if (!estudiante.email) {
                        console.warn(`No se encontró correo electrónico para el estudiante: ${estudiante.username} en el proyecto: ${project.title}`);
                        continue;  // Si no hay correo, pasamos al siguiente estudiante
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
                        projectTitle: project.title,
                        hasComments: comentarios.length > 0,
                        comments: comentarios.map(comment => ({
                            correccion: comment.correction,
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
                }
            } else {
                console.log("El documento no está marcado como revisado. No se enviarán correos.");
            }
        } catch (error) {
            console.error('Error en afterUpdate lifecycle de documentos:', error);
        }
    },

};  */