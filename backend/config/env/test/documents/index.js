const request = require('supertest');
const { authHeader } = require('../helpers/strapi');

describe("GET-POST /documents", () => {
    it("should return Documents", async () => {
        const response = await request(strapi.server.httpServer)
            .get("/api/documents")
            .set(authHeader())
            .expect(200)

        const { data } = response.body;

        expect(data).toBeDefined();

        expect(Array.isArray(data)).toBe(true);

        console.log("Documents:", data);
    });

    it("should create a new Document", async () => {
        const mockDocumentData = {
            title: "Document 1",
            isRevised: false,
        };

        await strapi.service('api::document.document').create({
            data: mockDocumentData,
        });

        const response = await request(strapi.server.httpServer)
            .get("/api/documents")
            .set(authHeader())
            .expect(200);

        const newDocument = response.body;

        expect(newDocument).toBeDefined();

        console.log("New Document:", newDocument);
    });
})
// Las rutas de document declaran sus policies en routes/ (US-007). Aquí se
// comprueba por HTTP que están enganchadas: sin ellas, el controller ya no
// autentica ni autoriza por su cuenta.
describe('policies en las rutas de /documents', () => {
  let reviewer;
  let reviewerToken;
  let document;

  const issueToken = (user) =>
    strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

  beforeAll(async () => {
    const reviewPermission = await strapi.db.query('api::permission.permission').create({
      data: { code: 'REVIEW_DOCUMENT', module: 'documents', isActive: true },
    });

    // `superadmin` es un rol elevado (utils/ownership): así el control de
    // pertenencia no interfiere y lo que se prueba es la policy.
    const rol = await strapi.db.query('api::rol.rol').create({
      data: { name: 'RouteReviewer', rolType: 'superadmin', permissions: [reviewPermission.id] },
    });

    // Las rutas core conservan la autenticación de users-permissions (ver
    // routes/document.js), así que el usuario también necesita el `role`
    // `authenticated` con los permisos que concede helpers/strapi.js.
    const authenticatedRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    reviewer = await strapi.db.query('plugin::users-permissions.user').create({
      data: {
        username: 'route-reviewer',
        email: 'route-reviewer@docmentor.test',
        password: 'Reviewer12345',
        provider: 'local',
        confirmed: true,
        blocked: false,
        isActive: true,
        role: authenticatedRole.id,
        rols: [rol.id],
      },
    });
    reviewerToken = issueToken(reviewer);

    document = await strapi.entityService.create('api::document.document', {
      data: { title: 'Documento con policies', isRevised: false, publishedAt: new Date() },
    });
  });

  it('rechaza GET /documents sin token', async () => {
    const response = await request(strapi.server.httpServer).get('/api/documents');

    expect([401, 403]).toContain(response.status);
  });

  it('rechaza PUT /documents/:id/review sin token (is-authenticated)', async () => {
    await request(strapi.server.httpServer)
      .put(`/api/documents/${document.id}/review`)
      .send({ data: { isRevised: true } })
      .expect(403);
  });

  it('rechaza PUT /documents/:id/review sin REVIEW_DOCUMENT (has-permission)', async () => {
    await request(strapi.server.httpServer)
      .put(`/api/documents/${document.id}/review`)
      .set(authHeader())
      .send({ data: { isRevised: true } })
      .expect(403);
  });

  it('rechaza POST /documents sin CREATE_DOCUMENT (has-permission)', async () => {
    await request(strapi.server.httpServer)
      .post('/api/documents')
      .set(authHeader())
      .send({ data: { title: 'No debería crearse' } })
      .expect(403);
  });

  it('acepta PUT /documents/:id/review con REVIEW_DOCUMENT y deja el usuario en ctx.state.user', async () => {
    const response = await request(strapi.server.httpServer)
      .put(`/api/documents/${document.id}/review`)
      .set({ Authorization: `Bearer ${reviewerToken}` })
      .send({ data: { isRevised: true } })
      .expect(200);

    expect(response.body.data.isRevised).toBe(true);

    // El controller audita con `user.id` tomado de ctx.state.user.
    const audit = await strapi.db.query('api::audit.audit').findOne({
      where: { action: 'REVIEW_DOCUMENT', entityId: document.id },
    });
    expect(audit).not.toBeNull();
    expect(audit.userId).toBe(reviewer.id);
  });

  it('el filtro de find sigue aplicándose a usuarios no elevados', async () => {
    // test-runner no tiene rols: no es elevado, así que no ve documentos sin
    // proyecto; el superadmin sí.
    const asRunner = await request(strapi.server.httpServer)
      .get('/api/documents')
      .set(authHeader())
      .expect(200);
    expect(asRunner.body.data.map((doc) => doc.id)).not.toContain(document.id);

    const asAdmin = await request(strapi.server.httpServer)
      .get('/api/documents')
      .set({ Authorization: `Bearer ${reviewerToken}` })
      .expect(200);
    expect(asAdmin.body.data.map((doc) => doc.id)).toContain(document.id);
  });
});
