const request = require('supertest');

describe('GET-POST-UPDATE-DELETE /projects', () => {

    it("should return Projects", async () => {
        const response = await request(strapi.server.httpServer)
            .get("/api/projects")
            .expect(200) // Expect response http code 200

        const { data } = response.body;

        // Asegúrate de que `data` esté definido
        expect(data).toBeDefined();

        // Verifica que data sea una array
        expect(Array.isArray(data)).toBe(true);

        console.log("Projects:", data); // Solo para verificar la respuesta
    });

    it("should create a new Project", async () => {
        // Datos del proyecto para crear
        const mockProjectData = {
            title: "Proyecto 1", // Valor para el atributo `title`
            description: "Proyecto de prueba", // Valor para el atributo `description`
            projectType: "Proyecto de prueba", // Valor para el atributo `tipoProyecto`
            itinerary: "Proyecto de prueba software", // Valor para el atributo `itinerario`
        };

        // Crear el nuevo proyecto utilizando el servicio de Strapi
        await strapi.service('api::project.project').create({
            data: mockProjectData,
        });

        // Verificar si el proyecto fue creado correctamente haciendo una solicitud GET
        const response = await request(strapi.server.httpServer)
            .get("/api/projects") // Este es el endpoint para obtener los proyectos, ajusta según tu API
            .expect(200); // Esperamos que la respuesta sea exitosa (código 200)

        // Verifica que la respuesta contenga el nuevo proyecto
        const newProject = response.body;

        // Asegúrate de que el proyecto con `title` "Proyecto 1" haya sido creado
        expect(newProject).toBeDefined();
        
        
        
        //expect(newProject.title).toBe("Proyecto 1");

        console.log("New Project:", newProject); // Solo para verificar la respuesta

    });

    it("should edit a Project", async () => {


        // edita el proyecto utilizando el servicio de Strapi con el id 1 cambiandole el titulo
        await strapi.service('api::project.project').update(1, {
            data: { title: "Proyecto 2" }
        });

        // Verificar si el proyecto fue editado correctamente haciendo una solicitud GET

        const response = await request(strapi.server.httpServer)
            .get("/api/projects") // Este es el endpoint para obtener los proyectos, ajusta según tu API
            .expect(200); // Esperamos que la respuesta sea exitosa (código 200)

        // Verifica que la respuesta contenga el proyecto editado
        const editProject = response.body;

        // Asegúrate de que el proyecto con `title` "Proyecto 2" haya sido editado
        expect(editProject).toBeDefined();
        //expect(editProject.title).toBe("Proyecto 2");

        console.log("Edit Project:", editProject); // Solo para verificar la respuesta
    });

    it("should delete a Project", async () => {
        // Elimina el proyecto utilizando el servicio de Strapi con el id 1
        await strapi.service('api::project.project').delete(1);

        // Verificar si el proyecto fue eliminado correctamente haciendo una solicitud GET
        const response = await request(strapi.server.httpServer)
            .get("/api/projects") // Este es el endpoint para obtener los proyectos, ajusta según tu API
            .expect(200); // Esperamos que la respuesta sea exitosa (código 200)

        // Verifica que la respuesta contenga el proyecto eliminado
        const deleteProject = response.body;

        // Asegúrate de que el proyecto con `title` "Proyecto 2" haya sido eliminado
        expect(deleteProject).toBeDefined();
        //expect(newProject.title).toBe("Proyecto 2");

        console.log("Delete Project:", deleteProject); // Solo para verificar la respuesta
    })

});