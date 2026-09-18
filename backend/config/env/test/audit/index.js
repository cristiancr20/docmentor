const request = require('supertest');

// `logFromCtx` (US-011) es el único punto de entrada de los controllers a la
// auditoría: resuelve usuario e IP desde el ctx y delega en `logAudit`.
describe('servicio de auditoría: logFromCtx', () => {
  const audit = () => strapi.service('api::audit.audit');

  const fakeCtx = ({ userId, ip, forwardedFor } = {}) => ({
    state: { user: userId ? { id: userId } : undefined },
    request: { ip, headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : {} },
  });

  it('registra acción, entidad, usuario, before/after e IP de ctx.request.ip', async () => {
    const entry = await audit().logFromCtx(fakeCtx({ userId: 42, ip: '10.0.0.7' }), {
      action: 'TEST_ACTION',
      entity: 'document',
      entityId: '15',
      before: { status: 'a' },
      after: { status: 'b' },
    });

    expect(entry).not.toBeNull();
    const stored = await strapi.db.query('api::audit.audit').findOne({ where: { id: entry.id } });
    expect(stored).toMatchObject({
      action: 'TEST_ACTION',
      entityType: 'document',
      entityId: 15,
      userId: 42,
      oldValue: { status: 'a' },
      newValue: { status: 'b' },
      ipAddress: '10.0.0.7',
    });
  });

  it('sin ctx.request.ip toma el primer valor de x-forwarded-for', async () => {
    const entry = await audit().logFromCtx(
      fakeCtx({ userId: 42, forwardedFor: '203.0.113.9, 10.0.0.1' }),
      { action: 'TEST_FORWARDED', entity: 'document', entityId: 16 }
    );

    expect(entry.ipAddress).toBe('203.0.113.9');
    expect(entry.oldValue).toBeNull();
    expect(entry.newValue).toBeNull();
  });

  it('sin usuario en ctx.state no registra nada ni lanza', async () => {
    const entry = await audit().logFromCtx(fakeCtx({ ip: '10.0.0.7' }), {
      action: 'TEST_ANON',
      entity: 'document',
      entityId: 17,
    });

    expect(entry).toBeNull();
    const stored = await strapi.db.query('api::audit.audit').findOne({
      where: { action: 'TEST_ANON' },
    });
    expect(stored).toBeNull();
  });

  it('un controller migrado sigue auditando la acción con usuario e IP', async () => {
    const permission = await strapi.db.query('api::permission.permission').create({
      data: { code: 'CREATE_DOCUMENT', module: 'documents', isActive: true },
    });
    const rol = await strapi.db.query('api::rol.rol').create({
      data: {
        name: 'audit-superadmin',
        rolType: 'superadmin',
        isActive: true,
        permissions: [permission.id],
      },
    });
    const authenticatedRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });
    const author = await strapi.db.query('plugin::users-permissions.user').create({
      data: {
        username: 'audit-author',
        email: 'audit-author@docmentor.test',
        password: 'AuditAuthor123',
        provider: 'local',
        confirmed: true,
        blocked: false,
        isActive: true,
        role: authenticatedRole.id,
        rols: [rol.id],
      },
    });
    const token = strapi.plugins['users-permissions'].services.jwt.issue({ id: author.id });

    const response = await request(strapi.server.httpServer)
      .post('/api/documents')
      .set({ Authorization: `Bearer ${token}` })
      .send({ data: { title: 'Auditado vía logFromCtx', isRevised: false } })
      .expect(200);

    const stored = await strapi.db.query('api::audit.audit').findOne({
      where: { action: 'CREATE_DOCUMENT', entityId: response.body.data.id },
    });
    expect(stored).not.toBeNull();
    expect(stored.userId).toBe(author.id);
    expect(stored.entityType).toBe('document');
    // supertest llega por loopback: Koa resuelve la IP y no queda vacía.
    expect(stored.ipAddress).not.toBe('');
    expect(stored.newValue).toMatchObject({ id: response.body.data.id });
  });
});
