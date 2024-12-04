const Strapi = require("@strapi/strapi");
const fs = require("fs");

let instance;

async function setupStrapi() {
  if (!instance) {
    instance = await Strapi().load(); // Aquí aseguramos que la instancia sea correcta.
    await instance.server.mount();
  }
  return instance;
}

async function cleanupStrapi() {
  const dbSettings = instance.config.get("database.connection"); // Usa instance en lugar de strapi

  // Cierra el servidor para liberar el archivo de la base de datos
  await instance.server.httpServer.close();

  // Cierra la conexión a la base de datos antes de eliminarla
  await instance.db.connection.destroy();

  // Elimina la base de datos de prueba después de completar las pruebas
  if (dbSettings && dbSettings.connection && dbSettings.connection.filename) {
    const tmpDbFile = dbSettings.connection.filename;
    if (fs.existsSync(tmpDbFile)) {
      fs.unlinkSync(tmpDbFile);
    }
  }
}

module.exports = { setupStrapi, cleanupStrapi };

