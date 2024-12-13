/* const Strapi = require("@strapi/strapi");
const fs = require("fs");

let instance;

async function setupStrapi() {
  if (!instance) {
    await Strapi.createStrapi().load();
    instance = strapi;
    
    await instance.server.mount();
  }
  return instance;
}

async function cleanupStrapi() {
  const dbSettings = strapi.config.get("database.connection");

  //close server to release the db-file
  await strapi.server.httpServer.close();

  // close the connection to the database before deletion
  await strapi.db.connection.destroy();

  //delete test database after all tests have completed
  if (dbSettings && dbSettings.connection && dbSettings.connection.filename) {
    const tmpDbFile = dbSettings.connection.filename;
    if (fs.existsSync(tmpDbFile)) {
      fs.unlinkSync(tmpDbFile);
    }
  }
}

module.exports = { setupStrapi, cleanupStrapi }; */

const fs = require('fs');
const strapi = require('@strapi/strapi');

let instance;
let server;

async function setupStrapi() {
  instance = await strapi().load();
  instance.server.mount();
  const app = instance.server.app;
  app.use(instance.server.router.routes())
  app.use(instance.server.router.allowedMethods())
  server = instance.server.app.callback();

}

async function cleanupStrapi() {
  const dbSettings = instance.config.get("database.connection.default.settings");

  //close server to release the db-file
  await instance.destroy();
  //delete test database after all tests have completed

  if (dbSettings && dbSettings.filename) {
    const tmpDbFile = `${__dirname}/../${dbSettings.filename}`;
    if (fs.existsSync(tmpDbFile)) {
      fs.unlinkSync(tmpDbFile);
    }
  }
}


module.exports = { setupStrapi, cleanupStrapi }; 