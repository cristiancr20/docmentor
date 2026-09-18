const request = require('supertest');
const { authHeader } = require('../helpers/strapi');

// Rutas migradas a policies en US-009: notification, audit, rol, permission,
// setting y la extensión users-permissions. `test-runner` (authHeader) tiene
// sesión pero ningún rol propio, así que sirve para el caso "sin permiso"; el
// `admin` de este bloque tiene todos los códigos que exigen las rutas.
describe('policies en las rutas de administración', () => {
  const ADMIN_CODES = [
    'MANAGE_NOTIFICATIONS',
    'VIEW_AUDIT_LOGS',
    'MANAGE_ROLES',
    'MANAGE_PERMISSIONS',
    'MANAGE_SETTINGS',
    'VIEW_USERS',
    'MANAGE_USERS',
    'ANONYMIZE_USER',
  ];

  let admin;
  let adminToken;
  let adminRol;

  const issueToken = (user) =>
    strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

  const as = (token) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const permissions = [];
    for (const code of ADMIN_CODES) {
      // eslint-disable-next-line no-await-in-loop
      const permission = await strapi.db.query('api::permission.permission').create({
        data: { code, module: 'admin', isActive: true },
      });
      permissions.push(permission.id);
    }

    adminRol = await strapi.db.query('api::rol.rol').create({
      data: { name: 'RouteAdmin', rolType: 'superadmin', permissions },
    });

    const authenticatedRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    admin = await strapi.db.query('plugin::users-permissions.user').create({
      data: {
        username: 'route-admin',
        email: 'route-admin@docmentor.test',
        password: 'Password12345',
        provider: 'local',
        confirmed: true,
        blocked: false,
        isActive: true,
        role: authenticatedRole.id,
        rols: [adminRol.id],
      },
    });
    adminToken = issueToken(admin);
  });

  describe('users-permissions: /auth/me/permissions y /admin/users', () => {
    it('rechaza GET /auth/me/permissions sin token (is-authenticated)', async () => {
      await request(strapi.server.httpServer).get('/api/auth/me/permissions').expect(403);
    });

    it('GET /auth/me/permissions devuelve los códigos activos de ctx.state.user', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/api/auth/me/permissions')
        .set(as(adminToken))
        .expect(200);

      expect(response.body.data.sort()).toEqual([...ADMIN_CODES].sort());
    });

    it('GET /auth/me/permissions devuelve [] para un usuario sin rols', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/api/auth/me/permissions')
        .set(authHeader())
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('rechaza GET /admin/users sin VIEW_USERS (has-permission)', async () => {
      await request(strapi.server.httpServer).get('/api/admin/users').set(authHeader()).expect(403);
    });

    it('acepta GET /admin/users con VIEW_USERS', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/api/admin/users')
        .set(as(adminToken))
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.some((u) => u.id === admin.id)).toBe(true);
    });

    it('rechaza POST /admin/users sin MANAGE_USERS', async () => {
      await request(strapi.server.httpServer)
        .post('/api/admin/users')
        .set(authHeader())
        .send({ username: 'nope', email: 'nope@docmentor.test', password: 'Password12345' })
        .expect(403);
    });

    it('acepta POST /admin/users con MANAGE_USERS y audita con ctx.state.user', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/api/admin/users')
        .set(as(adminToken))
        .send({ username: 'created-by-admin', email: 'created@docmentor.test', password: 'Password12345' })
        .expect(200);

      expect(response.body.data.username).toBe('created-by-admin');

      const audit = await strapi.db.query('api::audit.audit').findOne({
        where: { action: 'CREATE_USER', entityId: response.body.data.id },
      });
      expect(audit).not.toBeNull();
      expect(audit.userId).toBe(admin.id);
    });

    it('rechaza DELETE /users/:id/anonymize sin ANONYMIZE_USER', async () => {
      await request(strapi.server.httpServer)
        .delete(`/api/users/${admin.id}/anonymize`)
        .set(authHeader())
        .expect(403);
    });
  });

  describe('notification', () => {
    it('rechaza GET /notifications/me sin token (is-authenticated)', async () => {
      await request(strapi.server.httpServer).get('/api/notifications/me').expect(403);
    });

    it('acepta GET /notifications/me con sesión', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/api/notifications/me')
        .set(authHeader())
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('rechaza POST /notifications sin MANAGE_NOTIFICATIONS', async () => {
      await request(strapi.server.httpServer)
        .post('/api/notifications')
        .set(authHeader())
        .send({ data: { message: 'sin permiso' } })
        .expect(403);
    });

    it('acepta POST /notifications con MANAGE_NOTIFICATIONS', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/api/notifications')
        .set(as(adminToken))
        .send({ data: { message: 'con permiso', isRead: false } })
        .expect(200);

      expect(response.body.data.attributes.message).toBe('con permiso');
    });
  });

  describe('audit', () => {
    it('rechaza GET /audit-logs sin token', async () => {
      const response = await request(strapi.server.httpServer).get('/api/audit-logs');
      expect([401, 403]).toContain(response.status);
    });

    it('rechaza GET /audit-logs sin VIEW_AUDIT_LOGS', async () => {
      await request(strapi.server.httpServer).get('/api/audit-logs').set(authHeader()).expect(403);
    });

    it('acepta GET /audit-logs con VIEW_AUDIT_LOGS', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/api/audit-logs')
        .set(as(adminToken))
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('rechaza GET /audit-logs/export sin VIEW_AUDIT_LOGS', async () => {
      await request(strapi.server.httpServer)
        .get('/api/audit-logs/export?format=xlsx')
        .set(authHeader())
        .expect(403);
    });
  });

  describe('rol y permission', () => {
    let permission;

    beforeAll(async () => {
      permission = await strapi.db.query('api::permission.permission').create({
        data: { code: 'ROUTE_TEST_PERMISSION', module: 'admin', isActive: true },
      });
    });

    it('rechaza GET /rols/:id/permissions sin token', async () => {
      await request(strapi.server.httpServer).get(`/api/rols/${adminRol.id}/permissions`).expect(403);
    });

    it('acepta GET /rols/:id/permissions con sesión', async () => {
      const response = await request(strapi.server.httpServer)
        .get(`/api/rols/${adminRol.id}/permissions`)
        .set(authHeader())
        .expect(200);

      expect(response.body.data.map((p) => p.code)).toEqual(expect.arrayContaining(ADMIN_CODES));
    });

    it('rechaza POST /rols/:id/permissions sin MANAGE_ROLES', async () => {
      await request(strapi.server.httpServer)
        .post(`/api/rols/${adminRol.id}/permissions`)
        .set(authHeader())
        .send({ permissionId: permission.id })
        .expect(403);
    });

    it('acepta POST y DELETE /rols/:id/permissions con MANAGE_ROLES', async () => {
      const added = await request(strapi.server.httpServer)
        .post(`/api/rols/${adminRol.id}/permissions`)
        .set(as(adminToken))
        .send({ permissionId: permission.id })
        .expect(200);
      expect(added.body.data.some((p) => p.id === permission.id)).toBe(true);

      const removed = await request(strapi.server.httpServer)
        .delete(`/api/rols/${adminRol.id}/permissions/${permission.id}`)
        .set(as(adminToken))
        .expect(200);
      expect(removed.body.data.some((p) => p.id === permission.id)).toBe(false);
    });

    it('rechaza POST /rols sin MANAGE_ROLES', async () => {
      await request(strapi.server.httpServer)
        .post('/api/rols')
        .set(authHeader())
        .send({ data: { name: 'Nope', rolType: 'nope' } })
        .expect(403);
    });

    it('rechaza POST /permissions sin MANAGE_PERMISSIONS y lo acepta con él', async () => {
      await request(strapi.server.httpServer)
        .post('/api/permissions')
        .set(authHeader())
        .send({ data: { code: 'NOPE', module: 'admin', isActive: true } })
        .expect(403);

      const response = await request(strapi.server.httpServer)
        .post('/api/permissions')
        .set(as(adminToken))
        .send({ data: { code: 'CREATED_BY_ADMIN', module: 'admin', isActive: true } })
        .expect(200);
      expect(response.body.data.attributes.code).toBe('CREATED_BY_ADMIN');
    });

    it('DELETE /permissions/:id con MANAGE_PERMISSIONS desactiva en vez de borrar', async () => {
      await request(strapi.server.httpServer)
        .delete(`/api/permissions/${permission.id}`)
        .set(as(adminToken))
        .expect(200);

      const stored = await strapi.db
        .query('api::permission.permission')
        .findOne({ where: { id: permission.id } });
      expect(stored).not.toBeNull();
      expect(stored.isActive).toBe(false);
    });
  });

  describe('setting', () => {
    it('acepta GET /settings con sesión sin permiso especial', async () => {
      await request(strapi.server.httpServer).get('/api/settings').set(authHeader()).expect(200);
    });

    it('rechaza POST /settings sin MANAGE_SETTINGS y lo acepta con él', async () => {
      await request(strapi.server.httpServer)
        .post('/api/settings')
        .set(authHeader())
        .send({ data: { email_notifications: 'nope@docmentor.test' } })
        .expect(403);

      const response = await request(strapi.server.httpServer)
        .post('/api/settings')
        .set(as(adminToken))
        .send({ data: { email_notifications: 'admin@docmentor.test' } })
        .expect(200);
      expect(response.body.data.attributes.email_notifications).toBe('admin@docmentor.test');
    });
  });
});
