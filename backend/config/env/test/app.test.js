const fs = require('fs');
const { setupStrapi, cleanupStrapi } = require("./helpers/strapi");
require("./user")

beforeAll(async () => {
  await setupStrapi();
});

afterAll(async () => {
  await cleanupStrapi();
});

it("strapi es definido", () => {
  expect(strapi).toBeDefined();
});