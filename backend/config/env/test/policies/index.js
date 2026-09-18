const jwt = require('jsonwebtoken');

// Las policies se prueban llamando al handler registrado en Strapi
// (`strapi.policy('global::...')`) con el mismo contexto que les pasa el
// middleware de rutas: `(policyContext, config, { strapi })`. Así no hace falta
// enganchar ninguna ruta de la app para ejercitarlas.
const PERMISSION_CODE = 'policies.test.read';
const INACTIVE_PERMISSION_CODE = 'policies.test.inactive';

const fakeContext = (authorization) => ({
  request: { headers: authorization ? { authorization } : {} },
  state: {},
});

const runPolicy = (name, ctx, config = {}) => strapi.policy(name)(ctx, config, { strapi });

const issueToken = (user, options) =>
  strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id }, options);

const createUser = (suffix, extra = {}) =>
  strapi.db.query('plugin::users-permissions.user').create({
    data: {
      username: `policy-${suffix}`,
      email: `policy-${suffix}@docmentor.test`,
      password: 'Policy12345',
      provider: 'local',
      confirmed: true,
      blocked: false,
      isActive: true,
      ...extra,
    },
  });

describe('policies global::is-authenticated y global::has-permission', () => {
  let rol;
  let activeUser;
  let blockedUser;
  let inactiveUser;
  let userWithoutRole;

  beforeAll(async () => {
    const permission = await strapi.db.query('api::permission.permission').create({
      data: { code: PERMISSION_CODE, module: 'policies', isActive: true },
    });
    const inactivePermission = await strapi.db.query('api::permission.permission').create({
      data: { code: INACTIVE_PERMISSION_CODE, module: 'policies', isActive: false },
    });

    rol = await strapi.db.query('api::rol.rol').create({
      data: {
        name: 'PolicyTester',
        rolType: 'policy-tester',
        permissions: [permission.id, inactivePermission.id],
      },
    });

    activeUser = await createUser('active', { rols: [rol.id] });
    blockedUser = await createUser('blocked', { rols: [rol.id], blocked: true });
    inactiveUser = await createUser('inactive', { rols: [rol.id], isActive: false });
    userWithoutRole = await createUser('no-role');
  });

  it('registra ambas policies bajo el namespace global::', () => {
    expect(typeof strapi.policy('global::is-authenticated')).toBe('function');
    expect(typeof strapi.policy('global::has-permission')).toBe('function');
  });

  describe('is-authenticated', () => {
    it('devuelve false sin cabecera Authorization', async () => {
      const ctx = fakeContext();
      await expect(runPolicy('global::is-authenticated', ctx)).resolves.toBe(false);
      expect(ctx.state.user).toBeUndefined();
    });

    it('devuelve false con un esquema distinto de Bearer', async () => {
      const ctx = fakeContext(`Basic ${issueToken(activeUser)}`);
      await expect(runPolicy('global::is-authenticated', ctx)).resolves.toBe(false);
    });

    it('devuelve false con un token que no es un JWT', async () => {
      const ctx = fakeContext('Bearer esto-no-es-un-jwt');
      await expect(runPolicy('global::is-authenticated', ctx)).resolves.toBe(false);
      expect(ctx.state.user).toBeUndefined();
    });

    it('devuelve false con un token firmado con otro secret', async () => {
      const forged = jwt.sign({ id: activeUser.id }, 'otro-secret-cualquiera', {
        algorithm: 'HS256',
      });
      const ctx = fakeContext(`Bearer ${forged}`);
      await expect(runPolicy('global::is-authenticated', ctx)).resolves.toBe(false);
    });

    it('devuelve false con un token expirado', async () => {
      const ctx = fakeContext(`Bearer ${issueToken(activeUser, { expiresIn: -60 })}`);
      await expect(runPolicy('global::is-authenticated', ctx)).resolves.toBe(false);
    });

    it('devuelve false si el token pertenece a un usuario que ya no existe', async () => {
      const ghost = await createUser('ghost');
      await strapi.db.query('plugin::users-permissions.user').delete({ where: { id: ghost.id } });

      const ctx = fakeContext(`Bearer ${issueToken(ghost)}`);
      await expect(runPolicy('global::is-authenticated', ctx)).resolves.toBe(false);
    });

    it('devuelve false para un usuario bloqueado aunque el token sea válido', async () => {
      const ctx = fakeContext(`Bearer ${issueToken(blockedUser)}`);
      await expect(runPolicy('global::is-authenticated', ctx)).resolves.toBe(false);
      expect(ctx.state.user).toBeUndefined();
    });

    it('devuelve false para un usuario con isActive en false', async () => {
      const ctx = fakeContext(`Bearer ${issueToken(inactiveUser)}`);
      await expect(runPolicy('global::is-authenticated', ctx)).resolves.toBe(false);
    });

    it('devuelve true y deja el usuario con rols.permissions en ctx.state.user', async () => {
      const ctx = fakeContext(`Bearer ${issueToken(activeUser)}`);
      await expect(runPolicy('global::is-authenticated', ctx)).resolves.toBe(true);

      expect(ctx.state.user).toMatchObject({ id: activeUser.id, username: 'policy-active' });
      expect(ctx.state.user.rols).toHaveLength(1);
      expect(ctx.state.user.rols[0].id).toBe(rol.id);
      expect(ctx.state.user.rols[0].permissions.map((p) => p.code).sort()).toEqual(
        [INACTIVE_PERMISSION_CODE, PERMISSION_CODE].sort()
      );
    });
  });

  describe('has-permission', () => {
    // Carga `ctx.state.user` exactamente como lo dejaría is-authenticated.
    const authenticatedContext = async (user) => {
      const ctx = fakeContext(`Bearer ${issueToken(user)}`);
      await runPolicy('global::is-authenticated', ctx);
      return ctx;
    };

    it('devuelve false si ctx.state.user no existe', async () => {
      const ctx = fakeContext();
      expect(runPolicy('global::has-permission', ctx, { code: PERMISSION_CODE })).toBe(false);
    });

    it('devuelve false si la ruta no define config.code', async () => {
      const ctx = await authenticatedContext(activeUser);
      expect(runPolicy('global::has-permission', ctx, {})).toBe(false);
    });

    it('devuelve false si el usuario no tiene ningún rol', async () => {
      const ctx = await authenticatedContext(userWithoutRole);
      expect(ctx.state.user).toBeDefined();
      expect(runPolicy('global::has-permission', ctx, { code: PERMISSION_CODE })).toBe(false);
    });

    it('devuelve false si el permiso no está en ninguno de sus roles', async () => {
      const ctx = await authenticatedContext(activeUser);
      expect(runPolicy('global::has-permission', ctx, { code: 'policies.test.missing' })).toBe(
        false
      );
    });

    it('devuelve false si el permiso existe pero está inactivo', async () => {
      const ctx = await authenticatedContext(activeUser);
      expect(
        runPolicy('global::has-permission', ctx, { code: INACTIVE_PERMISSION_CODE })
      ).toBe(false);
    });

    it('devuelve true si algún rol tiene el permiso activo', async () => {
      const ctx = await authenticatedContext(activeUser);
      expect(runPolicy('global::has-permission', ctx, { code: PERMISSION_CODE })).toBe(true);
    });
  });

  // Helper que usan los controllers cuando el permiso depende del registro
  // (p. ej. `canModifyComment`): misma regla que la policy, sin tocar la BD.
  describe('userHasPermission (helper exportado por has-permission)', () => {
    const { userHasPermission } = require('../../../../src/policies/has-permission');

    it('sigue registrada como policy aunque exporte el helper', () => {
      expect(typeof strapi.policy('global::has-permission')).toBe('function');
      expect(typeof strapi.policy('global::has-permission').userHasPermission).toBe('function');
    });

    it('devuelve false sin usuario, sin código o sin rols', () => {
      expect(userHasPermission(null, PERMISSION_CODE)).toBe(false);
      expect(userHasPermission({ id: 1 }, PERMISSION_CODE)).toBe(false);
      expect(userHasPermission({ id: 1, rols: [] }, PERMISSION_CODE)).toBe(false);
      expect(userHasPermission({ id: 1, rols: [{ permissions: [] }] }, '')).toBe(false);
    });

    it('respeta isActive y el código sobre el usuario que deja is-authenticated', async () => {
      const ctx = fakeContext(`Bearer ${issueToken(activeUser)}`);
      await runPolicy('global::is-authenticated', ctx);
      expect(userHasPermission(ctx.state.user, PERMISSION_CODE)).toBe(true);
      expect(userHasPermission(ctx.state.user, INACTIVE_PERMISSION_CODE)).toBe(false);
      expect(userHasPermission(ctx.state.user, 'policies.test.missing')).toBe(false);
    });
  });
});
