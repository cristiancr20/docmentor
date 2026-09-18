const request = require('supertest');
const { authHeader } = require('../helpers/strapi');

describe('GET-POST-UPDATE-DELETE /comments', () => {
    it("should return Comments", async () => {
        const response = await request(strapi.server.httpServer)
            .get("/api/comments")
            .set(authHeader())
            .expect(200)

        const { data } = response.body;

        expect(data).toBeDefined();

        expect(Array.isArray(data)).toBe(true);

        console.log("Comments:", data);
    });

    it("should create a new Comment", async () => {
        const mockCommentData = {
            highlightAreas: "highlightAreas test",
            quote: "sdsdfsdf",
            correction: "correccion test",
        };

        await strapi.service('api::comment.comment').create({
            data: mockCommentData,
        });

        const response = await request(strapi.server.httpServer)
            .get("/api/comments")
            .set(authHeader())
            .expect(200);

        const newComment = response.body;

        expect(newComment).toBeDefined();

        console.log("New Comment:", newComment);
    });

    it("should edit a Comment", async () => {
/*         const mockCommentData = {
            highlightAreas: "highlightAreas test",
            quote: "sdsdfsdf",
            correccion: "correccion test",
        };
        await strapi.service('api::comment.comment').create({
            ...mockCommentData,
        }); */

        await strapi.service('api::comment.comment').update(1, {
            data: {
                highlightAreas: "highlightAreas test",
                quote: "sdsdfsdf",
                correction: "correccion test",
            },
        });


        const response = await request(strapi.server.httpServer)
            .get("/api/comments")
            .set(authHeader())
            .expect(200);

        const newComment = response.body;

        expect(newComment).toBeDefined();

        console.log("New Comment:", newComment);
    });


    it("should delete a Comment", async () => {
        await strapi.service('api::comment.comment').delete(1);

        const response = await request (strapi.server.httpServer)
            .get("/api/comments")
            .set(authHeader())
            .expect(200);

        const deleteComment = response.body;

        expect(deleteComment).toBeDefined();

        console.log("Delete Comment:", deleteComment);
    });
})
// Las rutas de comment declaran sus policies en routes/comment.js (US-008).
// `create` exige COMMENT_DOCUMENT por policy; `update`/`delete` solo sesión,
// porque la decisión autor-o-moderador la toma `canModifyComment`.
describe('policies en las rutas de /comments', () => {
  let commenter;
  let commenterToken;
  let moderator;
  let moderatorToken;

  const issueToken = (user) =>
    strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

  const authenticatedRole = () =>
    strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });

  const createUser = async (username, rolIds) =>
    strapi.db.query('plugin::users-permissions.user').create({
      data: {
        username,
        email: `${username}@docmentor.test`,
        password: 'Password12345',
        provider: 'local',
        confirmed: true,
        blocked: false,
        isActive: true,
        role: (await authenticatedRole()).id,
        rols: rolIds,
      },
    });

  beforeAll(async () => {
    const commentPermission = await strapi.db.query('api::permission.permission').create({
      data: { code: 'COMMENT_DOCUMENT', module: 'comments', isActive: true },
    });
    const managePermission = await strapi.db.query('api::permission.permission').create({
      data: { code: 'MANAGE_COMMENTS', module: 'comments', isActive: true },
    });

    const commenterRol = await strapi.db.query('api::rol.rol').create({
      data: { name: 'RouteCommenter', rolType: 'estudiante', permissions: [commentPermission.id] },
    });
    const moderatorRol = await strapi.db.query('api::rol.rol').create({
      data: { name: 'RouteModerator', rolType: 'tutor', permissions: [managePermission.id] },
    });

    commenter = await createUser('route-commenter', [commenterRol.id]);
    commenterToken = issueToken(commenter);
    moderator = await createUser('route-moderator', [moderatorRol.id]);
    moderatorToken = issueToken(moderator);
  });

  it('rechaza POST /comments sin token (is-authenticated)', async () => {
    const response = await request(strapi.server.httpServer)
      .post('/api/comments')
      .send({ data: { correction: 'anónimo' } });

    expect([401, 403]).toContain(response.status);
  });

  it('rechaza POST /comments sin COMMENT_DOCUMENT (has-permission)', async () => {
    await request(strapi.server.httpServer)
      .post('/api/comments')
      .set(authHeader())
      .send({ data: { correction: 'sin permiso' } })
      .expect(403);
  });

  it('acepta POST /comments con COMMENT_DOCUMENT y fija correctionTutor desde ctx.state.user', async () => {
    const response = await request(strapi.server.httpServer)
      .post('/api/comments')
      .set({ Authorization: `Bearer ${commenterToken}` })
      // El body intenta firmar como el moderador: el servidor lo ignora.
      .send({ data: { correction: 'con permiso', correctionTutor: moderator.id } })
      .expect(200);

    const stored = await strapi.db.query('api::comment.comment').findOne({
      where: { id: response.body.data.id },
      populate: { correctionTutor: true },
    });
    expect(stored.correctionTutor.id).toBe(commenter.id);
  });

  describe('update y delete: solo is-authenticated en la ruta, canModifyComment decide', () => {
    let ownComment;

    beforeEach(async () => {
      ownComment = await strapi.entityService.create('api::comment.comment', {
        data: { correction: 'del autor', correctionTutor: commenter.id, publishedAt: new Date() },
      });
    });

    it('rechaza PUT /comments/:id sin token', async () => {
      const response = await request(strapi.server.httpServer)
        .put(`/api/comments/${ownComment.id}`)
        .send({ data: { correction: 'anónimo' } });

      expect([401, 403]).toContain(response.status);
    });

    it('el autor puede editar sin MANAGE_COMMENTS', async () => {
      const response = await request(strapi.server.httpServer)
        .put(`/api/comments/${ownComment.id}`)
        .set({ Authorization: `Bearer ${commenterToken}` })
        .send({ data: { correction: 'editado por el autor' } })
        .expect(200);

      expect(response.body.data.attributes.correction).toBe('editado por el autor');
    });

    it('otro usuario sin MANAGE_COMMENTS recibe 403 (authorize dentro del controller)', async () => {
      await request(strapi.server.httpServer)
        .put(`/api/comments/${ownComment.id}`)
        .set(authHeader())
        .send({ data: { correction: 'intruso' } })
        .expect(403);
    });

    it('quien tiene MANAGE_COMMENTS puede borrar un comentario ajeno', async () => {
      await request(strapi.server.httpServer)
        .delete(`/api/comments/${ownComment.id}`)
        .set({ Authorization: `Bearer ${moderatorToken}` })
        .expect(200);

      const deleted = await strapi.db
        .query('api::comment.comment')
        .findOne({ where: { id: ownComment.id } });
      expect(deleted).toBeNull();
    });
  });
});
