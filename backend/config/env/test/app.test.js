const { setupStrapi, cleanupStrapi } = require("./helpers/strapi");

const strapi = require('@strapi/strapi');


require("./rols/index")
require("./users/index")
require("./projects/index")
require("./notifications/index")
require("./comments/index")
require("./documents/index")


beforeAll(async () => {
  await setupStrapi();
});

afterAll(async () => {
  await cleanupStrapi();
});
/* 
it("strapi is defined", () => {
  expect(strapi).toBeDefined();
}); */