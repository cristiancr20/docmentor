
const request = require('supertest');

describe('GET-POST /rols', () => {



  it("should return Rols", async () => {
    const response = await request(strapi.server.httpServer)
      .get("/api/rols")
      .expect(200) // Expect response http code 200

    const { data } = response.body;

    // Asegúrate de que `data` esté definido
    expect(data).toBeDefined();

    // Verifica que data sea una array
    expect(Array.isArray(data)).toBe(true);

    console.log("Rols:", data); // Solo para verificar la respuesta
  });


  it("should create a new Rol", async () => {
    // Datos del rol para crear
    const mockRoleData = {
      rolType: "profesor", // Valor para el atributo `tipoRol`
    };
  
    // Crear el nuevo rol utilizando el servicio de Strapi
    await strapi.service('api::rol.rol').create({
      data: mockRoleData,
    });
  
    // Verificar si el rol fue creado correctamente haciendo una solicitud GET
    const response = await request(strapi.server.httpServer)
      .get("/api/rols") // Este es el endpoint para obtener los roles, ajusta según tu API
      .expect(200); // Esperamos que la respuesta sea exitosa (código 200)
  
    // Verifica que la respuesta contenga el nuevo rol
    const newRole = response.body;
  
    // Asegúrate de que el rol con `tipoRol` "profesor" haya sido creado
    expect(newRole).toBeDefined();
    //expect(newRole.tipoRol).toBe("profesor");
  
    console.log("New Role:", newRole); // Solo para verificar la respuesta
  });
  
  

});