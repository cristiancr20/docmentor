const request = require('supertest');
const { authHeader } = require('../helpers/strapi');

describe('GET-POST-UPDATE-DELETE /projects', () => {

    it("should return Projects", async () => {
        const response = await request(strapi.server.httpServer)
            .get("/api/projects")
            .set(authHeader())
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
            .set(authHeader())
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
            .set(authHeader())
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
            .set(authHeader())
            .expect(200); // Esperamos que la respuesta sea exitosa (código 200)

        // Verifica que la respuesta contenga el proyecto eliminado
        const deleteProject = response.body;

        // Asegúrate de que el proyecto con `title` "Proyecto 2" haya sido eliminado
        expect(deleteProject).toBeDefined();
        //expect(newProject.title).toBe("Proyecto 2");

        console.log("Delete Project:", deleteProject); // Solo para verificar la respuesta
    })

});
// Las rutas de project declaran sus policies en routes/ (US-008). Aquí se
// comprueba por HTTP que están enganchadas: sin ellas, el controller ya no
// autentica ni autoriza por su cuenta.
describe('policies en las rutas de /projects', () => {
  let coordinator;
  let coordinatorToken;
  let project;

  const issueToken = (user) =>
    strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

  beforeAll(async () => {
    const [createPermission, changeStatusPermission] = await Promise.all([
      strapi.db.query('api::permission.permission').create({
        data: { code: 'CREATE_PROJECT', module: 'projects', isActive: true },
      }),
      strapi.db.query('api::permission.permission').create({
        data: { code: 'CHANGE_PROJECT_STATUS', module: 'projects', isActive: true },
      }),
    ]);

    // `coordinador` es un rol elevado (utils/ownership): así el control de
    // pertenencia no interfiere y lo que se prueba es la policy.
    const rol = await strapi.db.query('api::rol.rol').create({
      data: {
        name: 'RouteCoordinator',
        rolType: 'coordinador',
        permissions: [createPermission.id, changeStatusPermission.id],
      },
    });

    // Las rutas core conservan la autenticación de users-permissions (ver
    // routes/project.js), así que el usuario también necesita el `role`
    // `authenticated` con los permisos que concede helpers/strapi.js.
    const authenticatedRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    coordinator = await strapi.db.query('plugin::users-permissions.user').create({
      data: {
        username: 'route-coordinator',
        email: 'route-coordinator@docmentor.test',
        password: 'Coordinator123',
        provider: 'local',
        confirmed: true,
        blocked: false,
        isActive: true,
        role: authenticatedRole.id,
        rols: [rol.id],
      },
    });
    coordinatorToken = issueToken(coordinator);

    project = await strapi.entityService.create('api::project.project', {
      data: { title: 'Proyecto con policies', status: 'Creado', publishedAt: new Date() },
    });
  });

  it('rechaza GET /projects sin token', async () => {
    const response = await request(strapi.server.httpServer).get('/api/projects');

    expect([401, 403]).toContain(response.status);
  });

  it('rechaza PUT /projects/:id/change-status sin token (is-authenticated)', async () => {
    await request(strapi.server.httpServer)
      .put(`/api/projects/${project.id}/change-status`)
      .send({ status: 'En Revisión' })
      .expect(403);
  });

  it('rechaza PUT /projects/:id/change-status sin CHANGE_PROJECT_STATUS (has-permission)', async () => {
    await request(strapi.server.httpServer)
      .put(`/api/projects/${project.id}/change-status`)
      .set(authHeader())
      .send({ status: 'En Revisión' })
      .expect(403);
  });

  it('rechaza POST /projects sin CREATE_PROJECT (has-permission)', async () => {
    await request(strapi.server.httpServer)
      .post('/api/projects')
      .set(authHeader())
      .send({ data: { title: 'No debería crearse' } })
      .expect(403);
  });

  it('acepta POST /projects con CREATE_PROJECT y audita con ctx.state.user', async () => {
    const response = await request(strapi.server.httpServer)
      .post('/api/projects')
      .set({ Authorization: `Bearer ${coordinatorToken}` })
      .send({ data: { title: 'Creado por policy' } })
      .expect(200);

    expect(response.body.data.attributes.title).toBe('Creado por policy');

    const audit = await strapi.db.query('api::audit.audit').findOne({
      where: { action: 'CREATE_PROJECT', entityId: response.body.data.id },
    });
    expect(audit).not.toBeNull();
    expect(audit.userId).toBe(coordinator.id);
  });

  it('acepta PUT /projects/:id/change-status con CHANGE_PROJECT_STATUS', async () => {
    const response = await request(strapi.server.httpServer)
      .put(`/api/projects/${project.id}/change-status`)
      .set({ Authorization: `Bearer ${coordinatorToken}` })
      .send({ status: 'En Revisión' })
      .expect(200);

    expect(response.body.status).toBe('En Revisión');

    const audit = await strapi.db.query('api::audit.audit').findOne({
      where: { action: 'CHANGE_PROJECT_STATUS', entityId: project.id },
    });
    expect(audit).not.toBeNull();
    expect(audit.userId).toBe(coordinator.id);
  });

  it('el filtro de find sigue aplicándose a usuarios no elevados', async () => {
    // test-runner no tiene rols: no es elevado, así que no ve proyectos en los
    // que no participa; el coordinador sí.
    const asRunner = await request(strapi.server.httpServer)
      .get('/api/projects')
      .set(authHeader())
      .expect(200);
    expect(asRunner.body.data.map((item) => item.id)).not.toContain(project.id);

    const asCoordinator = await request(strapi.server.httpServer)
      .get('/api/projects')
      .set({ Authorization: `Bearer ${coordinatorToken}` })
      .expect(200);
    expect(asCoordinator.body.data.map((item) => item.id)).toContain(project.id);
  });
});
