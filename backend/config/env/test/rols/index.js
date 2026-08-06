
const request = require('supertest');
const { authHeader } = require('../helpers/strapi');

describe('GET-POST /rols', () => {



  it("should return Rols", async () => {
    const response = await request(strapi.server.httpServer)
      .get("/api/rols")
      .set(authHeader())
      .expect(200) // Expect response http code 200

    const { data } = response.body;

    // Asegúrate de que `data` esté definido
    expect(data).toBeDefined();

    // Verifica que data sea una array
    expect(Array.isArray(data)).toBe(true);

    console.log("Rols:", data); // Solo para verificar la respuesta
  });


  it("should create a new Rol", async () => {
    // `name` es obligatorio en el schema del rol; sin él la creación lanza
    // ValidationError antes de llegar a la comprobación.
    const mockRoleData = {
      name: "Profesor",
      rolType: "profesor",
    };

    await strapi.service('api::rol.rol').create({
      data: mockRoleData,
    });

    const response = await request(strapi.server.httpServer)
      .get("/api/rols")
      .set(authHeader())
      .expect(200);

    const { data } = response.body;

    expect(Array.isArray(data)).toBe(true);
    expect(data.some((rol) => rol.attributes.rolType === "profesor")).toBe(true);
  });
  
  

});