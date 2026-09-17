const fs = require('fs');
const path = require('path');
const strapi = require('@strapi/strapi');

let instance;
let authToken;

// Content-types sobre los que la suite hace peticiones HTTP. Se conceden al rol
// `authenticated` al preparar el entorno, porque la base de test arranca vacía
// y sin permisos ninguna petición pasaría del 403.
const TEST_ACTIONS = [
  'api::project.project',
  'api::document.document',
  'api::comment.comment',
  'api::notification.notification',
  'api::rol.rol',
].flatMap((uid) => ['find', 'findOne', 'create', 'update', 'delete'].map((a) => `${uid}.${a}`));

TEST_ACTIONS.push(
  'plugin::users-permissions.user.find',
  'plugin::users-permissions.user.findOne'
);

const dbFile = () => path.resolve(process.cwd(), '.tmp/test.db');

async function setupStrapi() {
  // Base limpia en cada ejecución: los tests crean y borran registros, así que
  // arrastrar estado entre corridas hace que fallen según el orden.
  const file = dbFile();
  if (fs.existsSync(file)) fs.unlinkSync(file);

  instance = await strapi().load();
  instance.server.mount();
  const app = instance.server.app;
  app.use(instance.server.router.routes());
  app.use(instance.server.router.allowedMethods());

  await grantAuthenticatedPermissions();
  authToken = await createTestUserToken();
}

async function grantAuthenticatedPermissions() {
  const role = await instance.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });

  for (const action of TEST_ACTIONS) {
    const exists = await instance.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: role.id } });
    if (!exists) {
      await instance.db
        .query('plugin::users-permissions.permission')
        .create({ data: { action, role: role.id } });
    }
  }
}

async function createTestUserToken() {
  const role = await instance.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });

  const user = await instance.db.query('plugin::users-permissions.user').create({
    data: {
      username: 'test-runner',
      email: 'test-runner@docmentor.test',
      password: 'TestRunner123',
      provider: 'local',
      confirmed: true,
      blocked: false,
      isActive: true,
      role: role.id,
    },
  });

  return instance.plugins['users-permissions'].services.jwt.issue({ id: user.id });
}

// Cabecera lista para usar en supertest: `.set(authHeader())`.
const authHeader = () => ({ Authorization: `Bearer ${authToken}` });

async function cleanupStrapi() {
  await instance.destroy();

  const file = dbFile();
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

module.exports = { setupStrapi, cleanupStrapi, authHeader };
