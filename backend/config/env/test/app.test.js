const { setupStrapi, cleanupStrapi } = require("./helpers/strapi");

require("./rols/index")
require("./users/index")
require("./projects/index")
require("./notifications/index")
require("./comments/index")
require("./documents/index")

// Arrancar Strapi contra una base recién creada (se crea el esquema entero)
// pasa de largo los 5s por defecto de jest, y al vencer el hook la carga sigue
// en segundo plano y revienta con "environment has been torn down".
const BOOT_TIMEOUT_MS = 120000;

beforeAll(async () => {
  await setupStrapi();
}, BOOT_TIMEOUT_MS);

afterAll(async () => {
  await cleanupStrapi();
}, BOOT_TIMEOUT_MS);
